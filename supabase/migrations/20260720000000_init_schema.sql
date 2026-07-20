-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  id_proof_url text,
  kyc_status text not null default 'pending' check (kyc_status in ('pending','verified','rejected')),
  is_admin boolean not null default false,
  completed_trades_count integer not null default 0,
  total_volume_usd numeric not null default 0,
  total_volume_inr numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  side text not null check (side in ('buy','sell')),
  asset text not null default 'USDT',
  fiat_currency text not null default 'INR' check (fiat_currency in ('INR','USD')),
  crypto_amount numeric not null,
  price_per_unit numeric not null,
  payment_method text,
  notes text,
  status text not null default 'active' check (status in ('active','paused','closed')),
  created_at timestamptz not null default now()
);

-- Escrow orders table
create table if not exists public.escrow_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  crypto_amount numeric,
  fiat_amount numeric,
  fiat_currency text,
  status text not null default 'open' check (status in ('open','pending_fiat_payment','pending_crypto_release','pending_admin_approval','completed','disputed','cancelled')),
  buyer_marked_paid_at timestamptz,
  seller_marked_released_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint escrow_orders_distinct_parties check (buyer_id <> seller_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.escrow_orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text,
  created_at timestamptz not null default now()
);

-- Trigger function to auto-create profile on new auth user.
-- Pulls full_name from whichever key the OAuth provider populated
-- (Google sends "full_name" or "name" depending on flow/version).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep escrow_orders.updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists escrow_orders_set_updated_at on public.escrow_orders;
create trigger escrow_orders_set_updated_at
before update on public.escrow_orders
for each row execute function public.set_updated_at();

-- Admin-only completion path. SECURITY DEFINER means this runs with the
-- function owner's privileges and bypasses RLS internally -- the is_admin
-- check below is therefore the ONLY gate on completion, since direct table
-- UPDATEs to status='completed' are blocked for non-admins by the RLS
-- policies further down. Completion must always go through this RPC.
create or replace function public.approve_escrow_order(order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin boolean;
  v_order public.escrow_orders;
begin
  select is_admin into v_admin from public.profiles where id = auth.uid();
  if not coalesce(v_admin, false) then
    raise exception 'Only admins can approve escrow orders';
  end if;

  select * into v_order from public.escrow_orders where id = order_id;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'completed' then
    raise exception 'Order already completed';
  end if;

  update public.escrow_orders
  set status = 'completed',
      approved_by = auth.uid(),
      approved_at = now()
  where id = order_id;

  if v_order.fiat_currency = 'USD' then
    update public.profiles
    set completed_trades_count = completed_trades_count + 1,
        total_volume_usd = total_volume_usd + coalesce(v_order.fiat_amount, 0)
    where id in (v_order.buyer_id, v_order.seller_id);
  elsif v_order.fiat_currency = 'INR' then
    update public.profiles
    set completed_trades_count = completed_trades_count + 1,
        total_volume_inr = total_volume_inr + coalesce(v_order.fiat_amount, 0)
    where id in (v_order.buyer_id, v_order.seller_id);
  end if;
end;
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.escrow_orders enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select using (auth.uid() = id);

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (auth.uid() = id)
with check (
  auth.uid() = id
  -- self-service updates can't grant admin or forge trust stats; those only
  -- change via approve_escrow_order() (SECURITY DEFINER, bypasses RLS) or a
  -- direct admin edit through profiles_update_admin below.
  and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  and completed_trades_count = (select p.completed_trades_count from public.profiles p where p.id = auth.uid())
  and total_volume_usd = (select p.total_volume_usd from public.profiles p where p.id = auth.uid())
  and total_volume_inr = (select p.total_volume_inr from public.profiles p where p.id = auth.uid())
);

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Listings policies
drop policy if exists listings_select_active on public.listings;
create policy listings_select_active on public.listings
for select using (
  status = 'active'
  or user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists listings_insert_self on public.listings;
create policy listings_insert_self on public.listings
for insert with check (auth.uid() = user_id);

drop policy if exists listings_update_self on public.listings;
create policy listings_update_self on public.listings
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists listings_delete_self on public.listings;
create policy listings_delete_self on public.listings
for delete using (auth.uid() = user_id);

-- Escrow orders policies
drop policy if exists escrow_select_parties on public.escrow_orders;
create policy escrow_select_parties on public.escrow_orders
for select using (
  auth.uid() = buyer_id
  or auth.uid() = seller_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

drop policy if exists escrow_insert_parties on public.escrow_orders;
create policy escrow_insert_parties on public.escrow_orders
for insert with check (
  (auth.uid() = buyer_id or auth.uid() = seller_id)
  and status = 'open'
  and approved_by is null
  and approved_at is null
);

-- Buyer/seller can move an order through the non-terminal states (mark paid,
-- mark released, request approval, cancel/dispute) but can NEVER set it to
-- 'completed' or touch the approval columns themselves -- that's the whole
-- point of the admin-approval requirement, so it's enforced here, not just
-- in application code.
drop policy if exists escrow_update_parties on public.escrow_orders;
create policy escrow_update_parties on public.escrow_orders
for update using (
  auth.uid() = buyer_id or auth.uid() = seller_id
)
with check (
  (auth.uid() = buyer_id or auth.uid() = seller_id)
  and status in ('pending_fiat_payment','pending_crypto_release','pending_admin_approval','disputed','cancelled')
  and approved_by is null
  and approved_at is null
);

drop policy if exists escrow_update_admin on public.escrow_orders;
create policy escrow_update_admin on public.escrow_orders
for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Messages policies
drop policy if exists messages_select_parties on public.messages;
create policy messages_select_parties on public.messages
for select using (
  exists (
    select 1 from public.escrow_orders e
    where e.id = order_id
    and (
      e.buyer_id = auth.uid()
      or e.seller_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    )
  )
);

drop policy if exists messages_insert_parties on public.messages;
create policy messages_insert_parties on public.messages
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.escrow_orders e
    where e.id = order_id
    and (
      e.buyer_id = auth.uid()
      or e.seller_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    )
  )
);

-- Safe public subset of profiles: counterparties in a trade and the
-- leaderboard both need to see a user's name and trust stats, but the base
-- `profiles` RLS above only allows self or admin to read a row (phone and
-- id_proof_url must never be exposed to other regular users). This view
-- deliberately runs with the view owner's privileges (security_invoker is
-- OFF, which is the Postgres default) so it bypasses the base table's RLS --
-- that's intentional here, not an oversight, and is safe because the SELECT
-- list below only re-exposes non-sensitive columns. Do not "fix" this by
-- flipping security_invoker to on; that would just make the view redundant
-- with the restrictive base policies and break counterparty/leaderboard reads.
create or replace view public.public_profiles
with (security_invoker = false)
as
select id, full_name, kyc_status, completed_trades_count, total_volume_usd, total_volume_inr, created_at
from public.profiles;

grant select on public.public_profiles to authenticated;

-- Storage bucket for KYC ID documents (private -- never public)
insert into storage.buckets (id, name, public)
values ('id-proofs', 'id-proofs', false)
on conflict (id) do update set public = false;

-- Storage policies: a user can read/write only files under their own
-- uid-prefixed folder path (e.g. "<uid>/passport.jpg"); admins can read all.
drop policy if exists id_proofs_select_self on storage.objects;
create policy id_proofs_select_self on storage.objects
for select using (
  bucket_id = 'id-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists id_proofs_insert_self on storage.objects;
create policy id_proofs_insert_self on storage.objects
for insert with check (
  bucket_id = 'id-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists id_proofs_select_admin on storage.objects;
create policy id_proofs_select_admin on storage.objects
for select using (
  bucket_id = 'id-proofs'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

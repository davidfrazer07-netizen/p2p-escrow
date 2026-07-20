"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Listing, ListingSide, FiatCurrency } from "@/lib/types";
import { GlassCard, SectionTitle, Pill, GhostButton } from "@/components/ui";

type NewListing = {
  side: ListingSide;
  asset: string;
  fiat_currency: FiatCurrency;
  crypto_amount: string;
  price_per_unit: string;
  payment_method: string;
  notes: string;
};

type TradeState = { loading: boolean; error: string | null };

const EMPTY_FORM: NewListing = {
  side: "sell",
  asset: "USDT",
  fiat_currency: "INR",
  crypto_amount: "",
  price_per_unit: "",
  payment_method: "",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent";

export default function ListingsTab({
  profile,
  onOpenOrder,
}: {
  profile: Profile;
  onOpenOrder: (orderId: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState<NewListing>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tradeStates, setTradeStates] = useState<Record<string, TradeState>>({});

  async function loadListings() {
    if (!supabase) return;
    setLoadingList(true);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .neq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (!error && data) setListings(data as Listing[]);
    setLoadingList(false);
  }

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setFormError(null);
    const crypto_amount = parseFloat(form.crypto_amount);
    const price_per_unit = parseFloat(form.price_per_unit);
    if (isNaN(crypto_amount) || isNaN(price_per_unit) || crypto_amount <= 0 || price_per_unit <= 0) {
      setFormError("Amount and price must be positive numbers");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("listings").insert({
      user_id: profile.id,
      side: form.side,
      asset: form.asset || "USDT",
      fiat_currency: form.fiat_currency,
      crypto_amount,
      price_per_unit,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
      status: "active",
    });
    if (error) {
      setFormError(error.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    loadListings();
  }

  async function handleTrade(listing: Listing) {
    if (!supabase) return;
    setTradeStates((s) => ({ ...s, [listing.id]: { loading: true, error: null } }));
    const fiat_amount = listing.crypto_amount * listing.price_per_unit;
    const buyer_id = listing.side === "sell" ? profile.id : listing.user_id;
    const seller_id = listing.side === "sell" ? listing.user_id : profile.id;
    const { data, error } = await supabase
      .from("escrow_orders")
      .insert({
        listing_id: listing.id,
        buyer_id,
        seller_id,
        crypto_amount: listing.crypto_amount,
        fiat_amount,
        fiat_currency: listing.fiat_currency,
        status: "open",
      })
      .select("id")
      .single();
    if (error || !data) {
      setTradeStates((s) => ({ ...s, [listing.id]: { loading: false, error: error?.message ?? "Failed to open order" } }));
      return;
    }
    setTradeStates((s) => ({ ...s, [listing.id]: { loading: false, error: null } }));
    onOpenOrder(data.id as string);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Listings</SectionTitle>
        <GhostButton accent onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Post a listing"}
        </GhostButton>
      </div>

      {showForm && (
        <GlassCard>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-2">
              <Pill active={form.side === "sell"} onClick={() => setForm((f) => ({ ...f, side: "sell" }))}>
                I&apos;m selling crypto
              </Pill>
              <Pill active={form.side === "buy"} onClick={() => setForm((f) => ({ ...f, side: "buy" }))}>
                I&apos;m buying crypto
              </Pill>
            </div>

            <input
              className={inputClass}
              placeholder="Asset (default USDT)"
              value={form.asset}
              onChange={(e) => setForm((f) => ({ ...f, asset: e.target.value }))}
            />

            <div className="flex gap-2">
              <Pill active={form.fiat_currency === "INR"} onClick={() => setForm((f) => ({ ...f, fiat_currency: "INR" }))}>
                INR
              </Pill>
              <Pill active={form.fiat_currency === "USD"} onClick={() => setForm((f) => ({ ...f, fiat_currency: "USD" }))}>
                USD
              </Pill>
            </div>

            <input
              type="number"
              step="any"
              className={inputClass}
              placeholder="Crypto amount"
              value={form.crypto_amount}
              onChange={(e) => setForm((f) => ({ ...f, crypto_amount: e.target.value }))}
            />

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted">Your price — not a market rate</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="Price per unit"
                value={form.price_per_unit}
                onChange={(e) => setForm((f) => ({ ...f, price_per_unit: e.target.value }))}
              />
            </div>

            <input
              className={inputClass}
              placeholder="Payment method (e.g. UPI/Bank Wire)"
              value={form.payment_method}
              onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
            />

            <textarea
              className={inputClass}
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />

            {formError && <p className="text-xs text-bear">{formError}</p>}

            <GhostButton accent type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Create listing"}
            </GhostButton>
          </form>
        </GlassCard>
      )}

      {loadingList ? (
        <p className="text-sm text-muted">Loading listings...</p>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const ts = tradeStates[l.id] ?? { loading: false, error: null };
            return (
              <GlassCard key={l.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Pill active>{l.side === "sell" ? "Selling" : "Buying"}</Pill>
                  <span className="text-sm text-text">
                    {l.crypto_amount} {l.asset}
                  </span>
                </div>
                <div className="text-sm text-text">
                  {l.price_per_unit} {l.fiat_currency} per unit
                </div>
                {l.payment_method && <div className="text-xs text-muted">{l.payment_method}</div>}
                {l.notes && <div className="text-xs text-muted">{l.notes}</div>}
                {ts.error && <p className="text-xs text-bear">{ts.error}</p>}
                <GhostButton accent disabled={ts.loading} onClick={() => handleTrade(l)}>
                  {ts.loading ? "Opening..." : "Trade"}
                </GhostButton>
              </GlassCard>
            );
          })}
          {listings.length === 0 && <p className="text-sm text-muted">No active listings from others yet.</p>}
        </div>
      )}
    </div>
  );
}

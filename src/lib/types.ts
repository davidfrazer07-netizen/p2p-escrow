export type KycStatus = "pending" | "verified" | "rejected";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  id_proof_url: string | null;
  kyc_status: KycStatus;
  is_admin: boolean;
  completed_trades_count: number;
  total_volume_usd: number;
  total_volume_inr: number;
  created_at: string;
};

export type PublicProfile = {
  id: string;
  full_name: string | null;
  kyc_status: KycStatus;
  completed_trades_count: number;
  total_volume_usd: number;
  total_volume_inr: number;
  created_at: string;
};

export type ListingSide = "buy" | "sell";
export type FiatCurrency = "INR" | "USD";
export type ListingStatus = "active" | "paused" | "closed";

export type Listing = {
  id: string;
  user_id: string;
  side: ListingSide;
  asset: string;
  fiat_currency: FiatCurrency;
  crypto_amount: number;
  price_per_unit: number;
  payment_method: string | null;
  notes: string | null;
  status: ListingStatus;
  created_at: string;
};

export type EscrowStatus =
  | "open"
  | "pending_fiat_payment"
  | "pending_crypto_release"
  | "pending_admin_approval"
  | "completed"
  | "disputed"
  | "cancelled";

export type EscrowOrder = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  crypto_amount: number | null;
  fiat_amount: number | null;
  fiat_currency: FiatCurrency | null;
  status: EscrowStatus;
  buyer_marked_paid_at: string | null;
  seller_marked_released_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

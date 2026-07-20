"use client";

import { useEffect, useState } from "react";
import type { Profile, EscrowOrder } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { GlassCard, SectionTitle, GhostButton, StatusPill } from "@/components/ui";

type KycRow = Profile & { _err?: string; _busy?: boolean };

export default function AdminTab({
  onOpenOrder,
}: {
  profile: Profile;
  onOpenOrder: (orderId: string) => void;
}) {
  const [kycRows, setKycRows] = useState<KycRow[]>([]);
  const [kycLoading, setKycLoading] = useState(true);

  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("profiles")
      .select("*")
      .eq("kyc_status", "pending")
      .not("id_proof_url", "is", null)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        setKycRows(error ? [] : (data as KycRow[]));
        setKycLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("escrow_orders")
      .select("*")
      .eq("status", "pending_admin_approval")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        setOrders(error ? [] : (data as EscrowOrder[]));
        setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function viewId(row: KycRow) {
    if (!supabase || !row.id_proof_url) return;
    setKycRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _busy: true, _err: undefined } : r)));
    const { data, error } = await supabase.storage.from("id-proofs").createSignedUrl(row.id_proof_url, 60 * 5);
    if (error || !data?.signedUrl) {
      setKycRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _busy: false, _err: "Failed to load ID" } : r)));
      return;
    }
    window.open(data.signedUrl, "_blank");
    setKycRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _busy: false, _err: undefined } : r)));
  }

  async function setKyc(row: KycRow, status: "verified" | "rejected") {
    if (!supabase) return;
    setKycRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _busy: true, _err: undefined } : r)));
    const { error } = await supabase.from("profiles").update({ kyc_status: status }).eq("id", row.id);
    if (error) {
      setKycRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, _busy: false, _err: "Update failed" } : r)));
      return;
    }
    setKycRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <SectionTitle>Pending KYC review</SectionTitle>
        {kycLoading && <p className="mt-2 text-sm text-muted">Loading...</p>}
        {!kycLoading && kycRows.length === 0 && (
          <p className="mt-2 text-sm text-muted">No pending KYC submissions.</p>
        )}
        <div className="mt-2 space-y-3">
          {kycRows.map((row) => (
            <GlassCard key={row.id} className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-sm text-text">{row.full_name || "Unnamed"}</span>
                <span className="text-xs text-muted">{row.email}</span>
                <span className="text-xs text-muted">{row.phone || "—"}</span>
              </div>
              {row._err && <span className="text-xs text-bear">{row._err}</span>}
              <div className="flex flex-wrap gap-2">
                <GhostButton onClick={() => viewId(row)} disabled={row._busy}>
                  View ID
                </GhostButton>
                <GhostButton
                  accent
                  onClick={() => setKyc(row, "verified")}
                  disabled={row._busy}
                >
                  Verify
                </GhostButton>
                <GhostButton
                  className="border-bear/70 text-bear"
                  onClick={() => setKyc(row, "rejected")}
                  disabled={row._busy}
                >
                  Reject
                </GhostButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Pending trade approvals</SectionTitle>
        {ordersLoading && <p className="mt-2 text-sm text-muted">Loading...</p>}
        {!ordersLoading && orders.length === 0 && (
          <p className="mt-2 text-sm text-muted">No trades waiting on approval.</p>
        )}
        <div className="mt-2 space-y-3">
          {orders.map((o) => (
            <GlassCard
              key={o.id}
              className="flex cursor-pointer items-center justify-between"
              onClick={() => onOpenOrder(o.id)}
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm text-accent-hi">{o.crypto_amount ?? "—"} crypto</span>
                <span className="text-sm text-muted">
                  {o.fiat_amount ?? "—"} {o.fiat_currency ?? ""}
                </span>
                <span className="text-xs text-muted">{new Date(o.created_at).toLocaleString()}</span>
              </div>
              <StatusPill status={o.status} />
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

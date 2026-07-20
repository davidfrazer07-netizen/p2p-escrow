"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, EscrowOrder, PublicProfile } from "@/lib/types";
import { GlassCard, SectionTitle, GhostButton, StatusPill } from "@/components/ui";
import Chat from "./Chat";

const TERMINAL: EscrowOrder["status"][] = ["completed", "cancelled", "disputed"];

export default function OrderDetail({
  orderId,
  profile,
  onClose,
}: {
  orderId: string;
  profile: Profile;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<EscrowOrder | null>(null);
  const [counterparty, setCounterparty] = useState<PublicProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    client
      .from("escrow_orders")
      .select("*")
      .eq("id", orderId)
      .single()
      .then(async ({ data }) => {
        if (!active || !data) return;
        const o = data as EscrowOrder;
        setOrder(o);
        const cpId = o.buyer_id === profile.id ? o.seller_id : o.buyer_id;
        const { data: cp } = await client.from("public_profiles").select("*").eq("id", cpId).single();
        if (active && cp) setCounterparty(cp as PublicProfile);
      });

    const channel = client
      .channel(`escrow:${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "escrow_orders", filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new as EscrowOrder),
      )
      .subscribe();

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [orderId, profile.id]);

  if (!order) {
    return (
      <div className="space-y-4">
        <GhostButton onClick={onClose}>Back</GhostButton>
        <GlassCard>
          <p className="text-sm text-muted">Loading...</p>
        </GlassCard>
      </div>
    );
  }

  const isBuyer = order.buyer_id === profile.id;
  const isSeller = order.seller_id === profile.id;
  const isParty = isBuyer || isSeller;

  async function update(patch: Partial<EscrowOrder>) {
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.from("escrow_orders").update(patch).eq("id", orderId);
    setBusy(false);
    if (e) setError(e.message);
  }

  async function approve() {
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.rpc("approve_escrow_order", { order_id: orderId });
    setBusy(false);
    if (e) setError(e.message);
  }

  const cpName = counterparty?.full_name || (counterparty ? `User ${counterparty.id.slice(0, 8)}` : "Loading...");
  const cpTrades = counterparty?.completed_trades_count ?? 0;

  return (
    <div className="space-y-4">
      <GhostButton onClick={onClose}>← Back</GhostButton>

      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Escrow order</SectionTitle>
          <StatusPill status={order.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted">Crypto amount</div>
            <div className="text-text">{order.crypto_amount ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted">Fiat amount</div>
            <div className="text-text">
              {order.fiat_amount ?? "—"} {order.fiat_currency ?? ""}
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <div className="text-sm text-text">{cpName}</div>
          <div className="text-xs text-muted">{cpTrades} completed trades</div>
        </div>

        <div className="space-y-2 pt-2">
          {isBuyer && order.status === "open" && (
            <GhostButton
              accent
              disabled={busy}
              onClick={() => update({ status: "pending_fiat_payment", buyer_marked_paid_at: new Date().toISOString() })}
            >
              I&apos;ve sent the payment
            </GhostButton>
          )}

          {isSeller && order.status === "pending_fiat_payment" && (
            <GhostButton
              accent
              disabled={busy}
              onClick={() =>
                update({ status: "pending_admin_approval", seller_marked_released_at: new Date().toISOString() })
              }
            >
              I&apos;ve released the crypto
            </GhostButton>
          )}

          {isParty && order.status === "open" && (
            <GhostButton disabled={busy} onClick={() => update({ status: "cancelled" })}>
              Cancel
            </GhostButton>
          )}

          {isParty && !TERMINAL.includes(order.status) && (
            <GhostButton
              disabled={busy}
              className="border-bear/70 text-bear"
              onClick={() => update({ status: "disputed" })}
            >
              Raise a dispute
            </GhostButton>
          )}

          {profile.is_admin && (order.status === "pending_admin_approval" || order.status === "disputed") && (
            <GhostButton accent disabled={busy} onClick={approve}>
              Approve & complete trade
            </GhostButton>
          )}
        </div>

        {order.status === "pending_admin_approval" && (
          <p className="text-sm text-muted">Waiting for our team to verify and release.</p>
        )}
        {order.status === "disputed" && <p className="text-sm text-muted">Under review by our team.</p>}
        {order.status === "completed" && <p className="text-sm text-bull">Trade complete.</p>}

        {error && <p className="text-sm text-bear">{error}</p>}
      </GlassCard>

      <Chat orderId={orderId} profile={profile} />
    </div>
  );
}

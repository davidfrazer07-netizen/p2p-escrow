"use client";

import { useEffect, useState } from "react";
import type { Profile, EscrowOrder } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { GlassCard, SectionTitle, StatusPill } from "@/components/ui";

export default function OrdersTab({
  profile,
  onOpenOrder,
}: {
  profile: Profile;
  onOpenOrder: (orderId: string) => void;
}) {
  const [orders, setOrders] = useState<EscrowOrder[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("escrow_orders")
      .select("*")
      .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setOrders(error ? [] : (data as EscrowOrder[]));
      });
    return () => {
      active = false;
    };
  }, [profile.id]);

  return (
    <div className="space-y-3 p-4">
      <SectionTitle>My orders</SectionTitle>

      {orders === null && <p className="text-sm text-muted">Loading orders...</p>}

      {orders !== null && orders.length === 0 && (
        <p className="text-sm text-muted">No orders yet — browse listings to start a trade.</p>
      )}

      {orders?.map((order) => {
        const isBuying = profile.id === order.buyer_id;
        return (
          <GlassCard
            key={order.id}
            className="flex cursor-pointer items-center justify-between"
            onClick={() => onOpenOrder(order.id)}
          >
            <div className="flex flex-col gap-1">
              <span className={`text-xs font-semibold uppercase ${isBuying ? "text-bull" : "text-bear"}`}>
                {isBuying ? "Buying" : "Selling"}
              </span>
              <span className="text-sm text-accent-hi">{order.crypto_amount ?? "—"} crypto</span>
              <span className="text-sm text-muted">
                {order.fiat_amount ?? "—"} {order.fiat_currency ?? ""}
              </span>
              <span className="text-xs text-muted">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <StatusPill status={order.status} />
          </GlassCard>
        );
      })}
    </div>
  );
}

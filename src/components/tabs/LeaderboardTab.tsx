"use client";

import { useEffect, useState } from "react";
import type { PublicProfile } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { GlassCard, SectionTitle, StatTile } from "@/components/ui";

export default function LeaderboardTab() {
  const [rows, setRows] = useState<PublicProfile[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("public_profiles")
      .select("id, full_name, kyc_status, completed_trades_count, total_volume_usd, total_volume_inr, created_at")
      .gt("completed_trades_count", 0)
      .order("completed_trades_count", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!active) return;
        setRows(error ? [] : (data as PublicProfile[]));
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-3 p-4">
      <div>
        <SectionTitle>Most trusted traders</SectionTitle>
        <p className="text-sm text-muted">Ranked by completed, admin-approved escrow trades.</p>
      </div>

      {rows === null && <p className="text-sm text-muted">Loading...</p>}
      {rows !== null && rows.length === 0 && <p className="text-sm text-muted">No traders ranked yet.</p>}

      {rows?.map((p, i) => (
        <GlassCard key={p.id} className="flex items-center gap-3">
          <span className="w-8 font-semibold text-accent-hi">#{i + 1}</span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-text">{p.full_name || `User ${p.id.slice(0, 8)}`}</span>
            {p.kyc_status === "verified" && <span className="text-xs text-accent">Verified</span>}
          </div>
          <div className="flex gap-2">
            <StatTile label="Trades" value={String(p.completed_trades_count)} />
            {p.total_volume_usd > 0 && <StatTile label="USD volume" value={p.total_volume_usd.toLocaleString()} />}
            {p.total_volume_inr > 0 && <StatTile label="INR volume" value={p.total_volume_inr.toLocaleString()} />}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

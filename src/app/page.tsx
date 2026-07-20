"use client";

import { useState } from "react";
import AuthGate, { useProfile } from "@/components/AuthGate";
import TabBar, { type TabId } from "@/components/TabBar";
import OrderDetail from "@/components/OrderDetail";
import ListingsTab from "@/components/tabs/ListingsTab";
import OrdersTab from "@/components/tabs/OrdersTab";
import LeaderboardTab from "@/components/tabs/LeaderboardTab";
import AdminTab from "@/components/tabs/AdminTab";
import WireframeGlobe from "@/components/Globe";

function AppShell() {
  const profile = useProfile();
  const [tab, setTab] = useState<TabId>("listings");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative flex items-center justify-between overflow-hidden border-b border-line px-4 py-3">
        <div className="pointer-events-none absolute -right-16 -top-24 opacity-40">
          <WireframeGlobe size={220} />
        </div>
        <span className="wordmark text-lg">SAFESWAP</span>
        <div className="flex gap-3">
          <a href="/terms" className="text-xs text-muted hover:text-accent">
            Terms
          </a>
          <a href="/privacy" className="text-xs text-muted hover:text-accent">
            Privacy
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {openOrderId ? (
          <div className="p-4">
            <OrderDetail orderId={openOrderId} profile={profile} onClose={() => setOpenOrderId(null)} />
          </div>
        ) : (
          <>
            {tab === "listings" && <ListingsTab profile={profile} onOpenOrder={setOpenOrderId} />}
            {tab === "orders" && <OrdersTab profile={profile} onOpenOrder={setOpenOrderId} />}
            {tab === "leaderboard" && <LeaderboardTab />}
            {tab === "admin" && profile.is_admin && <AdminTab profile={profile} onOpenOrder={setOpenOrderId} />}
          </>
        )}
      </main>

      {!openOrderId && <TabBar active={tab} onChange={setTab} showAdmin={profile.is_admin} />}
    </div>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}

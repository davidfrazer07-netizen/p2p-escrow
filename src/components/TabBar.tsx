"use client";

export type TabId = "listings" | "orders" | "leaderboard" | "admin";

export default function TabBar({
  active,
  onChange,
  showAdmin,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  showAdmin: boolean;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "listings", label: "Listings" },
    { id: "orders", label: "My Orders" },
    { id: "leaderboard", label: "Leaderboard" },
    ...(showAdmin ? ([{ id: "admin", label: "Admin" }] as { id: TabId; label: string }[]) : []),
  ];

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-line bg-bg2/90 backdrop-blur">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
            active === tab.id ? "text-accent" : "text-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

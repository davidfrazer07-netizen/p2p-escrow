"use client";

import { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  tint,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  tint?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`glass-card ${className}`}
      style={tint ? { borderColor: `${tint}80`, boxShadow: `0 0 14px ${tint}38` } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="section-title mb-2">{children}</div>;
}

export function Pill({
  children,
  active = false,
  onClick,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-accent/20 text-accent-hi border border-accent"
          : "bg-surface2/60 text-muted border border-line"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  accent = false,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed ${
        accent
          ? "bg-accent/20 text-accent-hi border border-accent/70 hud-glow"
          : "bg-surface2/50 text-text border border-line"
      } ${className}`}
    >
      {children}
    </button>
  );
}

type OrderStatus =
  | "open"
  | "pending_fiat_payment"
  | "pending_crypto_release"
  | "pending_admin_approval"
  | "completed"
  | "disputed"
  | "cancelled";

export function statusColor(s: OrderStatus): string {
  if (s === "completed") return "var(--bull)";
  if (s === "disputed" || s === "cancelled") return "var(--bear)";
  return "var(--accent)";
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = {
    open: "Open",
    pending_fiat_payment: "Awaiting fiat payment",
    pending_crypto_release: "Awaiting crypto release",
    pending_admin_approval: "Pending admin approval",
    completed: "Completed",
    disputed: "Disputed",
    cancelled: "Cancelled",
  };
  const color = statusColor(status);
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      {labels[status]}
    </span>
  );
}

export function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface2/50 px-3 py-2.5 text-center">
      <div className="text-lg font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

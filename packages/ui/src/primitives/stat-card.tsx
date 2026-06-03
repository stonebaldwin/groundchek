import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Smaller text under the value, e.g. units or context. */
  sublabel?: ReactNode;
  icon?: ReactNode;
  /** Optional accent tone applied to the value (e.g. an activity hue). */
  tone?: string;
  className?: string;
}

/** A compact KPI / figure card. Numbers render with tabular numerals. */
export function StatCard({ label, value, sublabel, icon, tone, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        {icon ? <span className="text-ink-muted">{icon}</span> : null}
      </div>
      <span className={cn("text-3xl font-semibold tracking-tight tabular-nums text-ink", tone)}>
        {value}
      </span>
      {sublabel ? <span className="text-xs text-ink-muted">{sublabel}</span> : null}
    </div>
  );
}

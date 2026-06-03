import { CalendarClock } from "lucide-react";
import { cn } from "../lib/cn";

export interface FreshnessIndicatorProps {
  /** The date the jurisdiction's data is current through. */
  currentAs: string | Date;
  /** Flag known-laggy jurisdictions (e.g. a portal 12–24 months behind). */
  stale?: boolean;
  /** Optional context, e.g. "updated weekly" or "City of Austin Open Data". */
  note?: string;
  className?: string;
}

function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * "Data current as of [date]" — first-class in Groundbreak. Permit portals vary
 * from daily to 1–2 years behind; surfacing freshness honestly is both a trust
 * differentiator and a guard against presenting stale data as live.
 */
export function FreshnessIndicator({ currentAs, stale, note, className }: FreshnessIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        stale
          ? "border-warning/30 bg-warning-soft text-warning"
          : "border-border bg-surface-sunken text-ink-soft",
        className,
      )}
    >
      <CalendarClock className="size-3.5" aria-hidden="true" />
      Data current as of {formatDate(currentAs)}
      {note ? <span className="font-normal text-ink-muted">· {note}</span> : null}
    </span>
  );
}

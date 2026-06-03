/**
 * Deterministic, locale-stable formatters. Using explicit "en-US" + UTC avoids
 * SSR/CSR hydration mismatches on dates and currency.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "$1,250,000" — or compact "$1.2M" / "$450K" when `compact` is set. */
export function formatCurrency(
  value: number | null | undefined,
  opts?: { compact?: boolean },
): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (opts?.compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) {
      const b = value / 1_000_000_000;
      return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
    }
    if (abs >= 1_000_000) {
      const m = value / 1_000_000;
      return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  }
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** "Apr 12, 2026" (UTC). Returns "—" for missing dates. */
export function formatDateShort(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return `${MONTHS[d.getUTCMonth()] ?? ""} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** A signed percentage, e.g. "+40%" / "−12%". Returns "—" when undefined. */
export function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `−${Math.abs(rounded)}%`;
  return "0%";
}

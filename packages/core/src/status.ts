import type { PermitStatus } from "./types";

/** Ordered rules — first match wins. Terminal/negative states checked first. */
const RULES: Array<[RegExp, PermitStatus]> = [
  [/final|complete|closed|c of o|certificate of occupancy|cofo/, "completed"],
  [/expire|lapsed/, "expired"],
  [/cancel|void|revok/, "cancelled"],
  [/withdraw/, "withdrawn"],
  [/hold|suspend|stop work/, "on_hold"],
  [/inspect/, "inspections"],
  [/in progress|under construction|construction/, "in_progress"],
  [/issued|active|approved|permit issued/, "issued"],
  [/review|plan check|pending|submitted|intake|in process/, "under_review"],
  [/applied|application|filed|received|new/, "applied"],
];

/** Normalize a portal's free-text status onto the canonical lifecycle. */
export function normalizeStatus(raw?: string): PermitStatus {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  for (const [re, status] of RULES) {
    if (re.test(s)) return status;
  }
  return "unknown";
}

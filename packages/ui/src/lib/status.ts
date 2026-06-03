/**
 * Presentational permit-status model. Mirrors `@groundbreak/core`'s
 * `PermitStatus` union (no import from core). Owns the human label and the badge
 * variant each status renders with.
 */
export type PermitStatus =
  | "applied"
  | "under_review"
  | "issued"
  | "in_progress"
  | "inspections"
  | "completed"
  | "expired"
  | "cancelled"
  | "withdrawn"
  | "on_hold"
  | "unknown";

export type StatusVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface PermitStatusMeta {
  status: PermitStatus;
  label: string;
  variant: StatusVariant;
}

export const PERMIT_STATUS_META: Record<PermitStatus, PermitStatusMeta> = {
  applied: { status: "applied", label: "Applied", variant: "neutral" },
  under_review: { status: "under_review", label: "Under review", variant: "info" },
  issued: { status: "issued", label: "Issued", variant: "primary" },
  in_progress: { status: "in_progress", label: "In progress", variant: "info" },
  inspections: { status: "inspections", label: "Inspections", variant: "info" },
  completed: { status: "completed", label: "Completed", variant: "success" },
  expired: { status: "expired", label: "Expired", variant: "warning" },
  cancelled: { status: "cancelled", label: "Cancelled", variant: "danger" },
  withdrawn: { status: "withdrawn", label: "Withdrawn", variant: "danger" },
  on_hold: { status: "on_hold", label: "On hold", variant: "warning" },
  unknown: { status: "unknown", label: "Unknown", variant: "neutral" },
};

export function permitStatusMeta(status: PermitStatus): PermitStatusMeta {
  return PERMIT_STATUS_META[status];
}

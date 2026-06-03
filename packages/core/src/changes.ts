import { PROJECT_TYPE_LABELS } from "./taxonomy";
import type { CanonicalPermit, PermitEventType } from "./types";

/** A change event ready to persist (carries resolved ids the runner supplies). */
export interface PersistableEvent {
  type: PermitEventType;
  jurisdictionId: string;
  propertyId?: string;
  permitId?: string;
  permitNumber?: string;
  summary: string;
  payload?: unknown;
  detectedAt: string;
}

export function newPermitEvent(
  permit: CanonicalPermit,
  refs: { propertyId: string; permitId: string; detectedAt: string },
): PersistableEvent {
  const label = PROJECT_TYPE_LABELS[permit.projectType];
  return {
    type: "new_permit",
    jurisdictionId: permit.jurisdictionId,
    propertyId: refs.propertyId,
    permitId: refs.permitId,
    permitNumber: permit.permitNumber,
    summary: `New ${label.toLowerCase()} permit at ${permit.address}`,
    payload: { projectType: permit.projectType, valuation: permit.valuation, status: permit.status },
    detectedAt: refs.detectedAt,
  };
}

export function statusChangeEvent(
  permit: CanonicalPermit,
  refs: { propertyId: string; permitId: string; previousStatus: string; detectedAt: string },
): PersistableEvent {
  return {
    type: "status_change",
    jurisdictionId: permit.jurisdictionId,
    propertyId: refs.propertyId,
    permitId: refs.permitId,
    permitNumber: permit.permitNumber,
    summary: `Permit ${permit.permitNumber} changed from ${refs.previousStatus} to ${permit.status}`,
    payload: { from: refs.previousStatus, to: permit.status },
    detectedAt: refs.detectedAt,
  };
}

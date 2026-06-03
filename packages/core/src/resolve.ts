import { addressKey, normalizeAddress } from "./geo";
import type { CanonicalPermit } from "./types";

/** A property identity derived from a permit, used to group + dedup. */
export interface ResolvedPropertyRef {
  normalizedAddress: string;
  addressKey: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
}

/**
 * Resolve the canonical property a permit belongs to. The `addressKey` (slug of
 * the normalized address) is the dedup key — multiple permits at one address
 * group into a single property's history. Parcel id, when present, is the
 * stronger signal and is carried through for the repository to prefer.
 */
export function resolvePropertyRef(permit: {
  address: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
}): ResolvedPropertyRef {
  return {
    normalizedAddress: normalizeAddress(permit.address),
    addressKey: addressKey(permit.address),
    lat: permit.lat,
    lng: permit.lng,
    parcelId: permit.parcelId,
  };
}

/** Group permits by resolved property — the building block for a property page. */
export function groupByProperty(permits: CanonicalPermit[]): Map<string, CanonicalPermit[]> {
  const groups = new Map<string, CanonicalPermit[]>();
  for (const permit of permits) {
    const key = addressKey(permit.address);
    const list = groups.get(key);
    if (list) list.push(permit);
    else groups.set(key, [permit]);
  }
  return groups;
}

/** Normalize a contractor name for dedup (uppercase, drop punctuation + suffixes). */
export function contractorNameKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(LLC|INC|CO|CORP|LTD|LP|LLP|COMPANY|CONSTRUCTION|BUILDERS?|CONTRACTING)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

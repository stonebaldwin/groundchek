import type { LatLng } from "./types";

const SUFFIXES: Record<string, string> = {
  street: "ST",
  st: "ST",
  avenue: "AVE",
  ave: "AVE",
  boulevard: "BLVD",
  blvd: "BLVD",
  drive: "DR",
  dr: "DR",
  lane: "LN",
  ln: "LN",
  road: "RD",
  rd: "RD",
  court: "CT",
  ct: "CT",
  place: "PL",
  pl: "PL",
  circle: "CIR",
  cir: "CIR",
  terrace: "TER",
  trail: "TRL",
  parkway: "PKWY",
  pkwy: "PKWY",
  highway: "HWY",
  hwy: "HWY",
};

const DIRECTIONS: Record<string, string> = {
  north: "N",
  south: "S",
  east: "E",
  west: "W",
  northeast: "NE",
  northwest: "NW",
  southeast: "SE",
  southwest: "SW",
};

/**
 * Normalize a street address for entity resolution: uppercase, collapse
 * whitespace, strip most punctuation, and standardize directionals + suffixes.
 * Not a USPS-grade normalizer — enough to group a property's permits reliably.
 */
export function normalizeAddress(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(" ").map((t) => {
    const lower = t.toLowerCase();
    if (SUFFIXES[lower]) return SUFFIXES[lower];
    if (DIRECTIONS[lower]) return DIRECTIONS[lower];
    return t;
  });
  return tokens.join(" ");
}

/** A URL/dedup-safe key derived from a normalized address. */
export function addressKey(address: string): string {
  return normalizeAddress(address)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Great-circle distance between two points, in meters. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough meters→degrees conversion for bounding-box prefilters. */
export function metersToDegrees(meters: number): number {
  return meters / 111_320;
}

/** True when both coordinates are present and within valid ranges. */
export function hasValidCoords(lat?: number, lng?: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

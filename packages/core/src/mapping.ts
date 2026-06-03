import type { FieldMapping, FieldRule, FieldType } from "./types";

export interface MappedFields {
  permitNumber?: string;
  permitTypeRaw?: string;
  statusRaw?: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
  valuation?: number;
  contractorName?: string;
  contractorLicense?: string;
  appliedDate?: string;
  issuedDate?: string;
  expirationDate?: string;
  completedDate?: string;
  isAdu?: boolean;
  nativeFlags: Record<string, string | number | boolean | null>;
}

function readColumn(data: Record<string, unknown>, rule: FieldRule): unknown {
  const direct = data[rule.column];
  if (direct !== undefined && direct !== null && direct !== "") return direct;
  for (const alt of rule.fallback ?? []) {
    const v = data[alt];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/** "$1,250,000.00" / "1250000" → 1250000. Returns undefined for non-numeric. */
export function parseCurrency(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[$,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return undefined;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Normalize many date shapes to an ISO date (YYYY-MM-DD): ISO timestamps,
 * "M/D/YYYY", "YYYY-MM-DD", and epoch milliseconds (ArcGIS date fields). Parsed
 * in UTC to avoid off-by-one timezone drift.
 */
export function parseDateIso(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  // Epoch milliseconds (ArcGIS) — large numbers or numeric strings.
  if (typeof value === "number" || /^\d{12,}$/.test(String(value).trim())) {
    const ms = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? undefined : toIsoDate(d);
  }

  const s = String(value).trim();

  // YYYY-MM-DD or ISO timestamp.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // M/D/YYYY or MM/DD/YYYY.
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (us) {
    const mm = us[1]!.padStart(2, "0");
    const dd = us[2]!.padStart(2, "0");
    return `${us[3]}-${mm}-${dd}`;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : toIsoDate(d);
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  if (["true", "t", "yes", "y", "1"].includes(v)) return true;
  if (["false", "f", "no", "n", "0"].includes(v)) return false;
  return undefined;
}

function coerceString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const n = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export function coerce(
  value: unknown,
  type: FieldType = "string",
): string | number | boolean | undefined {
  switch (type) {
    case "currency":
      return parseCurrency(value);
    case "number":
      return coerceNumber(value);
    case "date":
      return parseDateIso(value);
    case "boolean":
      return parseBoolean(value);
    case "string":
    default:
      return coerceString(value);
  }
}

/** Apply a jurisdiction's declarative FieldMapping to one raw row. */
export function applyMapping(data: Record<string, unknown>, mapping: FieldMapping): MappedFields {
  const str = (rule?: FieldRule) => (rule ? coerceString(readColumn(data, rule)) : undefined);
  const out: MappedFields = {
    permitNumber: str(mapping.permitNumber),
    permitTypeRaw: str(mapping.permitType),
    statusRaw: str(mapping.status),
    description: str(mapping.description),
    address: str(mapping.address),
    parcelId: str(mapping.parcelId),
    contractorName: str(mapping.contractorName),
    contractorLicense: str(mapping.contractorLicense),
    lat: mapping.latitude
      ? coerceNumber(readColumn(data, mapping.latitude))
      : undefined,
    lng: mapping.longitude
      ? coerceNumber(readColumn(data, mapping.longitude))
      : undefined,
    valuation: mapping.valuation
      ? parseCurrency(readColumn(data, mapping.valuation))
      : undefined,
    appliedDate: mapping.appliedDate ? parseDateIso(readColumn(data, mapping.appliedDate)) : undefined,
    issuedDate: mapping.issuedDate ? parseDateIso(readColumn(data, mapping.issuedDate)) : undefined,
    expirationDate: mapping.expirationDate
      ? parseDateIso(readColumn(data, mapping.expirationDate))
      : undefined,
    completedDate: mapping.completedDate
      ? parseDateIso(readColumn(data, mapping.completedDate))
      : undefined,
    nativeFlags: {},
  };

  for (const [key, rule] of Object.entries(mapping.nativeFlags ?? {})) {
    const v = coerce(readColumn(data, rule), rule.type);
    out.nativeFlags[key] = v ?? null;
    if (key.toLowerCase().includes("adu")) {
      const b = parseBoolean(readColumn(data, rule));
      if (b !== undefined) out.isAdu = b;
    }
  }

  return out;
}

/**
 * The Core's canonical vocabulary.
 *
 * These are the product-agnostic domain types shared by every permit connector
 * and the analytics/composition layer. The interfaces are the *contract*; the
 * live connectors (Socrata SODA, ArcGIS REST, an Accela/CARTO browser fallback,
 * and an optional paid-aggregator stub), the field-mapping normalizer,
 * project-type classification, entity resolution, area analytics, change
 * detection, and ingestion-health implementations are built in Phase 1 against
 * them.
 *
 * `@groundbreak/ui` intentionally does NOT import these — the design system stays
 * an independent sibling and defines its own presentational view-model types.
 * Apps map a domain object onto the UI's component props.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Minimal GeoJSON geometry; refined in Phase 1 when geometry queries land. */
export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

// --- The shared entity -------------------------------------------------------

/**
 * The central entity — everything in the real-estate cluster keys to this.
 *
 * This shape is **identical to `@terrain/core`'s `CanonicalProperty`** on
 * purpose: Groundbreak (permits) and Terrain (property-risk) are designed to
 * snap together on one parcel/address, so a single property can later carry both
 * its permit history and its risk profile. Keep the two in sync; the DB
 * `properties` table is the cluster-shared row both products attach to.
 */
export interface CanonicalProperty {
  normalizedAddress: string;
  lat: number;
  lng: number;
  parcelId?: string;
  county?: string;
  state?: string;
}

// --- Connector framework (Phase 1.1) -----------------------------------------

/**
 * The platforms a jurisdiction's permits can live on. `socrata` is primary
 * (key-less SODA/SoQL); `arcgis` is secondary; `accela_browser`/`carto` use the
 * Browser Rendering fallback; `paid_aggregator` is the optional, not-wired-by-
 * default national fallback (e.g. Shovels) — stubbed, never required at launch.
 */
export type SourcePlatform = "socrata" | "arcgis" | "accela_browser" | "carto" | "paid_aggregator";

export type IngestionCadence = "daily" | "weekly" | "monthly";

/** Coercion hint for a mapped column. */
export type FieldType = "string" | "number" | "currency" | "date" | "boolean";

/** One source column → canonical field rule, with optional alternates. */
export interface FieldRule {
  column: string;
  type?: FieldType; // default "string"
  fallback?: string[]; // alternate source columns if the primary is absent
}

/**
 * Declarative per-jurisdiction mapping (their columns → canonical fields). This
 * is the crux of scaling coverage by *config* rather than code (Phase 1.3):
 * adding a jurisdiction is a `JurisdictionConfig` + this mapping, not a new
 * connector. The normalizer (Phase 1.4) applies it with type coercion, date
 * normalization, and valuation parsing.
 */
export interface FieldMapping {
  permitNumber: FieldRule;
  permitType?: FieldRule;
  status?: FieldRule;
  description?: FieldRule;
  address?: FieldRule;
  latitude?: FieldRule;
  longitude?: FieldRule;
  parcelId?: FieldRule;
  valuation?: FieldRule;
  contractorName?: FieldRule;
  contractorLicense?: FieldRule;
  appliedDate?: FieldRule;
  issuedDate?: FieldRule;
  expirationDate?: FieldRule;
  completedDate?: FieldRule;
  /** Native source booleans/enums worth preserving, e.g. SF's ADU flag. */
  nativeFlags?: Record<string, FieldRule>;
}

export interface JurisdictionConfig {
  jurisdictionId: string; // "us-nc-wilmington", "us-tx-austin"
  platform: SourcePlatform;
  portalBaseUrl: string;
  datasetId?: string;
  fieldMapping: FieldMapping; // their columns → canonical fields
  cadence: IngestionCadence;
  /** e.g. LA ~12–24 months behind. Surfaced honestly in the UI (Phase 1.8 / 7.2). */
  knownLagMonths?: number;
}

export interface FetchOptions {
  since?: Date;
  limit?: number;
  signal?: AbortSignal;
  /**
   * Extra source-native predicate (e.g. a Socrata SoQL `$where`), AND-combined
   * with the incremental `since` filter. Lets a run scope a dataset — a date
   * window for back-sampling, "residential only", "has a valuation", etc.
   */
  where?: string;
}

/** Raw, un-normalized payload from one connector's `fetchRaw`. */
export interface RawPermit {
  jurisdictionId: string;
  retrievedAt: string; // ISO 8601
  sourceUrl: string;
  data: Record<string, unknown>;
}

/** The one interface every jurisdiction source implements (Phase 1.1). */
export interface PermitSourceConnector {
  jurisdictionId: string;
  platform: SourcePlatform;
  config: JurisdictionConfig;
  fetchRaw(options?: FetchOptions): Promise<RawPermit[]>;
  normalize(raw: RawPermit): CanonicalPermit;
}

// --- Canonical permit + taxonomy ---------------------------------------------

/** Lifecycle status, normalized across portals (each names these differently). */
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

/**
 * Normalized project-type taxonomy, classified (Phase 1.4) from permit type +
 * description text, plus native flags where present (e.g. SF's ADU boolean).
 */
export type ProjectType =
  | "new_construction"
  | "addition"
  | "alteration"
  | "adu"
  | "roofing"
  | "solar"
  | "hvac"
  | "electrical"
  | "plumbing"
  | "mechanical"
  | "demolition"
  | "pool"
  | "deck"
  | "fence"
  | "grading"
  | "sign"
  | "fire"
  | "other";

export const PROJECT_TYPES = [
  "new_construction",
  "addition",
  "alteration",
  "adu",
  "roofing",
  "solar",
  "hvac",
  "electrical",
  "plumbing",
  "mechanical",
  "demolition",
  "pool",
  "deck",
  "fence",
  "grading",
  "sign",
  "fire",
  "other",
] as const satisfies readonly ProjectType[];

/**
 * One permit, normalized. Contractor fields are **public business info only** —
 * individual owner / applicant personal names and other PII are deliberately
 * excluded (Phase 1.4 / 7.3).
 */
export interface CanonicalPermit {
  jurisdictionId: string;
  permitNumber: string;
  permitTypeRaw?: string; // the source's own type label, preserved
  projectType: ProjectType; // normalized classification
  status: PermitStatus;
  statusRaw?: string; // original unmapped status (audit)
  description?: string;
  address: string; // as published by the portal
  lat?: number;
  lng?: number;
  parcelId?: string;
  valuation?: number; // USD, parsed from messy source formats
  contractorName?: string; // public business field
  contractorLicense?: string;
  appliedDate?: string; // ISO date (YYYY-MM-DD)
  issuedDate?: string;
  expirationDate?: string;
  completedDate?: string;
  isAdu?: boolean; // native flag where the portal exposes one
  sourceUrl: string;
  retrievedAt: string; // ISO 8601
  raw?: Record<string, unknown>; // jsonb audit snapshot
}

// --- Attribution + freshness -------------------------------------------------

/**
 * Where a datum came from. `dataCurrentAs` (per-jurisdiction freshness — "data
 * current as of [date]") is first-class in Groundbreak: some portals lag 1–2
 * years, so showing freshness honestly is both a trust feature and a guard
 * against presenting stale data as live (Phase 1.8 / 7.2).
 */
export interface SourceAttribution {
  sourceId: string; // jurisdiction/connector id, e.g. "us-tx-austin"
  sourceName: string; // human label, e.g. "City of Austin Open Data"
  sourceUrl?: string;
  retrievedAt: string; // when we pulled it
  dataCurrentAs?: string; // latest published/issued date the portal exposes
}

// --- Area-trend & activity analytics (Phase 1.6) -----------------------------

export type AreaKind = "zip" | "neighborhood" | "jurisdiction";

/**
 * Graded construction-activity scale, used for area "hotspot" rendering and
 * recency. Non-alarmist and clearly ordered — a *computed analysis* label, not
 * an official designation (Phase 7.3).
 */
export type ActivityLevel = "quiet" | "light" | "moderate" | "active" | "hot";

export const ACTIVITY_ORDER = [
  "quiet",
  "light",
  "moderate",
  "active",
  "hot",
] as const satisfies readonly ActivityLevel[];

export interface AreaActivityPoint {
  period: string; // e.g. "2026-04"
  permitCount: number;
  totalValuation: number;
}

export interface ProjectTypeShare {
  projectType: ProjectType;
  count: number;
  share: number; // 0..1
}

export interface AreaActivitySummary {
  areaKind: AreaKind;
  areaId: string; // "78701", "us-tx-austin"
  label: string;
  series: AreaActivityPoint[];
  projectTypeMix: ProjectTypeShare[];
  activityLevel: ActivityLevel; // computed hotspot grade
  momChangePct?: number; // month-over-month
  yoyChangePct?: number; // year-over-year
}

/** Contractor permit-activity rollup for the contractor view (public info only). */
export interface ContractorActivity {
  name: string;
  license?: string;
  permitCount: number;
  totalValuation: number;
  jurisdictions: string[];
  topProjectTypes: ProjectType[];
}

// --- Change detection (powers monitoring/alerts; Phase 1.7 + Phase 6) --------

export type PermitEventType =
  | "new_permit" // a new permit appeared at a watched property
  | "status_change" // a watched permit changed status
  | "new_nearby_permit" // a new permit near a watched property/area
  | "area_activity_spike"; // a watched area's activity jumped

export interface PermitEvent {
  type: PermitEventType;
  jurisdictionId: string;
  propertyId?: string;
  permitNumber?: string;
  summary: string;
  detectedAt: string;
  before?: unknown;
  after?: unknown;
}

// --- Ingestion health + freshness (Phase 1.8) --------------------------------

export type SyncStatus = "ok" | "partial" | "error" | "empty" | "stale";

/**
 * One ingestion run's health record. `anomalies` captures zero-rows-vs-prior,
 * field-mapping failures, and portal-shape/SoQL errors; `stale` + `dataCurrentAs`
 * capture the "this jurisdiction hasn't published past its cadence" problem
 * (the LA/Dallas lag). Logged on **every** run.
 */
export interface SyncRun {
  jurisdictionId: string;
  platform: SourcePlatform;
  status: SyncStatus;
  recordsSeen: number;
  recordsNew: number;
  recordsUpdated: number;
  latencyMs: number;
  startedAt: string;
  finishedAt?: string;
  anomalies: string[];
  error?: string;
  /** Most recent issued/published date observed — drives "data current as of". */
  dataCurrentAs?: string;
}

/** Wired to Resend in Phase 6 so the operator learns when a portal breaks or goes stale. */
export type UnhealthyHook = (run: SyncRun) => void | Promise<void>;

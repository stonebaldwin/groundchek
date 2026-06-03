/**
 * Local string-union types used to type domain text columns via Drizzle's
 * `.$type<>()`. Deliberately duplicated from `@groundbreak/core` (rather than
 * imported) so the DB package stays foundational with no dependency on core —
 * core's persistence layer depends on db, never the reverse.
 */
export type SourcePlatform = "socrata" | "arcgis" | "accela_browser" | "carto" | "paid_aggregator";

export type IngestionCadence = "daily" | "weekly" | "monthly";

export type JurisdictionStatus = "active" | "paused" | "broken" | "stale";

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

export type ActivityLevel = "quiet" | "light" | "moderate" | "active" | "hot";

export type AreaKind = "zip" | "neighborhood" | "jurisdiction";

export type SyncStatus = "ok" | "partial" | "error" | "empty" | "stale";

export type PermitEventType =
  | "new_permit"
  | "status_change"
  | "new_nearby_permit"
  | "area_activity_spike";

export type Plan = "free" | "pro" | "business";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type MembershipRole = "owner" | "admin" | "member";

export type AlertFrequency = "instant" | "daily" | "weekly";

export type WatchedAreaKind = "radius" | "zip" | "neighborhood" | "jurisdiction";

export type CoverageRequestStatus = "new" | "reviewing" | "planned" | "live";

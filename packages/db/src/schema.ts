import {
  boolean,
  doublePrecision,
  geometry,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  ActivityLevel,
  AlertFrequency,
  AreaKind,
  CoverageRequestStatus,
  IngestionCadence,
  JurisdictionStatus,
  MembershipRole,
  PermitEventType,
  PermitStatus,
  Plan,
  ProjectType,
  SourcePlatform,
  SubscriptionStatus,
  SyncStatus,
  WatchedAreaKind,
} from "./enums";

/**
 * `system_meta` — tiny key/value table proving migrations + DB connectivity and
 * holding operational metadata (schema version, last seed time).
 */
export const systemMeta = pgTable("system_meta", {
  key: text().primaryKey(),
  value: text(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Ingestion domain
// ============================================================================

/** A locality we ingest permits for. Carries freshness + lag metadata. */
export const jurisdictions = pgTable("jurisdictions", {
  id: text().primaryKey(), // "us-tx-austin"
  name: text().notNull(), // "Austin"
  state: text().notNull(), // "TX"
  platform: text().$type<SourcePlatform>().notNull(),
  timezone: text(),
  isActive: boolean().default(true).notNull(),
  status: text().$type<JurisdictionStatus>().default("active").notNull(),
  knownLagMonths: integer(),
  /** Latest published/issued date observed — "data current as of". */
  dataCurrentAs: timestamp({ withTimezone: true }),
  lastSyncedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

/** Per-jurisdiction connector config — adding a market is a row here, not code. */
export const permitDatasets = pgTable(
  "permit_datasets",
  {
    id: uuid().defaultRandom().primaryKey(),
    jurisdictionId: text()
      .references(() => jurisdictions.id, { onDelete: "cascade" })
      .notNull(),
    platform: text().$type<SourcePlatform>().notNull(),
    portalBaseUrl: text().notNull(),
    datasetId: text(),
    /** The declarative FieldMapping (their columns → canonical fields). */
    fieldMapping: jsonb().notNull(),
    cadence: text().$type<IngestionCadence>().default("weekly").notNull(),
    knownLagMonths: integer(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("permit_datasets_jurisdiction_idx").on(t.jurisdictionId)],
);

/**
 * THE central entity — cluster-shared. Terrain (property-risk) attaches to the
 * same row, so one parcel can carry both its permit history and risk profile.
 * Mirrors `@groundbreak/core`'s `CanonicalProperty`.
 */
export const properties = pgTable(
  "properties",
  {
    id: uuid().defaultRandom().primaryKey(),
    /** Slug of the normalized address — the dedup + URL key. */
    addressKey: text().notNull(),
    normalizedAddress: text().notNull(),
    lat: doublePrecision(),
    lng: doublePrecision(),
    geom: geometry({ type: "point", mode: "xy", srid: 4326 }),
    parcelId: text(),
    jurisdictionId: text().references(() => jurisdictions.id),
    city: text(),
    zip: text(),
    county: text(),
    state: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("properties_address_key_idx").on(t.addressKey),
    index("properties_geom_idx").using("gist", t.geom),
    index("properties_jurisdiction_idx").on(t.jurisdictionId),
    index("properties_zip_idx").on(t.zip),
  ],
);

/** A resolved contractor (public business info only). */
export const contractors = pgTable(
  "contractors",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    nameKey: text().notNull(), // normalized for dedup
    license: text(),
    jurisdictions: text().array(),
    topProjectTypes: text().array().$type<ProjectType[]>(),
    permitCount: integer().default(0).notNull(),
    totalValuation: doublePrecision().default(0).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contractors_name_key_idx").on(t.nameKey),
    index("contractors_license_idx").on(t.license),
  ],
);

/** One permit, normalized. Contractor fields are public business info; no owner PII. */
export const permits = pgTable(
  "permits",
  {
    id: uuid().defaultRandom().primaryKey(),
    propertyId: uuid()
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    jurisdictionId: text()
      .references(() => jurisdictions.id)
      .notNull(),
    permitNumber: text().notNull(),
    permitTypeRaw: text(),
    projectType: text().$type<ProjectType>().default("other").notNull(),
    status: text().$type<PermitStatus>().default("unknown").notNull(),
    statusRaw: text(),
    description: text(),
    address: text().notNull(),
    lat: doublePrecision(),
    lng: doublePrecision(),
    geom: geometry({ type: "point", mode: "xy", srid: 4326 }),
    valuation: doublePrecision(),
    contractorId: uuid().references(() => contractors.id),
    contractorName: text(),
    contractorLicense: text(),
    appliedDate: timestamp({ withTimezone: true }),
    issuedDate: timestamp({ withTimezone: true }),
    expirationDate: timestamp({ withTimezone: true }),
    completedDate: timestamp({ withTimezone: true }),
    isAdu: boolean(),
    sourceUrl: text().notNull(),
    retrievedAt: timestamp({ withTimezone: true }).notNull(),
    rawSnapshot: jsonb(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("permits_natural_key_idx").on(t.jurisdictionId, t.permitNumber),
    index("permits_property_idx").on(t.propertyId),
    index("permits_jurisdiction_idx").on(t.jurisdictionId),
    index("permits_project_type_idx").on(t.projectType),
    index("permits_status_idx").on(t.status),
    index("permits_issued_idx").on(t.issuedDate),
    index("permits_contractor_idx").on(t.contractorId),
    index("permits_geom_idx").using("gist", t.geom),
  ],
);

/** Pre-computed activity/trend rollups for fast charts. */
export const areaAggregates = pgTable(
  "area_aggregates",
  {
    id: uuid().defaultRandom().primaryKey(),
    areaKind: text().$type<AreaKind>().notNull(),
    areaId: text().notNull(), // "78702" | "us-tx-austin"
    jurisdictionId: text().references(() => jurisdictions.id),
    label: text().notNull(),
    period: text().notNull(), // "2026-04" | "all"
    projectType: text().$type<ProjectType>(), // null = all types
    permitCount: integer().default(0).notNull(),
    totalValuation: doublePrecision().default(0).notNull(),
    activityLevel: text().$type<ActivityLevel>(),
    computedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("area_aggregates_key_idx").on(t.areaKind, t.areaId, t.period, t.projectType),
    index("area_aggregates_area_idx").on(t.areaKind, t.areaId),
  ],
);

/** Emitted change events for the alert pipeline. */
export const permitEvents = pgTable(
  "permit_events",
  {
    id: uuid().defaultRandom().primaryKey(),
    type: text().$type<PermitEventType>().notNull(),
    jurisdictionId: text().notNull(),
    propertyId: uuid().references(() => properties.id, { onDelete: "cascade" }),
    permitId: uuid().references(() => permits.id, { onDelete: "set null" }),
    permitNumber: text(),
    summary: text().notNull(),
    payload: jsonb(),
    processed: boolean().default(false).notNull(),
    detectedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("permit_events_processed_idx").on(t.processed),
    index("permit_events_property_idx").on(t.propertyId),
  ],
);

/** Ingestion health + freshness — one row per run. */
export const syncRuns = pgTable(
  "sync_runs",
  {
    id: uuid().defaultRandom().primaryKey(),
    jurisdictionId: text().notNull(),
    datasetId: uuid(),
    platform: text().$type<SourcePlatform>().notNull(),
    status: text().$type<SyncStatus>().notNull(),
    recordsSeen: integer().default(0).notNull(),
    recordsNew: integer().default(0).notNull(),
    recordsUpdated: integer().default(0).notNull(),
    latencyMs: integer().default(0).notNull(),
    anomalies: jsonb().$type<string[]>(),
    error: text(),
    dataCurrentAs: timestamp({ withTimezone: true }),
    startedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("sync_runs_jurisdiction_idx").on(t.jurisdictionId),
    index("sync_runs_started_idx").on(t.startedAt),
  ],
);

// ============================================================================
// Accounts (Better Auth core tables — plural via drizzleAdapter usePlural)
// ============================================================================

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable("verifications", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Organizations / teams (Business tier)
// ============================================================================

export const organizations = pgTable("organizations", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  ownerUserId: text()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid()
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text().$type<MembershipRole>().default("member").notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("memberships_org_user_idx").on(t.organizationId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

// ============================================================================
// Billing (Stripe) + entitlements
// ============================================================================

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text().references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
    stripeCustomerId: text(),
    stripeSubscriptionId: text(),
    stripePriceId: text(),
    plan: text().$type<Plan>().default("free").notNull(),
    status: text().$type<SubscriptionStatus>().default("active").notNull(),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    cancelAtPeriodEnd: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    index("subscriptions_org_idx").on(t.organizationId),
    index("subscriptions_stripe_customer_idx").on(t.stripeCustomerId),
    index("subscriptions_stripe_sub_idx").on(t.stripeSubscriptionId),
  ],
);

export const usageCounters = pgTable(
  "usage_counters",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    period: text().notNull(), // "2026-06"
    metric: text().notNull(), // "lookups"
    count: integer().default(0).notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("usage_counters_key_idx").on(t.userId, t.period, t.metric)],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    prefix: text().notNull(),
    keyHash: text().notNull(),
    lastUsedAt: timestamp({ withTimezone: true }),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("api_keys_user_idx").on(t.userId), uniqueIndex("api_keys_prefix_idx").on(t.prefix)],
);

// ============================================================================
// Product
// ============================================================================

export const brandingProfiles = pgTable("branding_profiles", {
  id: uuid().defaultRandom().primaryKey(),
  userId: text()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
  name: text().notNull(),
  logoUrl: text(),
  primaryColor: text(),
  contactName: text(),
  contactEmail: text(),
  contactPhone: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const savedProperties = pgTable(
  "saved_properties",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    propertyId: uuid()
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("saved_properties_key_idx").on(t.userId, t.propertyId)],
);

export const watchedAreas = pgTable(
  "watched_areas",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    kind: text().$type<WatchedAreaKind>().notNull(),
    label: text().notNull(),
    centerLat: doublePrecision(),
    centerLng: doublePrecision(),
    radiusMeters: integer(),
    areaId: text(), // ZIP / jurisdiction id
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("watched_areas_user_idx").on(t.userId)],
);

export const alertSubscriptions = pgTable(
  "alert_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    propertyId: uuid().references(() => properties.id, { onDelete: "cascade" }),
    watchedAreaId: uuid().references(() => watchedAreas.id, { onDelete: "cascade" }),
    eventTypes: text().array().$type<PermitEventType[]>().notNull(),
    frequency: text().$type<AlertFrequency>().default("instant").notNull(),
    active: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("alert_subscriptions_user_idx").on(t.userId)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: text()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    alertSubscriptionId: uuid().references(() => alertSubscriptions.id, { onDelete: "set null" }),
    permitEventId: uuid().references(() => permitEvents.id, { onDelete: "set null" }),
    channel: text().default("email").notNull(),
    subject: text().notNull(),
    status: text().default("sent").notNull(),
    sentAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("alerts_user_idx").on(t.userId)],
);

export const coverageRequests = pgTable("coverage_requests", {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull(),
  market: text().notNull(),
  note: text(),
  userId: text().references(() => users.id, { onDelete: "set null" }),
  status: text().$type<CoverageRequestStatus>().default("new").notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Inferred row types
// ============================================================================

export type SystemMeta = typeof systemMeta.$inferSelect;
export type Jurisdiction = typeof jurisdictions.$inferSelect;
export type NewJurisdiction = typeof jurisdictions.$inferInsert;
export type PermitDataset = typeof permitDatasets.$inferSelect;
export type NewPermitDataset = typeof permitDatasets.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Permit = typeof permits.$inferSelect;
export type NewPermit = typeof permits.$inferInsert;
export type Contractor = typeof contractors.$inferSelect;
export type NewContractor = typeof contractors.$inferInsert;
export type AreaAggregate = typeof areaAggregates.$inferSelect;
export type NewAreaAggregate = typeof areaAggregates.$inferInsert;
export type PermitEventRow = typeof permitEvents.$inferSelect;
export type NewPermitEventRow = typeof permitEvents.$inferInsert;
export type SyncRunRow = typeof syncRuns.$inferSelect;
export type NewSyncRunRow = typeof syncRuns.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UsageCounter = typeof usageCounters.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type BrandingProfile = typeof brandingProfiles.$inferSelect;
export type SavedProperty = typeof savedProperties.$inferSelect;
export type WatchedArea = typeof watchedAreas.$inferSelect;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type CoverageRequest = typeof coverageRequests.$inferSelect;

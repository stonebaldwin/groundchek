import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "./client";
import { AUSTIN_FIELD_MAPPING } from "./jurisdictions";
import {
  areaAggregates,
  contractors,
  coverageRequests,
  jurisdictions,
  permitDatasets,
  permits,
  properties,
  systemMeta,
} from "./schema";

/**
 * Demo seed — makes a real database reviewable before live ingestion is wired,
 * and ships a *real* Austin Socrata field mapping as the reference connector
 * config. Re-runnable: upserts on natural keys.
 */

// The real Austin "Issued Construction Permits" (Socrata 3syk-w9eu) field mapping
// lives in ./jurisdictions (shared with the local ingestion runner).

async function main() {
  const db = getDb();
  const now = new Date();

  await db
    .insert(systemMeta)
    .values({ key: "seeded_at", value: now.toISOString() })
    .onConflictDoUpdate({ target: systemMeta.key, set: { value: now.toISOString(), updatedAt: sql`now()` } });

  // --- Jurisdictions --------------------------------------------------------
  await db
    .insert(jurisdictions)
    .values([
      { id: "us-tx-austin", name: "Austin", state: "TX", platform: "socrata", status: "active", dataCurrentAs: new Date("2026-05-29") },
      { id: "us-nc-wilmington", name: "Wilmington", state: "NC", platform: "arcgis", status: "active", dataCurrentAs: new Date("2026-05-27") },
      { id: "us-ca-losangeles", name: "Los Angeles", state: "CA", platform: "socrata", status: "stale", knownLagMonths: 18, dataCurrentAs: new Date("2024-09-01") },
    ])
    .onConflictDoNothing();

  await db
    .insert(permitDatasets)
    .values({
      jurisdictionId: "us-tx-austin",
      platform: "socrata",
      portalBaseUrl: "https://data.austintexas.gov",
      datasetId: "3syk-w9eu",
      fieldMapping: AUSTIN_FIELD_MAPPING,
      cadence: "daily",
    })
    .onConflictDoNothing();

  // --- Properties + permits + contractors -----------------------------------
  const [loneStar] = await db
    .insert(contractors)
    .values({ name: "Lone Star Builders LLC", nameKey: "LONE STAR", license: "TX-CGC-44821", jurisdictions: ["us-tx-austin"], permitCount: 2, totalValuation: 345000 })
    .onConflictDoNothing()
    .returning({ id: contractors.id });

  const insertProperty = async (p: {
    addressKey: string;
    normalizedAddress: string;
    lat: number;
    lng: number;
    county: string;
  }) => {
    const rows = await db
      .insert(properties)
      .values({
        addressKey: p.addressKey,
        normalizedAddress: p.normalizedAddress,
        lat: p.lat,
        lng: p.lng,
        geom: sql`ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)`,
        jurisdictionId: "us-tx-austin",
        county: p.county,
        state: "TX",
      })
      .onConflictDoUpdate({ target: properties.addressKey, set: { updatedAt: sql`now()` } })
      .returning({ id: properties.id });
    return rows[0]!.id;
  };

  const prop1 = await insertProperty({
    addressKey: "1100-e-5th-st-austin-tx-78702",
    normalizedAddress: "1100 E 5TH ST AUSTIN TX 78702",
    lat: 30.2618,
    lng: -97.7298,
    county: "Travis",
  });

  await db
    .insert(permits)
    .values([
      {
        propertyId: prop1,
        jurisdictionId: "us-tx-austin",
        permitNumber: "2026-014532 BP",
        projectType: "addition",
        status: "issued",
        description: "Second-story addition, 620 sq ft, over existing garage.",
        address: "1100 E 5th St, Austin, TX 78702",
        lat: 30.2618,
        lng: -97.7298,
        geom: sql`ST_SetSRID(ST_MakePoint(-97.7298, 30.2618), 4326)`,
        valuation: 185000,
        contractorId: loneStar?.id ?? null,
        contractorName: "Lone Star Builders LLC",
        contractorLicense: "TX-CGC-44821",
        issuedDate: new Date("2026-04-18"),
        sourceUrl: "https://data.austintexas.gov/d/3syk-w9eu",
        retrievedAt: now,
      },
      {
        propertyId: prop1,
        jurisdictionId: "us-tx-austin",
        permitNumber: "2025-098221 EP",
        projectType: "solar",
        status: "completed",
        description: "Rooftop photovoltaic system, 8.2 kW.",
        address: "1100 E 5th St, Austin, TX 78702",
        lat: 30.2618,
        lng: -97.7298,
        geom: sql`ST_SetSRID(ST_MakePoint(-97.7298, 30.2618), 4326)`,
        valuation: 24500,
        contractorName: "Sunfield Solar",
        issuedDate: new Date("2025-09-02"),
        completedDate: new Date("2025-10-14"),
        sourceUrl: "https://data.austintexas.gov/d/3syk-w9eu",
        retrievedAt: now,
      },
    ])
    .onConflictDoNothing();

  // --- Area aggregate + coverage queue --------------------------------------
  await db
    .insert(areaAggregates)
    .values({
      areaKind: "jurisdiction",
      areaId: "us-tx-austin",
      jurisdictionId: "us-tx-austin",
      label: "Austin",
      period: "all",
      permitCount: 1284,
      totalValuation: 412_000_000,
      activityLevel: "active",
    })
    .onConflictDoNothing();

  await db
    .insert(coverageRequests)
    .values([
      { email: "agent@example.com", market: "Raleigh, NC", status: "new" },
      { email: "investor@example.com", market: "78704", status: "reviewing" },
    ])
    .onConflictDoNothing();

  console.log("✓ seed complete");
}

main().catch((err) => {
  console.error("✗ seed failed:", err);
  process.exit(1);
});

import "dotenv/config";
import {
  and,
  createDb,
  eq,
  FIELD_MAPPINGS,
  schema,
  sql,
} from "@groundbreak/db";
import {
  createDrizzleIngestRepository,
  createSocrataConnector,
  resolvePropertyRef,
  type FieldMapping,
  type JurisdictionConfig,
  type RawPermit,
} from "@groundbreak/core";
import { refreshJurisdictionAggregates } from "./aggregates";

/**
 * Local ingestion runner — pulls REAL permit data from a jurisdiction's live
 * public portal into the database, reusing the exact connector + repository path
 * the Cloudflare Worker uses (so local == production behavior), but driven from a
 * plain `tsx` process.
 *
 * To make the 12-month area-activity trend real (and not collapse into a few
 * recent days), it back-samples up to PER_MONTH permits per month over MONTHS.
 *
 *   JURISDICTION=us-tx-austin MONTHS=12 PER_MONTH=55 RESET=1 tsx src/ingest-local.ts
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set (see .env).");
  process.exit(1);
}

const jurisdictionId = process.env.JURISDICTION ?? "us-tx-austin";
const perMonth = Number(process.env.PER_MONTH ?? 55);
const months = Number(process.env.MONTHS ?? 12);
const reset = process.env.RESET === "1";
// Default to substantive, valued, geocoded permits — every ingested row then has a
// real dollar value, coordinates, and (usually) a contractor, so all pages are rich.
const baseWhere =
  process.env.WHERE ??
  // > 1000 skips the common "$1" placeholder valuations, keeping substantive,
  // real-dollar projects (and requiring coordinates so every permit maps).
  "total_job_valuation > 1000 AND original_address1 IS NOT NULL AND latitude IS NOT NULL";

const SODA_DATE = (d: Date) => d.toISOString().slice(0, 19);
const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());

async function main(databaseUrl: string) {
  const db = createDb(databaseUrl);

  // Self-heal: ensure the dataset's stored field mapping matches the live portal's
  // real column names (verified against the dataset metadata).
  const canonical = FIELD_MAPPINGS[jurisdictionId];
  if (canonical) {
    await db
      .update(schema.permitDatasets)
      .set({ fieldMapping: canonical, updatedAt: sql`now()` })
      .where(eq(schema.permitDatasets.jurisdictionId, jurisdictionId));
  }

  const [row] = await db
    .select({
      jurisdictionId: schema.permitDatasets.jurisdictionId,
      platform: schema.permitDatasets.platform,
      portalBaseUrl: schema.permitDatasets.portalBaseUrl,
      datasetId: schema.permitDatasets.datasetId,
      fieldMapping: schema.permitDatasets.fieldMapping,
      cadence: schema.permitDatasets.cadence,
      knownLagMonths: schema.permitDatasets.knownLagMonths,
      name: schema.jurisdictions.name,
      state: schema.jurisdictions.state,
    })
    .from(schema.permitDatasets)
    .innerJoin(schema.jurisdictions, eq(schema.jurisdictions.id, schema.permitDatasets.jurisdictionId))
    .where(and(eq(schema.permitDatasets.jurisdictionId, jurisdictionId), eq(schema.permitDatasets.isActive, true)))
    .limit(1);

  if (!row) {
    console.error(`✗ No active permit_datasets row for "${jurisdictionId}". Run \`pnpm db:seed\` first.`);
    process.exit(1);
  }
  if (row.platform !== "socrata") {
    console.error(`✗ This local runner currently supports Socrata sources only (got ${row.platform}).`);
    process.exit(1);
  }

  const config: JurisdictionConfig = {
    jurisdictionId: row.jurisdictionId,
    platform: row.platform,
    portalBaseUrl: row.portalBaseUrl,
    datasetId: row.datasetId ?? undefined,
    fieldMapping: row.fieldMapping as FieldMapping,
    cadence: row.cadence,
    knownLagMonths: row.knownLagMonths ?? undefined,
  };
  const connector = createSocrataConnector(config);

  // --- Back-sample across the last `months` months for a real trend ----------
  console.log(`→ sampling ≤${perMonth}/month over ${months} months from ${row.name} (${config.datasetId})…`);
  const now = new Date();
  const raws: RawPermit[] = [];
  const seen = new Set<string>();
  for (let m = 0; m < months; m++) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m + 1, 1));
    const where = `issue_date >= '${SODA_DATE(start)}' AND issue_date < '${SODA_DATE(end)}' AND ${baseWhere}`;
    let monthRaws: RawPermit[] = [];
    try {
      monthRaws = await connector.fetchRaw({ where, limit: perMonth });
    } catch (err) {
      console.log(`  ${start.toISOString().slice(0, 7)}: fetch error — ${err instanceof Error ? err.message : err}`);
      continue;
    }
    let added = 0;
    for (const r of monthRaws) {
      const num = String((r.data as Record<string, unknown>).permit_number ?? "");
      if (num && seen.has(num)) continue;
      if (num) seen.add(num);
      raws.push(r);
      added++;
    }
    console.log(`  ${start.toISOString().slice(0, 7)}: ${added}`);
  }
  console.log(`→ fetched ${raws.length} real permits`);

  if (raws.length === 0) {
    console.error("✗ No rows fetched — aborting before any destructive reset.");
    process.exit(1);
  }

  if (reset) {
    console.log("→ RESET: clearing permit domain (keeping jurisdictions + datasets)…");
    await db.delete(schema.areaAggregates);
    await db.delete(schema.permitEvents);
    await db.delete(schema.permits);
    await db.delete(schema.contractors);
    await db.delete(schema.properties);
  }

  // --- Persist via the production repository ----------------------------------
  const repo = createDrizzleIngestRepository(db);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const { id: syncRunId } = await repo.startSyncRun({ jurisdictionId, platform: "socrata", startedAt });

  let recordsNew = 0;
  let recordsUpdated = 0;
  let mappingFailures = 0;
  let latestIssued: string | undefined;
  let i = 0;
  for (const raw of raws) {
    let permit;
    try {
      permit = connector.normalize(raw);
    } catch {
      mappingFailures++;
      continue;
    }
    const date = permit.issuedDate ?? permit.completedDate ?? permit.appliedDate;
    if (date && (!latestIssued || date > latestIssued)) latestIssued = date;

    // Enrich the address with city/state/ZIP from the source row, so properties
    // carry a real ZIP (powering neighborhood areas) and a full display address.
    const d = raw.data as Record<string, unknown>;
    const street = String(d.original_address1 ?? permit.address ?? "").trim();
    const city = d.original_city ? titleCase(String(d.original_city).trim()) : undefined;
    const stateAbbr = d.original_state ? String(d.original_state).trim().toUpperCase() : row.state;
    const zip = d.original_zip != null ? String(d.original_zip).trim().slice(0, 5) : undefined;
    if (street) {
      permit.address = [titleCase(street), city, [stateAbbr, zip].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ");
    }

    const ref = resolvePropertyRef(permit);
    const { id: propertyId } = await repo.resolveProperty({
      ...ref,
      jurisdictionId,
      city,
      zip,
      state: stateAbbr,
      county: "Travis",
    });
    const result = await repo.upsertPermit({ permit, propertyId });
    if (result.isNew) recordsNew++;
    else recordsUpdated++;
    if (++i % 50 === 0) console.log(`  persisted ${i}/${raws.length}`);
  }

  const finishedAt = new Date().toISOString();
  await repo.finishSyncRun(syncRunId, {
    status: "ok",
    recordsSeen: raws.length,
    recordsNew,
    recordsUpdated,
    latencyMs: Date.now() - startMs,
    anomalies: [],
    dataCurrentAs: latestIssued,
    finishedAt,
  });
  await repo.updateJurisdictionFreshness(jurisdictionId, {
    dataCurrentAs: latestIssued,
    status: "ok",
    lastSyncedAt: finishedAt,
  });
  console.log(
    `✓ persisted: new=${recordsNew} updated=${recordsUpdated} mappingFailures=${mappingFailures} dataCurrentAs=${latestIssued}`,
  );

  console.log("→ refreshing area aggregates…");
  await refreshJurisdictionAggregates(db, jurisdictionId, row.name);
  console.log("✓ done");
}

main(url).catch((err) => {
  console.error("✗ ingestion failed:", err);
  process.exit(1);
});

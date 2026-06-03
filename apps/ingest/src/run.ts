import { and, createDb, eq, schema } from "@groundbreak/db";
import {
  createDrizzleIngestRepository,
  runJurisdiction,
  type FieldMapping,
  type IngestionCadence,
  type JurisdictionConfig,
  type SyncRun,
} from "@groundbreak/core";
import { refreshJurisdictionAggregates } from "./aggregates";
import { sendOperatorAlert, type MailEnv } from "./email";

export interface RunEnv extends MailEnv {
  DATABASE_URL: string;
}

const CADENCE_MS: Record<IngestionCadence, number> = {
  daily: 24 * 3600_000,
  weekly: 7 * 24 * 3600_000,
  monthly: 30 * 24 * 3600_000,
};

function isDue(cadence: IngestionCadence, lastSyncedAt: Date | null, now: Date): boolean {
  if (!lastSyncedAt) return true;
  return now.getTime() - lastSyncedAt.getTime() >= CADENCE_MS[cadence];
}

/**
 * Select the jurisdictions whose datasets are due (by cadence) and ingest each
 * through the Core: fetch → normalize → resolve → upsert → events → health. After
 * each, refresh the jurisdiction's activity rollup. A non-ok run (or a crash)
 * emails the operator — the #1 maintenance signal.
 */
export async function runDueJurisdictions(
  env: RunEnv,
  opts: { force?: boolean; only?: string } = {},
): Promise<SyncRun[]> {
  const db = createDb(env.DATABASE_URL);
  const repo = createDrizzleIngestRepository(db);
  const now = new Date();

  const datasets = await db
    .select({
      jurisdictionId: schema.permitDatasets.jurisdictionId,
      platform: schema.permitDatasets.platform,
      portalBaseUrl: schema.permitDatasets.portalBaseUrl,
      sourceDatasetId: schema.permitDatasets.datasetId,
      fieldMapping: schema.permitDatasets.fieldMapping,
      cadence: schema.permitDatasets.cadence,
      knownLagMonths: schema.permitDatasets.knownLagMonths,
      name: schema.jurisdictions.name,
      lastSyncedAt: schema.jurisdictions.lastSyncedAt,
    })
    .from(schema.permitDatasets)
    .innerJoin(schema.jurisdictions, eq(schema.jurisdictions.id, schema.permitDatasets.jurisdictionId))
    .where(and(eq(schema.permitDatasets.isActive, true), eq(schema.jurisdictions.isActive, true)));

  const outcomes: SyncRun[] = [];
  for (const d of datasets) {
    if (opts.only && d.jurisdictionId !== opts.only) continue;
    if (!opts.force && !isDue(d.cadence, d.lastSyncedAt, now)) continue;

    const config: JurisdictionConfig = {
      jurisdictionId: d.jurisdictionId,
      platform: d.platform,
      portalBaseUrl: d.portalBaseUrl,
      datasetId: d.sourceDatasetId ?? undefined,
      fieldMapping: d.fieldMapping as FieldMapping,
      cadence: d.cadence,
      knownLagMonths: d.knownLagMonths ?? undefined,
    };
    const since = !opts.force && d.lastSyncedAt ? d.lastSyncedAt : undefined;

    try {
      const outcome = await runJurisdiction(config, {
        repo,
        since,
        onUnhealthy: async (run) => {
          await sendOperatorAlert(env, `${run.jurisdictionId} sync ${run.status}`, [
            `Status: <strong>${run.status}</strong>`,
            ...(run.error ? [`Error: ${run.error}`] : []),
            ...run.anomalies,
          ]);
        },
      });
      outcomes.push(outcome);
      await refreshJurisdictionAggregates(db, d.jurisdictionId, d.name);
    } catch (err) {
      await sendOperatorAlert(env, `${d.jurisdictionId} sync crashed`, [
        err instanceof Error ? err.message : String(err),
      ]);
    }
  }
  return outcomes;
}

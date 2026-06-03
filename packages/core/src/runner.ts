import { newPermitEvent, statusChangeEvent, type PersistableEvent } from "./changes";
import { createConnector, type ConnectorDeps } from "./connectors";
import { ConnectorError } from "./errors";
import { deriveSyncStatus, detectAnomalies, fireUnhealthy } from "./health";
import { resolvePropertyRef } from "./resolve";
import type { IngestRepository } from "./ports";
import type { JurisdictionConfig, SyncRun, UnhealthyHook } from "./types";

export interface RunOptions {
  repo: IngestRepository;
  /** Incremental: only pull records issued on/after this date. */
  since?: Date;
  limit?: number;
  connectorDeps?: ConnectorDeps;
  onUnhealthy?: UnhealthyHook;
  now?: () => Date;
  signal?: AbortSignal;
}

export interface RunOutcome extends SyncRun {
  events: number;
}

/**
 * The ingestion heart: fetch → normalize → resolve property → upsert → emit
 * change events → log health. Resilient — a row that fails mapping is counted
 * and skipped, a fetch failure is recorded as an errored run, and a non-ok run
 * fires the operator hook. Storage happens through the injected repository.
 */
export async function runJurisdiction(
  config: JurisdictionConfig,
  options: RunOptions,
): Promise<RunOutcome> {
  const { repo } = options;
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const startMs = now().getTime();

  const prior = await repo.getLastSyncRun(config.jurisdictionId);
  const { id: syncRunId } = await repo.startSyncRun({
    jurisdictionId: config.jurisdictionId,
    platform: config.platform,
    startedAt,
  });

  const connector = createConnector(config, options.connectorDeps);

  // --- Fetch ----------------------------------------------------------------
  let raws;
  try {
    raws = await connector.fetchRaw({ since: options.since, limit: options.limit, signal: options.signal });
  } catch (err) {
    const finishedAt = now().toISOString();
    const message = err instanceof ConnectorError ? err.message : String(err);
    const run: SyncRun = {
      jurisdictionId: config.jurisdictionId,
      platform: config.platform,
      status: "error",
      recordsSeen: 0,
      recordsNew: 0,
      recordsUpdated: 0,
      latencyMs: now().getTime() - startMs,
      startedAt,
      finishedAt,
      anomalies: [],
      error: message,
    };
    await repo.finishSyncRun(syncRunId, {
      status: "error",
      recordsSeen: 0,
      recordsNew: 0,
      recordsUpdated: 0,
      latencyMs: run.latencyMs,
      anomalies: [],
      error: message,
      finishedAt,
    });
    await repo.updateJurisdictionFreshness(config.jurisdictionId, {
      status: "error",
      lastSyncedAt: finishedAt,
    });
    await fireUnhealthy(run, options.onUnhealthy);
    return { ...run, events: 0 };
  }

  // --- Normalize + persist --------------------------------------------------
  let recordsNew = 0;
  let recordsUpdated = 0;
  let mappingFailures = 0;
  let latestIssued: string | undefined;
  const events: PersistableEvent[] = [];

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

    // A single row's DB failure must not abort the whole run — count it and
    // continue, so the run always reaches finishSyncRun (no phantom "in-progress"
    // sync_runs row, no corrupted next-run baseline).
    try {
      const ref = resolvePropertyRef(permit);
      const { id: propertyId } = await repo.resolveProperty({
        ...ref,
        jurisdictionId: config.jurisdictionId,
      });

      const result = await repo.upsertPermit({ permit, propertyId });
      const detectedAt = now().toISOString();
      if (result.isNew) {
        recordsNew++;
        events.push(newPermitEvent(permit, { propertyId, permitId: result.permitId, detectedAt }));
      } else {
        recordsUpdated++;
        if (result.statusChanged && result.previousStatus) {
          events.push(
            statusChangeEvent(permit, {
              propertyId,
              permitId: result.permitId,
              previousStatus: result.previousStatus,
              detectedAt,
            }),
          );
        }
      }
    } catch (err) {
      mappingFailures++;
      console.error(
        `[ingest] persist failed (${config.jurisdictionId} ${permit.permitNumber}):`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (events.length > 0) await repo.recordEvents(events);

  // --- Health + freshness ---------------------------------------------------
  const anomalies = detectAnomalies({
    recordsSeen: raws.length,
    recordsNew,
    recordsUpdated,
    mappingFailures,
    priorRecordsSeen: prior?.recordsSeen,
    cadence: config.cadence,
    knownLagMonths: config.knownLagMonths,
    dataCurrentAs: latestIssued ?? prior?.dataCurrentAs,
    now: now(),
  });
  const status = deriveSyncStatus(
    { recordsSeen: raws.length, recordsNew, recordsUpdated, mappingFailures, cadence: config.cadence },
    anomalies,
  );
  const finishedAt = now().toISOString();

  const run: SyncRun = {
    jurisdictionId: config.jurisdictionId,
    platform: config.platform,
    status,
    recordsSeen: raws.length,
    recordsNew,
    recordsUpdated,
    latencyMs: now().getTime() - startMs,
    startedAt,
    finishedAt,
    anomalies,
    dataCurrentAs: latestIssued ?? prior?.dataCurrentAs,
  };

  await repo.finishSyncRun(syncRunId, {
    status,
    recordsSeen: run.recordsSeen,
    recordsNew,
    recordsUpdated,
    latencyMs: run.latencyMs,
    anomalies,
    dataCurrentAs: run.dataCurrentAs,
    finishedAt,
  });
  await repo.updateJurisdictionFreshness(config.jurisdictionId, {
    dataCurrentAs: run.dataCurrentAs,
    status,
    lastSyncedAt: finishedAt,
  });
  await fireUnhealthy(run, options.onUnhealthy);

  return { ...run, events: events.length };
}

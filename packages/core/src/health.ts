import type { IngestionCadence, SyncRun, SyncStatus, UnhealthyHook } from "./types";

/** Days past which a jurisdiction's freshness is considered stale, by cadence. */
const STALE_THRESHOLD_DAYS: Record<IngestionCadence, number> = {
  daily: 4,
  weekly: 14,
  monthly: 45,
};

export interface SyncMetrics {
  recordsSeen: number;
  recordsNew: number;
  recordsUpdated: number;
  mappingFailures: number;
  priorRecordsSeen?: number;
  cadence: IngestionCadence;
  knownLagMonths?: number;
  /** Most recent issued/published date observed this run (ISO). */
  dataCurrentAs?: string;
  now?: Date;
}

/**
 * Is a jurisdiction stale — has it gone quiet longer than its cadence allows?
 * This is the LA/Dallas problem (portals 1–2 years behind). `knownLagMonths`
 * widens the allowance for jurisdictions that publish on a known delay.
 */
export function isStale(
  dataCurrentAs: string | undefined,
  cadence: IngestionCadence,
  knownLagMonths = 0,
  now: Date = new Date(),
): boolean {
  if (!dataCurrentAs) return false;
  const d = new Date(`${dataCurrentAs.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const ageDays = (now.getTime() - d.getTime()) / 86_400_000;
  const allowance = STALE_THRESHOLD_DAYS[cadence] + knownLagMonths * 30;
  return ageDays > allowance;
}

/** Heuristic anomaly detection over one run's metrics. */
export function detectAnomalies(m: SyncMetrics): string[] {
  const anomalies: string[] = [];
  const prior = m.priorRecordsSeen ?? 0;

  if (m.recordsSeen === 0 && prior > 0) {
    anomalies.push(`Zero rows returned (prior run saw ${prior}) — portal may have changed or broken.`);
  } else if (prior > 0 && m.recordsSeen < prior * 0.5) {
    const drop = Math.round((1 - m.recordsSeen / prior) * 100);
    anomalies.push(`Row volume dropped ${drop}% vs prior run (${m.recordsSeen} vs ${prior}).`);
  }

  if (m.mappingFailures > 0) {
    anomalies.push(`${m.mappingFailures} row(s) failed field mapping — the portal's columns may have shifted.`);
  }

  if (isStale(m.dataCurrentAs, m.cadence, m.knownLagMonths, m.now)) {
    anomalies.push(`No new data since ${m.dataCurrentAs} — past the ${m.cadence} cadence (possible stale source).`);
  }

  return anomalies;
}

export function deriveSyncStatus(m: SyncMetrics, anomalies: string[]): SyncStatus {
  if (m.recordsSeen === 0) return "empty";
  if (anomalies.some((a) => a.includes("stale source"))) return "stale";
  if (m.mappingFailures > 0) return "partial";
  return "ok";
}

/** Fire the operator hook for any non-ok run. Never throws. */
export async function fireUnhealthy(run: SyncRun, hook?: UnhealthyHook): Promise<void> {
  if (!hook) return;
  if (run.status === "ok" && run.anomalies.length === 0) return;
  try {
    await hook(run);
  } catch {
    // The alerting path must never crash ingestion.
  }
}

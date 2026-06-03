import type { PersistableEvent } from "./changes";
import type { ResolvedPropertyRef } from "./resolve";
import type { CanonicalPermit, SourcePlatform, SyncStatus } from "./types";

export interface ResolvePropertyInput extends ResolvedPropertyRef {
  jurisdictionId: string;
  county?: string;
  state?: string;
}

export interface UpsertPermitResult {
  permitId: string;
  isNew: boolean;
  statusChanged: boolean;
  previousStatus?: string;
}

export interface SyncRunInit {
  jurisdictionId: string;
  platform: SourcePlatform;
  datasetId?: string;
  startedAt: string;
}

export interface SyncRunFinish {
  status: SyncStatus;
  recordsSeen: number;
  recordsNew: number;
  recordsUpdated: number;
  latencyMs: number;
  anomalies: string[];
  error?: string;
  dataCurrentAs?: string;
  finishedAt: string;
}

export interface LastSyncSummary {
  recordsSeen: number;
  dataCurrentAs?: string;
}

/**
 * The persistence contract the ingestion runner writes through. Implemented by
 * a Drizzle-backed repository (`persistence/`) for production and an in-memory
 * one (`testing/`) for tests — the Core stays storage-agnostic.
 */
export interface IngestRepository {
  /** Resolve (find-or-create) the canonical property for a permit. */
  resolveProperty(input: ResolvePropertyInput): Promise<{ id: string }>;

  /**
   * Upsert a permit by its natural key (jurisdiction + permit number), resolving
   * its contractor along the way. Reports whether it's new and whether its
   * status changed, so the runner can emit change events.
   */
  upsertPermit(input: { permit: CanonicalPermit; propertyId: string }): Promise<UpsertPermitResult>;

  /** Persist change events for the alert pipeline. */
  recordEvents(events: PersistableEvent[]): Promise<void>;

  startSyncRun(init: SyncRunInit): Promise<{ id: string }>;
  finishSyncRun(id: string, result: SyncRunFinish): Promise<void>;
  getLastSyncRun(jurisdictionId: string): Promise<LastSyncSummary | null>;

  /** Update the jurisdiction's "data current as of" + status after a run. */
  updateJurisdictionFreshness(
    jurisdictionId: string,
    update: { dataCurrentAs?: string; status?: SyncStatus; lastSyncedAt: string },
  ): Promise<void>;
}

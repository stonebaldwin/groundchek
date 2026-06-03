import type { PersistableEvent } from "../changes";
import type {
  IngestRepository,
  LastSyncSummary,
  ResolvePropertyInput,
  SyncRunFinish,
  SyncRunInit,
  UpsertPermitResult,
} from "../ports";
import { contractorNameKey } from "../resolve";
import type { CanonicalPermit, PermitStatus } from "../types";

interface MemProperty extends ResolvePropertyInput {
  id: string;
}
interface MemPermit {
  id: string;
  propertyId: string;
  permit: CanonicalPermit;
  status: PermitStatus;
}
interface MemContractor {
  id: string;
  name: string;
  license?: string;
  permitCount: number;
  totalValuation: number;
}
interface MemSyncRun extends SyncRunInit {
  id: string;
  finish?: SyncRunFinish;
}

export interface InMemoryState {
  properties: Map<string, MemProperty>;
  permits: Map<string, MemPermit>;
  contractors: Map<string, MemContractor>;
  events: PersistableEvent[];
  syncRuns: MemSyncRun[];
  freshness: Map<string, { dataCurrentAs?: string; status?: string; lastSyncedAt: string }>;
}

export interface InMemoryRepository extends IngestRepository {
  state: InMemoryState;
}

/** A storage-free `IngestRepository` for unit-testing the runner + logic. */
export function createInMemoryRepository(): InMemoryRepository {
  const state: InMemoryState = {
    properties: new Map(),
    permits: new Map(),
    contractors: new Map(),
    events: [],
    syncRuns: [],
    freshness: new Map(),
  };
  let seq = 0;
  const id = (p: string) => `${p}${++seq}`;

  return {
    state,

    async resolveProperty(input: ResolvePropertyInput) {
      const existing = state.properties.get(input.addressKey);
      if (existing) return { id: existing.id };
      const created: MemProperty = { ...input, id: id("prop_") };
      state.properties.set(input.addressKey, created);
      return { id: created.id };
    },

    async upsertPermit({ permit, propertyId }): Promise<UpsertPermitResult> {
      if (permit.contractorName) {
        const key = `${contractorNameKey(permit.contractorName)}|${permit.contractorLicense ?? ""}`;
        const c = state.contractors.get(key);
        if (c) {
          c.permitCount++;
          c.totalValuation += permit.valuation ?? 0;
        } else {
          state.contractors.set(key, {
            id: id("contractor_"),
            name: permit.contractorName,
            license: permit.contractorLicense,
            permitCount: 1,
            totalValuation: permit.valuation ?? 0,
          });
        }
      }

      const key = `${permit.jurisdictionId}|${permit.permitNumber}`;
      const existing = state.permits.get(key);
      if (existing) {
        const previousStatus = existing.status;
        const statusChanged = previousStatus !== permit.status;
        existing.permit = permit;
        existing.status = permit.status;
        return { permitId: existing.id, isNew: false, statusChanged, previousStatus };
      }
      const created: MemPermit = { id: id("permit_"), propertyId, permit, status: permit.status };
      state.permits.set(key, created);
      return { permitId: created.id, isNew: true, statusChanged: false };
    },

    async recordEvents(events: PersistableEvent[]) {
      state.events.push(...events);
    },

    async startSyncRun(init: SyncRunInit) {
      const run: MemSyncRun = { ...init, id: id("sync_") };
      state.syncRuns.push(run);
      return { id: run.id };
    },

    async finishSyncRun(runId: string, result: SyncRunFinish) {
      const run = state.syncRuns.find((r) => r.id === runId);
      if (run) run.finish = result;
    },

    async getLastSyncRun(jurisdictionId: string): Promise<LastSyncSummary | null> {
      const finished = state.syncRuns
        .filter((r) => r.jurisdictionId === jurisdictionId && r.finish)
        .map((r) => r.finish!);
      const last = finished[finished.length - 1];
      if (!last) return null;
      return { recordsSeen: last.recordsSeen, dataCurrentAs: last.dataCurrentAs };
    },

    async updateJurisdictionFreshness(jurisdictionId, update) {
      state.freshness.set(jurisdictionId, update);
    },
  };
}

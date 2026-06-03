import {
  and,
  type Database,
  eq,
  isNull,
  schema,
  sql,
} from "@groundbreak/db";
import type { PersistableEvent } from "../changes";
import { hasValidCoords } from "../geo";
import { contractorNameKey } from "../resolve";
import type {
  IngestRepository,
  LastSyncSummary,
  ResolvePropertyInput,
  SyncRunFinish,
  SyncRunInit,
  UpsertPermitResult,
} from "../ports";
import type { SyncStatus } from "../types";

const { properties, permits, contractors, permitEvents, syncRuns, jurisdictions } = schema;

function tsToDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
function dateOnlyToDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Map a sync status onto the coarser jurisdiction status. */
function jurisdictionStatusFor(status?: SyncStatus): "active" | "broken" | "stale" | undefined {
  if (!status) return undefined;
  if (status === "error") return "broken";
  if (status === "stale") return "stale";
  return "active";
}

/**
 * Production `IngestRepository` backed by Drizzle + Neon. The Neon HTTP driver
 * has no interactive transactions, so each step is its own statement —
 * idempotent by natural keys (address slug, jurisdiction+permit number).
 */
export function createDrizzleIngestRepository(db: Database): IngestRepository {
  async function resolveContractor(
    name: string,
    license: string | undefined,
    jurisdictionId: string,
    valuation: number | undefined,
  ): Promise<string | null> {
    const nameKey = contractorNameKey(name);
    if (!nameKey) return null;
    const found = await db
      .select({ id: contractors.id, jurisdictions: contractors.jurisdictions })
      .from(contractors)
      .where(
        and(
          eq(contractors.nameKey, nameKey),
          license ? eq(contractors.license, license) : isNull(contractors.license),
        ),
      )
      .limit(1);

    if (found[0]) {
      const list = new Set(found[0].jurisdictions ?? []);
      list.add(jurisdictionId);
      await db
        .update(contractors)
        .set({
          permitCount: sql`${contractors.permitCount} + 1`,
          totalValuation: sql`${contractors.totalValuation} + ${valuation ?? 0}`,
          jurisdictions: [...list],
          updatedAt: sql`now()`,
        })
        .where(eq(contractors.id, found[0].id));
      return found[0].id;
    }

    const inserted = await db
      .insert(contractors)
      .values({
        name,
        nameKey,
        license: license ?? null,
        jurisdictions: [jurisdictionId],
        permitCount: 1,
        totalValuation: valuation ?? 0,
      })
      .returning({ id: contractors.id });
    return inserted[0]?.id ?? null;
  }

  return {
    async resolveProperty(input: ResolvePropertyInput) {
      const existing = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.addressKey, input.addressKey))
        .limit(1);
      if (existing[0]) return { id: existing[0].id };

      const coords = hasValidCoords(input.lat, input.lng);
      const inserted = await db
        .insert(properties)
        .values({
          addressKey: input.addressKey,
          normalizedAddress: input.normalizedAddress,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          geom: coords ? sql`ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)` : null,
          parcelId: input.parcelId ?? null,
          jurisdictionId: input.jurisdictionId,
          county: input.county ?? null,
          state: input.state ?? null,
        })
        .onConflictDoUpdate({
          target: properties.addressKey,
          set: { updatedAt: sql`now()` },
        })
        .returning({ id: properties.id });
      return { id: inserted[0]!.id };
    },

    async upsertPermit({ permit, propertyId }): Promise<UpsertPermitResult> {
      const contractorId = permit.contractorName
        ? await resolveContractor(permit.contractorName, permit.contractorLicense, permit.jurisdictionId, permit.valuation)
        : null;

      const existing = await db
        .select({ id: permits.id, status: permits.status })
        .from(permits)
        .where(and(eq(permits.jurisdictionId, permit.jurisdictionId), eq(permits.permitNumber, permit.permitNumber)))
        .limit(1);

      const coords = hasValidCoords(permit.lat, permit.lng);
      const common = {
        projectType: permit.projectType,
        status: permit.status,
        statusRaw: permit.statusRaw ?? null,
        permitTypeRaw: permit.permitTypeRaw ?? null,
        description: permit.description ?? null,
        address: permit.address,
        lat: permit.lat ?? null,
        lng: permit.lng ?? null,
        geom: coords ? sql`ST_SetSRID(ST_MakePoint(${permit.lng}, ${permit.lat}), 4326)` : null,
        valuation: permit.valuation ?? null,
        contractorId,
        contractorName: permit.contractorName ?? null,
        contractorLicense: permit.contractorLicense ?? null,
        appliedDate: dateOnlyToDate(permit.appliedDate),
        issuedDate: dateOnlyToDate(permit.issuedDate),
        expirationDate: dateOnlyToDate(permit.expirationDate),
        completedDate: dateOnlyToDate(permit.completedDate),
        isAdu: permit.isAdu ?? null,
        sourceUrl: permit.sourceUrl,
        retrievedAt: tsToDate(permit.retrievedAt) ?? new Date(),
        rawSnapshot: permit.raw ?? null,
        updatedAt: sql`now()`,
      };

      if (existing[0]) {
        const previousStatus = existing[0].status;
        await db.update(permits).set(common).where(eq(permits.id, existing[0].id));
        return {
          permitId: existing[0].id,
          isNew: false,
          statusChanged: previousStatus !== permit.status,
          previousStatus,
        };
      }

      const inserted = await db
        .insert(permits)
        .values({
          propertyId,
          jurisdictionId: permit.jurisdictionId,
          permitNumber: permit.permitNumber,
          ...common,
        })
        .returning({ id: permits.id });
      return { permitId: inserted[0]!.id, isNew: true, statusChanged: false };
    },

    async recordEvents(events: PersistableEvent[]) {
      if (events.length === 0) return;
      await db.insert(permitEvents).values(
        events.map((e) => ({
          type: e.type,
          jurisdictionId: e.jurisdictionId,
          propertyId: e.propertyId ?? null,
          permitId: e.permitId ?? null,
          permitNumber: e.permitNumber ?? null,
          summary: e.summary,
          payload: e.payload ?? null,
          detectedAt: tsToDate(e.detectedAt) ?? new Date(),
        })),
      );
    },

    async startSyncRun(init: SyncRunInit) {
      const inserted = await db
        .insert(syncRuns)
        .values({
          jurisdictionId: init.jurisdictionId,
          platform: init.platform,
          status: "ok",
          startedAt: tsToDate(init.startedAt) ?? new Date(),
        })
        .returning({ id: syncRuns.id });
      return { id: inserted[0]!.id };
    },

    async finishSyncRun(runId: string, result: SyncRunFinish) {
      await db
        .update(syncRuns)
        .set({
          status: result.status,
          recordsSeen: result.recordsSeen,
          recordsNew: result.recordsNew,
          recordsUpdated: result.recordsUpdated,
          latencyMs: result.latencyMs,
          anomalies: result.anomalies,
          error: result.error ?? null,
          dataCurrentAs: dateOnlyToDate(result.dataCurrentAs),
          finishedAt: tsToDate(result.finishedAt) ?? new Date(),
        })
        .where(eq(syncRuns.id, runId));
    },

    async getLastSyncRun(jurisdictionId: string): Promise<LastSyncSummary | null> {
      const rows = await db
        .select({ recordsSeen: syncRuns.recordsSeen, dataCurrentAs: syncRuns.dataCurrentAs })
        .from(syncRuns)
        .where(and(eq(syncRuns.jurisdictionId, jurisdictionId), isNull(syncRuns.error)))
        .orderBy(sql`${syncRuns.startedAt} DESC`)
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        recordsSeen: row.recordsSeen,
        dataCurrentAs: row.dataCurrentAs ? row.dataCurrentAs.toISOString().slice(0, 10) : undefined,
      };
    },

    async updateJurisdictionFreshness(jurisdictionId, update) {
      const status = jurisdictionStatusFor(update.status);
      await db
        .update(jurisdictions)
        .set({
          dataCurrentAs: dateOnlyToDate(update.dataCurrentAs),
          lastSyncedAt: tsToDate(update.lastSyncedAt) ?? new Date(),
          ...(status ? { status } : {}),
          updatedAt: sql`now()`,
        })
        .where(eq(jurisdictions.id, jurisdictionId));
    },
  };
}

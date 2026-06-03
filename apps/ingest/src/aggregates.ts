import { and, type Database, eq, isNotNull, schema } from "@groundbreak/db";
import { buildAreaSummary, type CanonicalPermit } from "@groundbreak/core";

function toIso(d: Date | null): string | undefined {
  return d ? d.toISOString().slice(0, 10) : undefined;
}

/**
 * Recompute a jurisdiction's activity rollup into `area_aggregates` after a sync,
 * reusing the Core's analytics. Stores a summary row (activity level + totals) and
 * one row per project type. Keyed at the jurisdiction level; ZIP/neighborhood
 * rollups are a future enhancement once properties carry a ZIP.
 */
export async function refreshJurisdictionAggregates(
  db: Database,
  jurisdictionId: string,
  label: string,
): Promise<void> {
  const rows = await db
    .select({
      projectType: schema.permits.projectType,
      status: schema.permits.status,
      valuation: schema.permits.valuation,
      issuedDate: schema.permits.issuedDate,
      appliedDate: schema.permits.appliedDate,
      completedDate: schema.permits.completedDate,
    })
    .from(schema.permits)
    .where(and(eq(schema.permits.jurisdictionId, jurisdictionId), isNotNull(schema.permits.issuedDate)))
    .limit(20000);

  const permits: CanonicalPermit[] = rows.map((r) => ({
    jurisdictionId,
    permitNumber: "",
    projectType: r.projectType,
    status: r.status,
    address: "",
    sourceUrl: "",
    retrievedAt: new Date().toISOString(),
    valuation: r.valuation ?? undefined,
    issuedDate: toIso(r.issuedDate),
    appliedDate: toIso(r.appliedDate),
    completedDate: toIso(r.completedDate),
  }));

  const summary = buildAreaSummary({ areaKind: "jurisdiction", areaId: jurisdictionId, label, permits });
  const totalPermits = summary.series.reduce((s, p) => s + p.permitCount, 0);
  const totalValuation = summary.series.reduce((s, p) => s + p.totalValuation, 0);
  const computedAt = new Date();

  await db
    .delete(schema.areaAggregates)
    .where(
      and(eq(schema.areaAggregates.areaKind, "jurisdiction"), eq(schema.areaAggregates.areaId, jurisdictionId)),
    );

  await db.insert(schema.areaAggregates).values([
    {
      areaKind: "jurisdiction" as const,
      areaId: jurisdictionId,
      jurisdictionId,
      label,
      period: "all",
      projectType: null,
      permitCount: totalPermits,
      totalValuation,
      activityLevel: summary.activityLevel,
      computedAt,
    },
    ...summary.projectTypeMix.map((m) => ({
      areaKind: "jurisdiction" as const,
      areaId: jurisdictionId,
      jurisdictionId,
      label,
      period: "all",
      projectType: m.projectType,
      permitCount: m.count,
      totalValuation: 0,
      computedAt,
    })),
  ]);
}

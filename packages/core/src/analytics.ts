import { contractorNameKey } from "./resolve";
import type {
  ActivityLevel,
  AreaActivityPoint,
  AreaActivitySummary,
  AreaKind,
  CanonicalPermit,
  ContractorActivity,
  ProjectType,
  ProjectTypeShare,
} from "./types";

/** The best date to attribute a permit to a period — issued, else applied. */
export function permitDate(permit: CanonicalPermit): string | undefined {
  return permit.issuedDate ?? permit.appliedDate ?? permit.completedDate;
}

/** "2026-04-18" → "2026-04". */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function addMonths(base: Date, delta: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + delta, 1));
}

function monthLabel(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[d.getUTCMonth()] ?? "";
}

/**
 * Map activity metrics onto the graded scale. A computed analysis, not an
 * official designation. Absolute trailing-12-month volume sets the base level;
 * a strong year-over-year swing nudges it one step.
 */
export function activityLevelFromMetrics(input: {
  trailing12: number;
  yoyChangePct?: number;
}): ActivityLevel {
  const { trailing12, yoyChangePct } = input;
  if (trailing12 === 0) return "quiet";

  const order: ActivityLevel[] = ["quiet", "light", "moderate", "active", "hot"];
  let idx: number;
  if (trailing12 < 25) idx = 0;
  else if (trailing12 < 100) idx = 1;
  else if (trailing12 < 300) idx = 2;
  else if (trailing12 < 800) idx = 3;
  else idx = 4;

  if (yoyChangePct !== undefined) {
    if (yoyChangePct > 30) idx = Math.min(4, idx + 1);
    else if (yoyChangePct < -30) idx = Math.max(0, idx - 1);
  }
  return order[idx]!;
}

/**
 * Build a neighborhood/jurisdiction activity summary from its permits: a 12-month
 * volume + value series, the project-type mix, MoM/YoY momentum, and a graded
 * activity level.
 */
export function buildAreaSummary(input: {
  areaKind: AreaKind;
  areaId: string;
  label: string;
  permits: CanonicalPermit[];
  now?: Date;
}): AreaActivitySummary {
  const now = input.now ?? new Date();
  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // 12-month buckets, oldest → newest.
  const buckets: { key: string; date: Date; point: AreaActivityPoint }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = addMonths(thisMonth, -i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, date: d, point: { period: monthLabel(d), permitCount: 0, totalValuation: 0 } });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

  const start12 = addMonths(thisMonth, -11);
  const startPrior12 = addMonths(thisMonth, -23);

  const mix = new Map<ProjectType, number>();
  let trailing12 = 0;
  let prior12 = 0;

  for (const permit of input.permits) {
    const date = permitDate(permit);
    if (!date) continue;
    const d = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) continue;

    if (d >= start12) {
      trailing12++;
      mix.set(permit.projectType, (mix.get(permit.projectType) ?? 0) + 1);
      const b = bucketByKey.get(monthKey(date));
      if (b) {
        b.point.permitCount++;
        b.point.totalValuation += permit.valuation ?? 0;
      }
    } else if (d >= startPrior12 && d < start12) {
      prior12++;
    }
  }

  const series = buckets.map((b) => b.point);
  const last = series[series.length - 1]?.permitCount ?? 0;
  const prev = series[series.length - 2]?.permitCount ?? 0;
  const momChangePct = prev > 0 ? ((last - prev) / prev) * 100 : undefined;
  const yoyChangePct = prior12 > 0 ? ((trailing12 - prior12) / prior12) * 100 : undefined;

  const projectTypeMix: ProjectTypeShare[] = [...mix.entries()]
    .map(([projectType, count]) => ({ projectType, count, share: trailing12 > 0 ? count / trailing12 : 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    areaKind: input.areaKind,
    areaId: input.areaId,
    label: input.label,
    series,
    projectTypeMix,
    activityLevel: activityLevelFromMetrics({ trailing12, yoyChangePct }),
    momChangePct,
    yoyChangePct,
  };
}

/** Roll up contractor permit activity (public business info only). */
export function buildContractorActivity(permits: CanonicalPermit[]): ContractorActivity[] {
  const map = new Map<
    string,
    {
      name: string;
      license?: string;
      permitCount: number;
      totalValuation: number;
      jurisdictions: Set<string>;
      types: Map<ProjectType, number>;
    }
  >();

  for (const permit of permits) {
    if (!permit.contractorName) continue;
    const key = `${contractorNameKey(permit.contractorName)}|${permit.contractorLicense ?? ""}`;
    let agg = map.get(key);
    if (!agg) {
      agg = {
        name: permit.contractorName,
        license: permit.contractorLicense,
        permitCount: 0,
        totalValuation: 0,
        jurisdictions: new Set(),
        types: new Map(),
      };
      map.set(key, agg);
    }
    agg.permitCount++;
    agg.totalValuation += permit.valuation ?? 0;
    agg.jurisdictions.add(permit.jurisdictionId);
    agg.types.set(permit.projectType, (agg.types.get(permit.projectType) ?? 0) + 1);
  }

  return [...map.values()]
    .map((a) => ({
      name: a.name,
      license: a.license,
      permitCount: a.permitCount,
      totalValuation: a.totalValuation,
      jurisdictions: [...a.jurisdictions],
      topProjectTypes: [...a.types.entries()]
        .sort((x, y) => y[1] - x[1])
        .slice(0, 3)
        .map(([t]) => t),
    }))
    .sort((a, b) => b.permitCount - a.permitCount);
}

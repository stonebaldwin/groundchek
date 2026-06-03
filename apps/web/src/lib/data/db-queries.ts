/**
 * Database-backed implementations of the public read queries — used whenever a
 * DATABASE_URL is configured. Each returns the SAME view-model the demo path
 * returns, so the pages are agnostic to the source. Neighborhood "areas" are
 * ZIP-level, computed live from `permits` joined to `properties` via the Core's
 * analytics (the same `buildAreaSummary` the ingestion rollup uses).
 */
import {
  and,
  desc,
  eq,
  getDb,
  gte,
  ilike,
  isNotNull,
  or,
  schema,
  sql,
} from "@groundbreak/db";
import {
  buildAreaSummary,
  buildContractorActivity,
  contractorNameKey,
  type CanonicalPermit,
} from "@groundbreak/core";
import type {
  AreaActivityData,
  ContractorActivityEntry,
  PermitPin,
  PermitStatus,
  PermitTimelineEntry,
  ProjectType,
} from "@groundbreak/ui";
import type {
  AreaView,
  ContractorView,
  Freshness,
  JurisdictionView,
  PlatformStats,
  PropertyView,
  SearchFilters,
  SearchResults,
} from "./types";

const { properties, permits, contractors, jurisdictions } = schema;
const db = () => getDb();

const PAGE_SIZE = 20;

function iso(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString().slice(0, 10) : undefined;
}

const permitCols = {
  id: permits.id,
  permitNumber: permits.permitNumber,
  projectType: permits.projectType,
  status: permits.status,
  description: permits.description,
  address: permits.address,
  lat: permits.lat,
  lng: permits.lng,
  valuation: permits.valuation,
  contractorName: permits.contractorName,
  contractorLicense: permits.contractorLicense,
  contractorId: permits.contractorId,
  appliedDate: permits.appliedDate,
  issuedDate: permits.issuedDate,
  completedDate: permits.completedDate,
  sourceUrl: permits.sourceUrl,
  jurisdictionId: permits.jurisdictionId,
};
type PermitRow = {
  id: string;
  permitNumber: string;
  projectType: ProjectType;
  status: PermitStatus;
  description: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  valuation: number | null;
  contractorName: string | null;
  contractorLicense: string | null;
  contractorId: string | null;
  appliedDate: Date | null;
  issuedDate: Date | null;
  completedDate: Date | null;
  sourceUrl: string;
  jurisdictionId: string;
};

function rowToTimeline(r: PermitRow, id?: string): PermitTimelineEntry {
  return {
    id: id ?? r.id,
    permitNumber: r.permitNumber,
    projectType: r.projectType,
    status: r.status,
    description: r.description ?? undefined,
    valuation: r.valuation ?? undefined,
    contractorName: r.contractorName ?? undefined,
    contractorLicense: r.contractorLicense ?? undefined,
    appliedDate: iso(r.appliedDate),
    issuedDate: iso(r.issuedDate),
    sourceUrl: r.sourceUrl,
  };
}

function rowToCanonical(r: PermitRow): CanonicalPermit {
  return {
    jurisdictionId: r.jurisdictionId,
    permitNumber: r.permitNumber,
    projectType: r.projectType,
    status: r.status,
    address: r.address,
    valuation: r.valuation ?? undefined,
    contractorName: r.contractorName ?? undefined,
    contractorLicense: r.contractorLicense ?? undefined,
    appliedDate: iso(r.appliedDate),
    issuedDate: iso(r.issuedDate),
    completedDate: iso(r.completedDate),
    sourceUrl: r.sourceUrl,
    retrievedAt: r.issuedDate?.toISOString() ?? new Date().toISOString(),
  };
}

// --- Jurisdiction cache (per request is fine; data is static-ish) -----------

type JurRow = {
  id: string;
  name: string;
  state: string;
  platform: string;
  status: string;
  knownLagMonths: number | null;
  dataCurrentAs: Date | null;
};

async function loadJurisdictions(): Promise<Map<string, JurRow>> {
  const rows = await db()
    .select({
      id: jurisdictions.id,
      name: jurisdictions.name,
      state: jurisdictions.state,
      platform: jurisdictions.platform,
      status: jurisdictions.status,
      knownLagMonths: jurisdictions.knownLagMonths,
      dataCurrentAs: jurisdictions.dataCurrentAs,
    })
    .from(jurisdictions);
  return new Map(rows.map((r) => [r.id, r as JurRow]));
}

function freshnessFor(j: JurRow | undefined, sourceUrl?: string): Freshness {
  return {
    currentAs: iso(j?.dataCurrentAs),
    stale: j?.status === "stale" || j?.status === "broken",
    sourceName: j ? `${j.name} Open Data` : "Source portal",
    sourceUrl,
  };
}

function summaryToActivityData(
  summary: ReturnType<typeof buildAreaSummary>,
  label: string,
): AreaActivityData {
  return {
    label,
    activityLevel: summary.activityLevel,
    totalPermits: summary.series.reduce((s, p) => s + p.permitCount, 0),
    totalValuation: summary.series.reduce((s, p) => s + p.totalValuation, 0),
    momChangePct: summary.momChangePct,
    yoyChangePct: summary.yoyChangePct,
    series: summary.series.map((p) => ({ period: p.period, permitCount: p.permitCount })),
    projectMix: summary.projectTypeMix.map((m) => ({
      type: m.projectType,
      count: m.count,
      share: m.share,
    })),
  };
}

/** All permits in a ZIP (joined through properties), newest first. */
async function permitsInZip(zip: string): Promise<PermitRow[]> {
  return (await db()
    .select(permitCols)
    .from(permits)
    .innerJoin(properties, eq(properties.id, permits.propertyId))
    .where(eq(properties.zip, zip))
    .orderBy(desc(permits.issuedDate))
    .limit(5000)) as PermitRow[];
}

async function areaActivityForZip(zip: string, city?: string): Promise<AreaActivityData | undefined> {
  const rows = await permitsInZip(zip);
  if (rows.length === 0) return undefined;
  const summary = buildAreaSummary({
    areaKind: "zip",
    areaId: zip,
    label: zip,
    permits: rows.map(rowToCanonical),
  });
  return summaryToActivityData(summary, `${zip}${city ? ` · ${city}` : ""}`);
}

// --- Public queries ---------------------------------------------------------

export async function listJurisdictions(): Promise<JurisdictionView[]> {
  const rows = await db()
    .select({
      id: jurisdictions.id,
      name: jurisdictions.name,
      state: jurisdictions.state,
      platform: jurisdictions.platform,
      status: jurisdictions.status,
      knownLagMonths: jurisdictions.knownLagMonths,
      dataCurrentAs: jurisdictions.dataCurrentAs,
      permitCount: sql<number>`count(${permits.id})::int`,
    })
    .from(jurisdictions)
    .leftJoin(permits, eq(permits.jurisdictionId, jurisdictions.id))
    .groupBy(
      jurisdictions.id,
      jurisdictions.name,
      jurisdictions.state,
      jurisdictions.platform,
      jurisdictions.status,
      jurisdictions.knownLagMonths,
      jurisdictions.dataCurrentAs,
    )
    .orderBy(desc(sql`count(${permits.id})`));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    state: r.state,
    platform: r.platform,
    dataCurrentAs: iso(r.dataCurrentAs),
    knownLagMonths: r.knownLagMonths ?? undefined,
    stale: r.status === "stale" || r.status === "broken",
    permitCount: r.permitCount,
  }));
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [agg] = await db()
    .select({
      permits: sql<number>`count(*)::int`,
      valuation: sql<number>`coalesce(sum(${permits.valuation}), 0)::float8`,
    })
    .from(permits);
  const [zc] = await db()
    .select({ zips: sql<number>`count(distinct ${properties.zip})::int` })
    .from(properties)
    .where(isNotNull(properties.zip));
  const [cc] = await db().select({ contractors: sql<number>`count(*)::int` }).from(contractors);
  const jmap = await loadJurisdictions();
  const withData = await db()
    .selectDistinct({ jurisdictionId: permits.jurisdictionId })
    .from(permits);
  const dates = [...jmap.values()].map((j) => j.dataCurrentAs).filter(Boolean) as Date[];
  const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
  return {
    permits: agg?.permits ?? 0,
    totalValuation: agg?.valuation ?? 0,
    zips: zc?.zips ?? 0,
    contractors: cc?.contractors ?? 0,
    markets: withData.length,
    dataCurrentAs: iso(latest),
  };
}

export async function getProperty(key: string): Promise<PropertyView | null> {
  const [prop] = await db().select().from(properties).where(eq(properties.addressKey, key)).limit(1);
  if (!prop) return null;

  const permitRows = (await db()
    .select(permitCols)
    .from(permits)
    .where(eq(permits.propertyId, prop.id))
    .orderBy(desc(permits.issuedDate))) as PermitRow[];

  const totalValuation = permitRows.reduce((s, p) => s + (p.valuation ?? 0), 0);
  const jmap = await loadJurisdictions();
  const j = jmap.get(prop.jurisdictionId ?? "");

  let nearby: PermitPin[] = [];
  if (prop.lat != null && prop.lng != null) {
    const near = (await db()
      .select({
        id: permits.id,
        lat: permits.lat,
        lng: permits.lng,
        projectType: permits.projectType,
        address: permits.address,
      })
      .from(permits)
      .where(
        sql`${permits.geom} IS NOT NULL AND ${permits.propertyId} <> ${prop.id} AND ST_DWithin(${permits.geom}::geography, ST_SetSRID(ST_MakePoint(${prop.lng}, ${prop.lat}), 4326)::geography, 4000)`,
      )
      .orderBy(desc(permits.issuedDate))
      .limit(25)) as Array<{ id: string; lat: number | null; lng: number | null; projectType: ProjectType; address: string }>;
    nearby = near
      .filter((n) => n.lat != null && n.lng != null)
      .map((n) => ({
        id: n.id,
        lat: n.lat as number,
        lng: n.lng as number,
        projectType: n.projectType,
        label: `${n.projectType.replace(/_/g, " ")} — ${n.address}`,
      }));
  }

  const area = prop.zip ? await areaActivityForZip(prop.zip, prop.city ?? undefined) : undefined;
  const displayAddress = permitRows[0]?.address ?? prop.normalizedAddress;
  const lastIssued = permitRows.find((p) => p.issuedDate)?.issuedDate;

  return {
    property: {
      key: prop.addressKey,
      address: displayAddress,
      lat: prop.lat ?? undefined,
      lng: prop.lng ?? undefined,
      jurisdictionId: prop.jurisdictionId ?? "",
      jurisdictionName: j?.name ?? prop.jurisdictionId ?? "",
      zip: prop.zip ?? undefined,
      county: prop.county ?? undefined,
      state: prop.state ?? undefined,
      permitCount: permitRows.length,
      lastPermitDate: iso(lastIssued),
      latestProjectType: permitRows[0]?.projectType,
    },
    permits: permitRows.map((p) => rowToTimeline(p)),
    totalValuation,
    nearby,
    area,
    freshness: freshnessFor(j, permitRows[0]?.sourceUrl),
  };
}

export async function getArea(id: string): Promise<AreaView | null> {
  const rows = await permitsInZip(id);
  if (rows.length === 0) return null;

  const [meta] = await db()
    .select({ city: properties.city, jurisdictionId: properties.jurisdictionId })
    .from(properties)
    .where(eq(properties.zip, id))
    .limit(1);
  const jmap = await loadJurisdictions();
  const j = jmap.get(meta?.jurisdictionId ?? "");
  const label = `${id}${meta?.city ? ` · ${meta.city}` : ""}`;

  const canonical = rows.map(rowToCanonical);
  const summary = buildAreaSummary({ areaKind: "zip", areaId: id, label, permits: canonical });

  // Map "<nameKey>|<license>" → contractor uuid so the list can link to profiles.
  const contractorIdByKey = new Map<string, string>();
  for (const r of rows) {
    if (r.contractorName && r.contractorId) {
      const k = `${contractorNameKey(r.contractorName)}|${r.contractorLicense ?? ""}`;
      if (!contractorIdByKey.has(k)) contractorIdByKey.set(k, r.contractorId);
    }
  }
  const topContractors: ContractorActivityEntry[] = buildContractorActivity(canonical)
    .slice(0, 8)
    .map((c) => {
      const cid = contractorIdByKey.get(`${contractorNameKey(c.name)}|${c.license ?? ""}`);
      return {
        name: c.name,
        license: c.license,
        permitCount: c.permitCount,
        totalValuation: c.totalValuation,
        jurisdictions: c.jurisdictions.map((jid) => jmap.get(jid)?.name ?? jid),
        topProjectTypes: c.topProjectTypes,
        href: cid ? `/contractor/${cid}` : undefined,
      };
    });

  return {
    id,
    kind: "zip",
    label,
    jurisdictionName: j?.name ?? "",
    activityLevel: summary.activityLevel,
    summary: summaryToActivityData(summary, label),
    topContractors,
    recentPermits: rows.slice(0, 8).map((p) => rowToTimeline(p, `${id}-${p.permitNumber}`)),
    freshness: freshnessFor(j),
  };
}

export async function listAreas(): Promise<AreaView[]> {
  const top = await db()
    .select({ zip: properties.zip, n: sql<number>`count(${permits.id})::int` })
    .from(permits)
    .innerJoin(properties, eq(properties.id, permits.propertyId))
    .where(isNotNull(properties.zip))
    .groupBy(properties.zip)
    .orderBy(desc(sql`count(${permits.id})`))
    .limit(9);
  const views = await Promise.all(top.map((t) => (t.zip ? getArea(t.zip) : null)));
  return views.filter((v): v is AreaView => v !== null);
}

export async function getContractor(id: string): Promise<ContractorView | null> {
  const [c] = await db().select().from(contractors).where(eq(contractors.id, id)).limit(1);
  if (!c) return null;

  const permitRows = (await db()
    .select(permitCols)
    .from(permits)
    .where(eq(permits.contractorId, id))
    .orderBy(desc(permits.issuedDate))
    .limit(50)) as PermitRow[];

  const jmap = await loadJurisdictions();
  const typeCounts = new Map<ProjectType, number>();
  for (const p of permitRows) typeCounts.set(p.projectType, (typeCounts.get(p.projectType) ?? 0) + 1);
  const topProjectTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

  return {
    id: c.id,
    name: c.name,
    license: c.license ?? undefined,
    permitCount: c.permitCount,
    totalValuation: c.totalValuation,
    jurisdictions: (c.jurisdictions ?? []).map((jid) => jmap.get(jid)?.name ?? jid),
    topProjectTypes,
    recentPermits: permitRows.map((p) => rowToTimeline(p)),
  };
}

export async function listContractors(): Promise<ContractorView[]> {
  const rows = await db()
    .select()
    .from(contractors)
    .orderBy(desc(contractors.permitCount))
    .limit(60);
  const jmap = await loadJurisdictions();
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    license: c.license ?? undefined,
    permitCount: c.permitCount,
    totalValuation: c.totalValuation,
    jurisdictions: (c.jurisdictions ?? []).map((jid) => jmap.get(jid)?.name ?? jid),
    topProjectTypes: (c.topProjectTypes ?? []) as ProjectType[],
    recentPermits: [],
  }));
}

export async function propertySuggestions(
  q: string,
): Promise<Array<{ key: string; label: string; sublabel?: string }>> {
  const needle = q.trim();
  if (needle.length < 2) return [];
  const rows = await db()
    .select({
      key: properties.addressKey,
      address: properties.normalizedAddress,
      zip: properties.zip,
      county: properties.county,
    })
    .from(properties)
    .where(ilike(properties.normalizedAddress, `%${needle}%`))
    .limit(6);
  return rows.map((r) => ({
    key: r.key,
    label: r.address.replace(/\b[a-z]/gi, (m) => m.toUpperCase()),
    sublabel: [r.zip, r.county ? `${r.county} County` : undefined].filter(Boolean).join(" · ") || undefined,
  }));
}

export async function searchPermits(filters: SearchFilters): Promise<SearchResults> {
  const conds = [];
  if (filters.jurisdiction) conds.push(eq(permits.jurisdictionId, filters.jurisdiction));
  if (filters.projectType) conds.push(eq(permits.projectType, filters.projectType));
  if (filters.status) conds.push(eq(permits.status, filters.status));
  if (filters.minValue) conds.push(gte(permits.valuation, filters.minValue));
  if (filters.q) {
    const like = `%${filters.q.trim()}%`;
    conds.push(
      or(
        ilike(permits.address, like),
        ilike(permits.description, like),
        ilike(permits.contractorName, like),
      )!,
    );
  }
  const where = conds.length ? and(...conds) : undefined;
  const page = Math.max(1, filters.page ?? 1);

  const totalRows = await db()
    .select({ total: sql<number>`count(*)::int` })
    .from(permits)
    .where(where);
  const total = totalRows[0]?.total ?? 0;

  const rows = await db()
    .select({
      propertyKey: properties.addressKey,
      permitNumber: permits.permitNumber,
      address: permits.address,
      jurisdictionId: permits.jurisdictionId,
      projectType: permits.projectType,
      status: permits.status,
      valuation: permits.valuation,
      issuedDate: permits.issuedDate,
    })
    .from(permits)
    .innerJoin(properties, eq(properties.id, permits.propertyId))
    .where(where)
    .orderBy(desc(permits.issuedDate))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const jmap = await loadJurisdictions();
  return {
    items: rows.map((r) => ({
      propertyKey: r.propertyKey,
      permitNumber: r.permitNumber,
      address: r.address,
      jurisdictionName: jmap.get(r.jurisdictionId)?.name ?? r.jurisdictionId,
      projectType: r.projectType,
      status: r.status,
      valuation: r.valuation ?? undefined,
      issuedDate: iso(r.issuedDate),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

// --- Static params + sitemap helpers ----------------------------------------

export async function allPropertyKeys(): Promise<string[]> {
  const rows = await db().select({ key: properties.addressKey }).from(properties).limit(2000);
  return rows.map((r) => r.key);
}

export async function allAreaIds(): Promise<string[]> {
  const rows = await db()
    .selectDistinct({ zip: properties.zip })
    .from(properties)
    .where(isNotNull(properties.zip));
  return rows.map((r) => r.zip!).filter(Boolean);
}

export async function allContractorIds(): Promise<string[]> {
  const rows = await db()
    .select({ id: contractors.id })
    .from(contractors)
    .orderBy(desc(contractors.permitCount))
    .limit(500);
  return rows.map((r) => r.id);
}

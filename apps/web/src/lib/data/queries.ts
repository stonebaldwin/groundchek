import {
  buildContractorActivity,
  contractorNameKey,
  haversineMeters,
  type CanonicalPermit,
} from "@groundbreak/core";
import type {
  ContractorActivityEntry,
  PermitPin,
  PermitTimelineEntry,
} from "@groundbreak/ui";
import { isDbConfigured } from "../env";
import { DEMO_AREAS, DEMO_JURISDICTIONS, DEMO_PROPERTIES, type DemoProperty } from "./demo";
import type {
  AreaView,
  ContractorView,
  JurisdictionView,
  PropertyView,
  SearchFilters,
  SearchResults,
} from "./types";

// --- Mappers ----------------------------------------------------------------

export function permitToTimeline(p: CanonicalPermit, id?: string): PermitTimelineEntry {
  return {
    id: id ?? p.permitNumber,
    permitNumber: p.permitNumber,
    projectType: p.projectType,
    status: p.status,
    description: p.description,
    valuation: p.valuation,
    contractorName: p.contractorName,
    contractorLicense: p.contractorLicense,
    appliedDate: p.appliedDate,
    issuedDate: p.issuedDate,
    sourceUrl: p.sourceUrl,
  };
}

export function contractorId(name: string, license?: string): string {
  const base = contractorNameKey(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return license ? `${base}-${license.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : base;
}

function jurisdictionName(id: string): string {
  return DEMO_JURISDICTIONS.find((j) => j.id === id)?.name ?? id;
}

function freshnessFor(jurisdictionId: string, sourceUrl?: string) {
  const j = DEMO_JURISDICTIONS.find((x) => x.id === jurisdictionId);
  return {
    currentAs: j?.dataCurrentAs,
    stale: j?.stale ?? false,
    sourceName: j ? `${j.name} Open Data` : "Source portal",
    sourceUrl,
  };
}

function latestDate(p: DemoProperty): string | undefined {
  return p.permits
    .map((x) => x.issuedDate ?? x.completedDate ?? x.appliedDate)
    .filter(Boolean)
    .sort()
    .at(-1);
}

// --- Public queries (demo-backed; DB when configured) -----------------------

export async function listJurisdictions(): Promise<JurisdictionView[]> {
  return DEMO_JURISDICTIONS;
}

export async function getProperty(key: string): Promise<PropertyView | null> {
  const demo = DEMO_PROPERTIES.find((p) => p.key === key);
  if (!demo) return null;

  const permits = [...demo.permits].sort((a, b) =>
    (b.issuedDate ?? "").localeCompare(a.issuedDate ?? ""),
  );
  const totalValuation = permits.reduce((s, p) => s + (p.valuation ?? 0), 0);

  const nearby: PermitPin[] = DEMO_PROPERTIES.filter(
    (p) => p.key !== key && haversineMeters({ lat: demo.lat, lng: demo.lng }, { lat: p.lat, lng: p.lng }) < 4000,
  )
    .flatMap((p) =>
      p.permits.slice(0, 1).map((perm) => ({
        id: `${p.key}-${perm.permitNumber}`,
        lat: p.lat,
        lng: p.lng,
        projectType: perm.projectType,
        label: `${perm.projectType.replace(/_/g, " ")} — ${p.address}`,
      })),
    )
    .slice(0, 25);

  const area = DEMO_AREAS.find((a) => a.id === demo.zip)?.data;

  return {
    property: {
      key: demo.key,
      address: demo.address,
      lat: demo.lat,
      lng: demo.lng,
      jurisdictionId: demo.jurisdictionId,
      jurisdictionName: jurisdictionName(demo.jurisdictionId),
      zip: demo.zip,
      county: demo.county,
      state: demo.state,
      permitCount: permits.length,
      lastPermitDate: latestDate(demo),
      latestProjectType: permits[0]?.projectType,
    },
    permits: permits.map((p) => permitToTimeline(p)),
    totalValuation,
    nearby,
    area,
    freshness: freshnessFor(demo.jurisdictionId, demo.permits[0]?.sourceUrl),
  };
}

export async function propertySuggestions(
  q: string,
): Promise<Array<{ key: string; label: string; sublabel?: string }>> {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return DEMO_PROPERTIES.filter((p) => p.address.toLowerCase().includes(needle))
    .slice(0, 6)
    .map((p) => ({ key: p.key, label: p.address, sublabel: `${p.county} County` }));
}

const PAGE_SIZE = 20;

export async function searchPermits(filters: SearchFilters): Promise<SearchResults> {
  const all = DEMO_PROPERTIES.flatMap((prop) =>
    prop.permits.map((permit) => ({ prop, permit })),
  );
  const q = filters.q?.trim().toLowerCase();
  const filtered = all.filter(({ prop, permit }) => {
    if (filters.jurisdiction && prop.jurisdictionId !== filters.jurisdiction) return false;
    if (filters.projectType && permit.projectType !== filters.projectType) return false;
    if (filters.status && permit.status !== filters.status) return false;
    if (filters.minValue && (permit.valuation ?? 0) < filters.minValue) return false;
    if (q && !`${prop.address} ${permit.description ?? ""} ${permit.contractorName ?? ""}`.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
  filtered.sort((a, b) => (b.permit.issuedDate ?? "").localeCompare(a.permit.issuedDate ?? ""));

  const page = filters.page ?? 1;
  const start = (page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE).map(({ prop, permit }) => ({
    propertyKey: prop.key,
    permitNumber: permit.permitNumber,
    address: prop.address,
    jurisdictionName: jurisdictionName(prop.jurisdictionId),
    projectType: permit.projectType,
    status: permit.status,
    valuation: permit.valuation,
    issuedDate: permit.issuedDate,
  }));

  return { items, total: filtered.length, page, pageSize: PAGE_SIZE };
}

export async function listAreas(): Promise<AreaView[]> {
  const views = await Promise.all(DEMO_AREAS.map((a) => getArea(a.id)));
  return views.filter((v): v is AreaView => v !== null);
}

export async function getArea(id: string): Promise<AreaView | null> {
  const demo = DEMO_AREAS.find((a) => a.id === id);
  if (!demo) return null;

  const areaPermits = DEMO_PROPERTIES.filter((p) => p.zip === id).flatMap((p) => p.permits);
  const contractors = buildContractorActivity(areaPermits)
    .slice(0, 6)
    .map<ContractorActivityEntry>((c) => ({
      name: c.name,
      license: c.license,
      permitCount: c.permitCount,
      totalValuation: c.totalValuation,
      jurisdictions: c.jurisdictions.map(jurisdictionName),
      topProjectTypes: c.topProjectTypes,
    }));

  const recentPermits = areaPermits
    .slice()
    .sort((a, b) => (b.issuedDate ?? "").localeCompare(a.issuedDate ?? ""))
    .slice(0, 8)
    .map((p) => permitToTimeline(p, `${id}-${p.permitNumber}`));

  return {
    id: demo.id,
    kind: demo.kind,
    label: demo.data.label,
    jurisdictionName: demo.jurisdictionName,
    activityLevel: demo.data.activityLevel,
    summary: demo.data,
    topContractors: contractors,
    recentPermits,
    freshness: freshnessFor(demo.jurisdictionId, undefined),
  };
}

function allDemoPermits(): Array<{ prop: DemoProperty; permit: CanonicalPermit }> {
  return DEMO_PROPERTIES.flatMap((prop) => prop.permits.map((permit) => ({ prop, permit })));
}

export async function listContractors(): Promise<ContractorView[]> {
  const byId = new Map<string, ContractorView>();
  for (const { prop, permit } of allDemoPermits()) {
    if (!permit.contractorName) continue;
    const id = contractorId(permit.contractorName, permit.contractorLicense);
    let view = byId.get(id);
    if (!view) {
      view = {
        id,
        name: permit.contractorName,
        license: permit.contractorLicense,
        permitCount: 0,
        totalValuation: 0,
        jurisdictions: [],
        topProjectTypes: [],
        recentPermits: [],
      };
      byId.set(id, view);
    }
    view.permitCount++;
    view.totalValuation += permit.valuation ?? 0;
    const jn = jurisdictionName(prop.jurisdictionId);
    if (!view.jurisdictions.includes(jn)) view.jurisdictions.push(jn);
    if (!view.topProjectTypes.includes(permit.projectType)) view.topProjectTypes.push(permit.projectType);
    view.recentPermits.push(permitToTimeline(permit, `${id}-${permit.permitNumber}`));
  }
  return [...byId.values()].sort((a, b) => b.permitCount - a.permitCount);
}

export async function getContractor(id: string): Promise<ContractorView | null> {
  const all = await listContractors();
  const found = all.find((c) => c.id === id) ?? null;
  if (found) {
    found.recentPermits.sort((a, b) => (b.issuedDate ?? "").localeCompare(a.issuedDate ?? ""));
    found.topProjectTypes = found.topProjectTypes.slice(0, 4);
  }
  return found;
}

// --- Static params + sitemap helpers ----------------------------------------

export async function allPropertyKeys(): Promise<string[]> {
  return DEMO_PROPERTIES.map((p) => p.key);
}
export async function allAreaIds(): Promise<string[]> {
  return DEMO_AREAS.map((a) => a.id);
}
export async function allContractorIds(): Promise<string[]> {
  return (await listContractors()).map((c) => c.id);
}

// Note: a database is detected via isDbConfigured(); when wired (Phase 6 seeds
// the same demo set into Postgres), these queries swap to Drizzle reads against
// `properties`/`permits`/`area_aggregates`/`contractors` with PostGIS radius
// search. Demo data keeps the app fully reviewable before any jurisdiction is
// configured.
export { isDbConfigured };

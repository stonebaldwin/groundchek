import { addressKey, type CanonicalPermit } from "@groundbreak/core";
import type { AreaActivityData } from "@groundbreak/ui";
import type { JurisdictionView } from "./types";

export interface DemoProperty {
  key: string;
  address: string;
  lat: number;
  lng: number;
  jurisdictionId: string;
  zip: string;
  county: string;
  state: string;
  permits: CanonicalPermit[];
}

interface PermitSeed extends Partial<CanonicalPermit> {
  permitNumber: string;
  projectType: CanonicalPermit["projectType"];
  status: CanonicalPermit["status"];
}

function makeProperty(input: {
  address: string;
  lat: number;
  lng: number;
  jurisdictionId: string;
  zip: string;
  county: string;
  state: string;
  sourceUrl: string;
  permits: PermitSeed[];
}): DemoProperty {
  const key = addressKey(input.address);
  const permits = input.permits.map<CanonicalPermit>((p) => ({
    jurisdictionId: input.jurisdictionId,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    sourceUrl: input.sourceUrl,
    retrievedAt: "2026-06-02T08:00:00Z",
    ...p,
  }));
  return {
    key,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    jurisdictionId: input.jurisdictionId,
    zip: input.zip,
    county: input.county,
    state: input.state,
    permits,
  };
}

const AUSTIN = "https://data.austintexas.gov/d/3syk-w9eu";
const WILMINGTON = "https://data-wilmingtonnc.opendata.arcgis.com/";
const LA = "https://data.lacity.org/d/yv23-pmwf";

export const DEMO_JURISDICTIONS: JurisdictionView[] = [
  { id: "us-tx-austin", name: "Austin", state: "TX", platform: "socrata", dataCurrentAs: "2026-05-29", stale: false, permitCount: 1284 },
  { id: "us-nc-wilmington", name: "Wilmington", state: "NC", platform: "arcgis", dataCurrentAs: "2026-05-27", stale: false, permitCount: 412 },
  { id: "us-ca-losangeles", name: "Los Angeles", state: "CA", platform: "socrata", dataCurrentAs: "2024-09-01", knownLagMonths: 18, stale: true, permitCount: 9120 },
];

export const DEMO_PROPERTIES: DemoProperty[] = [
  makeProperty({
    address: "1100 E 5th St, Austin, TX 78702",
    lat: 30.2618,
    lng: -97.7298,
    jurisdictionId: "us-tx-austin",
    zip: "78702",
    county: "Travis",
    state: "TX",
    sourceUrl: AUSTIN,
    permits: [
      { permitNumber: "2026-014532 BP", projectType: "addition", status: "issued", description: "Second-story addition, 620 sq ft, over existing garage.", valuation: 185000, contractorName: "Lone Star Builders LLC", contractorLicense: "TX-CGC-44821", appliedDate: "2026-03-01", issuedDate: "2026-04-18" },
      { permitNumber: "2025-098221 EP", projectType: "solar", status: "completed", description: "Rooftop photovoltaic system, 8.2 kW, 22 panels.", valuation: 24500, contractorName: "Sunfield Solar", contractorLicense: "TX-EC-7731", issuedDate: "2025-09-02", completedDate: "2025-10-14" },
      { permitNumber: "2024-051120 BP", projectType: "roofing", status: "expired", description: "Tear-off and reroof, composition shingle.", valuation: 18900, contractorName: "Hill Country Roofing", issuedDate: "2024-05-11" },
    ],
  }),
  makeProperty({
    address: "2009 E Cesar Chavez St, Austin, TX 78702",
    lat: 30.2554,
    lng: -97.7211,
    jurisdictionId: "us-tx-austin",
    zip: "78702",
    county: "Travis",
    state: "TX",
    sourceUrl: AUSTIN,
    permits: [
      { permitNumber: "2026-002981 BP", projectType: "new_construction", status: "issued", description: "New 4-unit residential building, 3 stories.", valuation: 640000, contractorName: "Lone Star Builders LLC", contractorLicense: "TX-CGC-44821", issuedDate: "2026-02-10" },
      { permitNumber: "2025-114002 BP", projectType: "demolition", status: "completed", description: "Demolition of existing single-family residence.", valuation: 15000, contractorName: "CapDev Demolition", issuedDate: "2025-11-01", completedDate: "2025-11-20" },
    ],
  }),
  makeProperty({
    address: "1400 E 6th St, Austin, TX 78702",
    lat: 30.2627,
    lng: -97.7255,
    jurisdictionId: "us-tx-austin",
    zip: "78702",
    county: "Travis",
    state: "TX",
    sourceUrl: AUSTIN,
    permits: [
      { permitNumber: "2026-021188 BP", projectType: "alteration", status: "in_progress", description: "Interior remodel, restaurant tenant improvement.", valuation: 92000, contractorName: "Eastside Renovations", contractorLicense: "TX-CGC-55190", issuedDate: "2026-05-20" },
      { permitNumber: "2026-021190 EP", projectType: "electrical", status: "issued", description: "Service panel upgrade to 400A for TI.", valuation: 8200, contractorName: "Volt Electric Co", contractorLicense: "TX-EC-8841", issuedDate: "2026-05-22" },
    ],
  }),
  makeProperty({
    address: "3000 E 12th St, Austin, TX 78702",
    lat: 30.2745,
    lng: -97.7012,
    jurisdictionId: "us-tx-austin",
    zip: "78702",
    county: "Travis",
    state: "TX",
    sourceUrl: AUSTIN,
    permits: [
      { permitNumber: "2026-018442 BP", projectType: "adu", status: "issued", description: "Detached accessory dwelling unit, 480 sq ft.", valuation: 160000, contractorName: "Lone Star Builders LLC", contractorLicense: "TX-CGC-44821", issuedDate: "2026-03-15" },
    ],
  }),
  makeProperty({
    address: "412 Castle St, Wilmington, NC 28401",
    lat: 34.2275,
    lng: -77.9472,
    jurisdictionId: "us-nc-wilmington",
    zip: "28401",
    county: "New Hanover",
    state: "NC",
    sourceUrl: WILMINGTON,
    permits: [
      { permitNumber: "WIL-2026-3391", projectType: "roofing", status: "completed", description: "Reroof, architectural shingle, 28 squares.", valuation: 16400, contractorName: "Cape Fear Roofing", issuedDate: "2026-04-02", completedDate: "2026-04-30" },
      { permitNumber: "WIL-2025-8820", projectType: "hvac", status: "completed", description: "HVAC changeout, 3-ton heat pump.", valuation: 9200, contractorName: "Coastal Air & Heat", issuedDate: "2025-08-12" },
    ],
  }),
  makeProperty({
    address: "220 S 3rd St, Wilmington, NC 28401",
    lat: 34.2329,
    lng: -77.9468,
    jurisdictionId: "us-nc-wilmington",
    zip: "28401",
    county: "New Hanover",
    state: "NC",
    sourceUrl: WILMINGTON,
    permits: [
      { permitNumber: "WIL-2026-2210", projectType: "alteration", status: "issued", description: "Historic district interior renovation.", valuation: 40000, contractorName: "Historic Restorations Inc", issuedDate: "2026-03-10" },
    ],
  }),
  makeProperty({
    address: "800 N Alameda St, Los Angeles, CA 90012",
    lat: 34.0606,
    lng: -118.2368,
    jurisdictionId: "us-ca-losangeles",
    zip: "90012",
    county: "Los Angeles",
    state: "CA",
    sourceUrl: LA,
    permits: [
      { permitNumber: "LA-2024-PV-44210", projectType: "new_construction", status: "issued", description: "New mixed-use building, 6 stories.", valuation: 2100000, contractorName: "Metro Builders Group", issuedDate: "2024-06-01" },
    ],
  }),
];

// Hand-authored area rollups (normally precomputed into `area_aggregates`).
export const DEMO_AREAS: Array<{
  id: string;
  kind: "zip";
  jurisdictionId: string;
  jurisdictionName: string;
  data: AreaActivityData;
}> = [
  {
    id: "78702",
    kind: "zip",
    jurisdictionId: "us-tx-austin",
    jurisdictionName: "Austin",
    data: {
      label: "78702 · East Austin",
      activityLevel: "active",
      totalPermits: 1284,
      totalValuation: 412_000_000,
      momChangePct: 12,
      yoyChangePct: 41,
      series: [
        { period: "Jul", permitCount: 78 },
        { period: "Aug", permitCount: 86 },
        { period: "Sep", permitCount: 92 },
        { period: "Oct", permitCount: 81 },
        { period: "Nov", permitCount: 74 },
        { period: "Dec", permitCount: 69 },
        { period: "Jan", permitCount: 88 },
        { period: "Feb", permitCount: 97 },
        { period: "Mar", permitCount: 110 },
        { period: "Apr", permitCount: 124 },
        { period: "May", permitCount: 131 },
        { period: "Jun", permitCount: 104 },
      ],
      projectMix: [
        { type: "alteration", count: 410, share: 0.32 },
        { type: "addition", count: 244, share: 0.19 },
        { type: "new_construction", count: 167, share: 0.13 },
        { type: "roofing", count: 141, share: 0.11 },
        { type: "solar", count: 128, share: 0.1 },
        { type: "adu", count: 90, share: 0.07 },
        { type: "other", count: 104, share: 0.08 },
      ],
    },
  },
  {
    id: "28401",
    kind: "zip",
    jurisdictionId: "us-nc-wilmington",
    jurisdictionName: "Wilmington",
    data: {
      label: "28401 · Downtown Wilmington",
      activityLevel: "moderate",
      totalPermits: 412,
      totalValuation: 88_000_000,
      momChangePct: 4,
      yoyChangePct: 9,
      series: [
        { period: "Jul", permitCount: 28 },
        { period: "Aug", permitCount: 31 },
        { period: "Sep", permitCount: 26 },
        { period: "Oct", permitCount: 33 },
        { period: "Nov", permitCount: 29 },
        { period: "Dec", permitCount: 22 },
        { period: "Jan", permitCount: 27 },
        { period: "Feb", permitCount: 30 },
        { period: "Mar", permitCount: 35 },
        { period: "Apr", permitCount: 38 },
        { period: "May", permitCount: 41 },
        { period: "Jun", permitCount: 36 },
      ],
      projectMix: [
        { type: "roofing", count: 96, share: 0.23 },
        { type: "alteration", count: 88, share: 0.21 },
        { type: "hvac", count: 64, share: 0.16 },
        { type: "addition", count: 50, share: 0.12 },
        { type: "solar", count: 41, share: 0.1 },
        { type: "other", count: 73, share: 0.18 },
      ],
    },
  },
];

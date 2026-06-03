import type {
  ActivityLevel,
  AreaActivityData,
  ContractorActivityEntry,
  PermitPin,
  PermitStatus,
  PermitTimelineEntry,
  ProjectType,
} from "@groundbreak/ui";

export interface JurisdictionView {
  id: string;
  name: string;
  state: string;
  platform: string;
  dataCurrentAs?: string;
  knownLagMonths?: number;
  stale: boolean;
  permitCount: number;
}

export interface Freshness {
  currentAs?: string;
  stale: boolean;
  sourceName: string;
  sourceUrl?: string;
}

export interface PropertySummary {
  key: string;
  address: string;
  lat?: number;
  lng?: number;
  jurisdictionId: string;
  jurisdictionName: string;
  zip?: string;
  county?: string;
  state?: string;
  permitCount: number;
  lastPermitDate?: string;
  latestProjectType?: ProjectType;
}

export interface PropertyView {
  property: PropertySummary;
  permits: PermitTimelineEntry[];
  totalValuation: number;
  nearby: PermitPin[];
  area?: AreaActivityData;
  freshness: Freshness;
}

export interface AreaView {
  id: string;
  kind: "zip" | "neighborhood" | "jurisdiction";
  label: string;
  jurisdictionName: string;
  activityLevel: ActivityLevel;
  summary: AreaActivityData;
  topContractors: ContractorActivityEntry[];
  recentPermits: PermitTimelineEntry[];
  freshness: Freshness;
}

export interface ContractorView {
  id: string;
  name: string;
  license?: string;
  permitCount: number;
  totalValuation: number;
  jurisdictions: string[];
  topProjectTypes: ProjectType[];
  recentPermits: PermitTimelineEntry[];
}

export interface SearchFilters {
  q?: string;
  jurisdiction?: string;
  projectType?: ProjectType;
  status?: PermitStatus;
  minValue?: number;
  page?: number;
}

export interface SearchResultItem {
  propertyKey: string;
  permitNumber: string;
  address: string;
  jurisdictionName: string;
  projectType: ProjectType;
  status: PermitStatus;
  valuation?: number;
  issuedDate?: string;
}

export interface SearchResults {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlatformStats {
  permits: number;
  totalValuation: number;
  zips: number;
  contractors: number;
  markets: number;
  dataCurrentAs?: string;
}

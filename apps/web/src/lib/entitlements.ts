export type Plan = "free" | "pro" | "business";

export interface Entitlements {
  plan: Plan;
  /** Permits shown free before the paywall on a property page. */
  freeHistoryLimit: number;
  fullPermitHistory: boolean;
  nearbyDepth: boolean;
  areaDepth: boolean;
  alerts: number;
  brandedReports: boolean;
  exports: boolean;
  contractorIntel: boolean;
  api: boolean;
  seats: number;
  /** Free-tier monthly lookup cap (metered). Infinity for paid. */
  monthlyLookups: number;
}

export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: {
    plan: "free",
    freeHistoryLimit: 3,
    fullPermitHistory: false,
    nearbyDepth: false,
    areaDepth: false,
    alerts: 0,
    brandedReports: false,
    exports: false,
    contractorIntel: false,
    api: false,
    seats: 1,
    monthlyLookups: 10,
  },
  pro: {
    plan: "pro",
    freeHistoryLimit: Number.MAX_SAFE_INTEGER,
    fullPermitHistory: true,
    nearbyDepth: true,
    areaDepth: true,
    alerts: 25,
    brandedReports: true,
    exports: false,
    contractorIntel: false,
    api: false,
    seats: 1,
    monthlyLookups: Number.MAX_SAFE_INTEGER,
  },
  business: {
    plan: "business",
    freeHistoryLimit: Number.MAX_SAFE_INTEGER,
    fullPermitHistory: true,
    nearbyDepth: true,
    areaDepth: true,
    alerts: 500,
    brandedReports: true,
    exports: true,
    contractorIntel: true,
    api: true,
    seats: 10,
    monthlyLookups: Number.MAX_SAFE_INTEGER,
  },
};

export function entitlementsFor(plan: Plan): Entitlements {
  return PLAN_ENTITLEMENTS[plan];
}

export interface PlanInfo {
  plan: Plan;
  name: string;
  priceMonthly: number;
  blurb: string;
  audience: string;
  features: string[];
}

export const PLAN_CATALOG: PlanInfo[] = [
  {
    plan: "free",
    name: "Free",
    priceMonthly: 0,
    blurb: "Look up recent permits at a property.",
    audience: "Curious homeowners & first looks",
    features: [
      "Recent permits at any property (one market)",
      "Basic neighborhood activity teaser",
      "Source attribution + freshness dates",
    ],
  },
  {
    plan: "pro",
    name: "Pro",
    priceMonthly: 29,
    blurb: "Full history, nearby activity, and alerts.",
    audience: "Agents, investors & homebuyers",
    features: [
      "Full permit history per property",
      "Nearby permits + neighborhood activity depth",
      "Watch properties & areas — new-permit alerts",
      "Branded PDF property reports",
      "Saved properties & watchlists",
    ],
  },
  {
    plan: "business",
    name: "Business",
    priceMonthly: 99,
    blurb: "Contractor intelligence, exports, API & seats.",
    audience: "Brokerages, contractors & suppliers",
    features: [
      "Everything in Pro",
      "Area monitoring & contractor-activity intelligence",
      "Bulk CSV export of permits / areas / contractors",
      "API access (key-managed)",
      "Team seats & shared watchlists",
    ],
  },
];

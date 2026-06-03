import { describe, expect, it } from "vitest";
import {
  activityLevelFromMetrics,
  buildAreaSummary,
  buildContractorActivity,
  type CanonicalPermit,
} from "../src/index";

function permit(partial: Partial<CanonicalPermit>): CanonicalPermit {
  return {
    jurisdictionId: "us-tx-austin",
    permitNumber: Math.random().toString(36).slice(2),
    projectType: "alteration",
    status: "issued",
    address: "1 Test St",
    sourceUrl: "https://example.test",
    retrievedAt: "2026-06-02T00:00:00Z",
    ...partial,
  };
}

describe("activityLevelFromMetrics", () => {
  it("grades by volume", () => {
    expect(activityLevelFromMetrics({ trailing12: 0 })).toBe("quiet");
    expect(activityLevelFromMetrics({ trailing12: 10 })).toBe("quiet");
    expect(activityLevelFromMetrics({ trailing12: 50 })).toBe("light");
    expect(activityLevelFromMetrics({ trailing12: 200 })).toBe("moderate");
    expect(activityLevelFromMetrics({ trailing12: 500 })).toBe("active");
    expect(activityLevelFromMetrics({ trailing12: 1200 })).toBe("hot");
  });
  it("nudges up on a strong YoY swing", () => {
    expect(activityLevelFromMetrics({ trailing12: 200, yoyChangePct: 45 })).toBe("active");
    expect(activityLevelFromMetrics({ trailing12: 200, yoyChangePct: -45 })).toBe("light");
  });
});

describe("buildAreaSummary", () => {
  it("builds a 12-month series + mix", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    const permits: CanonicalPermit[] = [
      permit({ projectType: "roofing", issuedDate: "2026-05-10", valuation: 20000 }),
      permit({ projectType: "roofing", issuedDate: "2026-06-01", valuation: 22000 }),
      permit({ projectType: "solar", issuedDate: "2026-06-02", valuation: 25000 }),
      permit({ projectType: "adu", issuedDate: "2025-12-01", valuation: 180000 }),
      permit({ projectType: "alteration", issuedDate: "2024-01-01", valuation: 9000 }), // outside window
    ];
    const summary = buildAreaSummary({
      areaKind: "zip",
      areaId: "78702",
      label: "78702",
      permits,
      now,
    });
    expect(summary.series).toHaveLength(12);
    // 4 permits fall in the trailing 12 months.
    const total = summary.series.reduce((s, p) => s + p.permitCount, 0);
    expect(total).toBe(4);
    expect(summary.projectTypeMix[0]?.projectType).toBe("roofing");
    expect(summary.activityLevel).toBe("quiet");
  });
});

describe("buildContractorActivity", () => {
  it("rolls up by contractor", () => {
    const permits: CanonicalPermit[] = [
      permit({ contractorName: "Lone Star Builders LLC", contractorLicense: "TX-1", valuation: 100000, projectType: "addition" }),
      permit({ contractorName: "Lone Star Builders, LLC", contractorLicense: "TX-1", valuation: 50000, projectType: "alteration" }),
      permit({ contractorName: "Sunfield Solar", valuation: 25000, projectType: "solar" }),
    ];
    const rollup = buildContractorActivity(permits);
    expect(rollup[0]?.name).toContain("Lone Star");
    expect(rollup[0]?.permitCount).toBe(2);
    expect(rollup[0]?.totalValuation).toBe(150000);
  });
});

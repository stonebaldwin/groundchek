import { describe, expect, it } from "vitest";
import { applyMapping, parseCurrency, parseDateIso } from "../src/index";
import { AUSTIN_MAPPING, austinRow } from "./fixtures";

describe("parseCurrency", () => {
  it("strips $ and commas", () => {
    expect(parseCurrency("$1,250,000.00")).toBe(1250000);
    expect(parseCurrency("185000")).toBe(185000);
    expect(parseCurrency(42)).toBe(42);
  });
  it("returns undefined for non-numeric", () => {
    expect(parseCurrency("N/A")).toBeUndefined();
    expect(parseCurrency("")).toBeUndefined();
    expect(parseCurrency(null)).toBeUndefined();
  });
});

describe("parseDateIso", () => {
  it("handles ISO timestamps", () => {
    expect(parseDateIso("2026-04-18T00:00:00.000")).toBe("2026-04-18");
  });
  it("handles US M/D/YYYY", () => {
    expect(parseDateIso("4/8/2026")).toBe("2026-04-08");
  });
  it("handles epoch milliseconds (ArcGIS)", () => {
    const out = parseDateIso(1713398400000);
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("returns undefined for junk", () => {
    expect(parseDateIso("not a date")).toBeUndefined();
    expect(parseDateIso("")).toBeUndefined();
  });
});

describe("applyMapping", () => {
  it("maps + coerces an Austin row", () => {
    const m = applyMapping(austinRow(), AUSTIN_MAPPING);
    expect(m.permitNumber).toBe("2026-014532 BP");
    expect(m.valuation).toBe(185000);
    expect(m.lat).toBeCloseTo(30.2672);
    expect(m.lng).toBeCloseTo(-97.7431);
    expect(m.issuedDate).toBe("2026-04-18");
    expect(m.contractorName).toBe("Lone Star Builders LLC");
  });

  it("uses fallback columns when the primary is empty", () => {
    const row = austinRow({ contractor_company_name: "", applicant_org: "Backup Contracting" });
    const m = applyMapping(row, AUSTIN_MAPPING);
    expect(m.contractorName).toBe("Backup Contracting");
  });
});

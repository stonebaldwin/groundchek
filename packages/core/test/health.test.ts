import { describe, expect, it } from "vitest";
import { detectAnomalies, deriveSyncStatus, isStale } from "../src/index";

describe("isStale", () => {
  const now = new Date("2026-06-02T00:00:00Z");
  it("flags a portal gone quiet past cadence", () => {
    expect(isStale("2024-01-01", "monthly", 0, now)).toBe(true);
    expect(isStale("2026-05-30", "weekly", 0, now)).toBe(false);
  });
  it("widens allowance for known lag", () => {
    expect(isStale("2026-01-01", "monthly", 12, now)).toBe(false);
  });
});

describe("detectAnomalies", () => {
  const base = {
    recordsSeen: 100,
    recordsNew: 10,
    recordsUpdated: 90,
    mappingFailures: 0,
    cadence: "weekly" as const,
    dataCurrentAs: "2026-05-30",
    now: new Date("2026-06-02T00:00:00Z"),
  };

  it("flags a zero-row run that previously had rows", () => {
    const a = detectAnomalies({ ...base, recordsSeen: 0, priorRecordsSeen: 500 });
    expect(a.some((x) => x.includes("Zero rows"))).toBe(true);
  });
  it("flags a big volume drop", () => {
    const a = detectAnomalies({ ...base, recordsSeen: 100, priorRecordsSeen: 500 });
    expect(a.some((x) => x.includes("dropped"))).toBe(true);
  });
  it("flags mapping failures", () => {
    const a = detectAnomalies({ ...base, mappingFailures: 7 });
    expect(a.some((x) => x.includes("failed field mapping"))).toBe(true);
  });
  it("flags a stale source", () => {
    const a = detectAnomalies({ ...base, dataCurrentAs: "2024-01-01" });
    expect(a.some((x) => x.includes("stale source"))).toBe(true);
    expect(deriveSyncStatus({ ...base, dataCurrentAs: "2024-01-01" }, a)).toBe("stale");
  });
});

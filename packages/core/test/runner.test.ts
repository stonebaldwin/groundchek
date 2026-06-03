import { describe, expect, it } from "vitest";
import { createInMemoryRepository, runJurisdiction, type JurisdictionConfig } from "../src/index";
import { AUSTIN_MAPPING, austinRow } from "./fixtures";

const config: JurisdictionConfig = {
  jurisdictionId: "us-tx-test",
  platform: "carto", // routes to the injectable browser connector
  portalBaseUrl: "https://example.test",
  fieldMapping: AUSTIN_MAPPING,
  cadence: "weekly",
};

const now = () => new Date("2026-06-02T00:00:00Z");

describe("runJurisdiction", () => {
  it("ingests, resolves properties, and emits new-permit events", async () => {
    const repo = createInMemoryRepository();
    const rows = [
      austinRow({ permit_number: "A1", original_address1: "100 Main St", issued_date: "2026-05-20T00:00:00.000" }),
      austinRow({ permit_number: "A2", original_address1: "200 Main St", issued_date: "2026-05-22T00:00:00.000" }),
    ];
    const outcome = await runJurisdiction(config, {
      repo,
      now,
      connectorDeps: { browserFetcher: async () => rows },
    });
    expect(outcome.recordsSeen).toBe(2);
    expect(outcome.recordsNew).toBe(2);
    expect(outcome.events).toBe(2);
    expect(outcome.status).toBe("ok");
    expect(repo.state.permits.size).toBe(2);
    expect(repo.state.properties.size).toBe(2);
  });

  it("detects a status change on re-run", async () => {
    const repo = createInMemoryRepository();
    await runJurisdiction(config, {
      repo,
      now,
      connectorDeps: {
        browserFetcher: async () => [
          austinRow({ permit_number: "A1", status_current: "Issued", issued_date: "2026-05-20T00:00:00.000" }),
        ],
      },
    });
    const outcome = await runJurisdiction(config, {
      repo,
      now,
      connectorDeps: {
        browserFetcher: async () => [
          austinRow({ permit_number: "A1", status_current: "Final", issued_date: "2026-05-20T00:00:00.000" }),
        ],
      },
    });
    expect(outcome.recordsUpdated).toBe(1);
    expect(repo.state.events.filter((e) => e.type === "status_change")).toHaveLength(1);
  });

  it("counts mapping failures as a partial run", async () => {
    const repo = createInMemoryRepository();
    const outcome = await runJurisdiction(config, {
      repo,
      now,
      connectorDeps: { browserFetcher: async () => [austinRow({ permit_number: "" })] },
    });
    expect(outcome.status).toBe("partial");
    expect(repo.state.permits.size).toBe(0);
  });
});

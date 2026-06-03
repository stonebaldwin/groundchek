import { describe, expect, it } from "vitest";
import { createSocrataConnector, ParseError } from "../src/index";
import { AUSTIN_CONFIG, austinRow } from "./fixtures";

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("socrata connector", () => {
  it("fetches and parses a page of rows", async () => {
    const fetchImpl = (async () =>
      jsonResponse([austinRow(), austinRow({ permit_number: "X2" })])) as unknown as typeof fetch;
    const connector = createSocrataConnector(AUSTIN_CONFIG, { fetchImpl });
    const raws = await connector.fetchRaw({ limit: 10 });
    expect(raws).toHaveLength(2);
    expect(raws[0]?.sourceUrl).toContain("/d/");
    const permit = connector.normalize(raws[0]!);
    expect(permit.projectType).toBe("adu");
    expect(permit.jurisdictionId).toBe("us-tx-austin");
  });

  it("throws ParseError on a non-array response (SoQL error)", async () => {
    const fetchImpl = (async () =>
      jsonResponse({ error: true, message: "invalid SoQL" })) as unknown as typeof fetch;
    const connector = createSocrataConnector(AUSTIN_CONFIG, { fetchImpl });
    await expect(connector.fetchRaw({ limit: 10 })).rejects.toBeInstanceOf(ParseError);
  });
});

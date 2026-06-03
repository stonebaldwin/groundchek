import { describe, expect, it } from "vitest";
import { MappingError, normalizePermit } from "../src/index";
import { AUSTIN_MAPPING, austinRow, rawPermit } from "./fixtures";

describe("normalizePermit", () => {
  it("produces a canonical permit", () => {
    const permit = normalizePermit(rawPermit(austinRow()), AUSTIN_MAPPING);
    expect(permit.permitNumber).toBe("2026-014532 BP");
    expect(permit.projectType).toBe("adu");
    expect(permit.status).toBe("issued");
    expect(permit.valuation).toBe(185000);
    expect(permit.issuedDate).toBe("2026-04-18");
    expect(permit.contractorName).toBe("Lone Star Builders LLC");
    expect(permit.jurisdictionId).toBe("us-tx-austin");
    expect(permit.sourceUrl).toContain("austintexas");
  });

  it("throws MappingError when the permit number is missing", () => {
    const row = austinRow({ permit_number: "" });
    expect(() => normalizePermit(rawPermit(row), AUSTIN_MAPPING)).toThrow(MappingError);
  });

  it("classifies status terminal states first", () => {
    const permit = normalizePermit(rawPermit(austinRow({ status_current: "Expired" })), AUSTIN_MAPPING);
    expect(permit.status).toBe("expired");
  });
});

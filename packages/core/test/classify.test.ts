import { describe, expect, it } from "vitest";
import { classifyProjectType } from "../src/index";

describe("classifyProjectType", () => {
  const cases: Array<[string, ReturnType<typeof classifyProjectType>]> = [
    ["Detached ADU, 600 sqft", "adu"],
    ["Rooftop solar PV system, 8kW", "solar"],
    ["Demolition of single family residence", "demolition"],
    ["Reroof — composition shingle", "roofing"],
    ["HVAC condenser replacement", "hvac"],
    ["New single family dwelling", "new_construction"],
    ["Kitchen remodel and bathroom renovation", "alteration"],
    ["Water heater replacement", "plumbing"],
    ["Install in-ground swimming pool", "pool"],
    ["Service panel upgrade to 200A", "electrical"],
    ["6ft wood privacy fence", "fence"],
    ["Second story addition over garage", "addition"],
  ];

  for (const [text, expected] of cases) {
    it(`classifies "${text}" as ${expected}`, () => {
      expect(classifyProjectType({ description: text })).toBe(expected);
    });
  }

  it("honors a native ADU flag over text", () => {
    expect(classifyProjectType({ description: "Kitchen remodel", isAdu: true })).toBe("adu");
  });

  it("falls back to other", () => {
    expect(classifyProjectType({ description: "Miscellaneous work" })).toBe("other");
  });
});

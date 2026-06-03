import type { FieldMapping, JurisdictionConfig, RawPermit } from "../src/index";

/** An Austin-style Socrata permit field mapping. */
export const AUSTIN_MAPPING: FieldMapping = {
  permitNumber: { column: "permit_number" },
  permitType: { column: "permit_type_desc" },
  status: { column: "status_current" },
  description: { column: "description" },
  address: { column: "original_address1" },
  latitude: { column: "latitude" },
  longitude: { column: "longitude" },
  valuation: { column: "total_job_valuation", type: "currency" },
  contractorName: { column: "contractor_company_name", fallback: ["applicant_org"] },
  contractorLicense: { column: "contractor_license" },
  appliedDate: { column: "applied_date", type: "date" },
  issuedDate: { column: "issued_date", type: "date" },
  completedDate: { column: "completed_date", type: "date" },
};

export const AUSTIN_CONFIG: JurisdictionConfig = {
  jurisdictionId: "us-tx-austin",
  platform: "socrata",
  portalBaseUrl: "https://data.austintexas.gov",
  datasetId: "3syk-w9eu",
  fieldMapping: AUSTIN_MAPPING,
  cadence: "weekly",
};

export function austinRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    permit_number: "2026-014532 BP",
    permit_type_desc: "Building Permit",
    status_current: "Issued",
    description: "Detached ADU, 600 sqft over garage",
    original_address1: "1100 E 5th St",
    latitude: "30.2672",
    longitude: "-97.7431",
    total_job_valuation: "$185,000",
    contractor_company_name: "Lone Star Builders LLC",
    contractor_license: "TX-CGC-44821",
    applied_date: "2026-03-01T00:00:00.000",
    issued_date: "2026-04-18T00:00:00.000",
    ...overrides,
  };
}

export function rawPermit(data: Record<string, unknown>, jurisdictionId = "us-tx-austin"): RawPermit {
  return {
    jurisdictionId,
    retrievedAt: "2026-06-02T00:00:00.000Z",
    sourceUrl: "https://data.austintexas.gov/d/3syk-w9eu",
    data,
  };
}

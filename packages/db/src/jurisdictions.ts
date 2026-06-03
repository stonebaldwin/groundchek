/**
 * Canonical connector field mappings for seeded jurisdictions — their portal
 * columns → our canonical fields. Stored verbatim into `permit_datasets.fieldMapping`
 * (jsonb); the Core normalizer reads it. Kept in a side-effect-free module so both
 * the seed and the local ingestion runner share one source of truth.
 *
 * Austin "Issued Construction Permits" (Socrata `3syk-w9eu`) — column names verified
 * against the live dataset's field metadata (the portal uses `issue_date` /
 * `applieddate` / `expiresdate`, NOT `issued_date` / `applied_date`).
 */
export const AUSTIN_FIELD_MAPPING = {
  permitNumber: { column: "permit_number" },
  permitType: { column: "permit_type_desc", fallback: ["permit_class"] },
  status: { column: "status_current" },
  description: { column: "description" },
  address: { column: "original_address1" },
  latitude: { column: "latitude", type: "number" },
  longitude: { column: "longitude", type: "number" },
  valuation: { column: "total_job_valuation", type: "currency" },
  contractorName: { column: "contractor_company_name" },
  contractorLicense: { column: "contractor_trade" },
  appliedDate: { column: "applieddate", type: "date" },
  issuedDate: { column: "issue_date", type: "date" },
  expirationDate: { column: "expiresdate", type: "date" },
  completedDate: { column: "completed_date", type: "date" },
} as const;

/** Registry of canonical field mappings by jurisdiction id. */
export const FIELD_MAPPINGS: Record<string, unknown> = {
  "us-tx-austin": AUSTIN_FIELD_MAPPING,
};

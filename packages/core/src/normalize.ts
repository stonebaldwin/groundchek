import { classifyProjectType } from "./classify";
import { MappingError } from "./errors";
import { applyMapping } from "./mapping";
import { normalizeStatus } from "./status";
import type { CanonicalPermit, FieldMapping, RawPermit } from "./types";

/**
 * Turn one raw portal row into a `CanonicalPermit` using the jurisdiction's
 * declarative field mapping, then classify project type and normalize status.
 * Throws `MappingError` if the natural key (permit number) can't be produced.
 */
export function normalizePermit(raw: RawPermit, mapping: FieldMapping): CanonicalPermit {
  const m = applyMapping(raw.data, mapping);
  if (!m.permitNumber) {
    throw new MappingError(
      raw.jurisdictionId,
      `Row is missing the mapped permitNumber column "${mapping.permitNumber.column}"`,
    );
  }

  const isAdu = m.isAdu;
  const projectType = classifyProjectType({
    permitTypeRaw: m.permitTypeRaw,
    description: m.description,
    isAdu,
  });

  return {
    jurisdictionId: raw.jurisdictionId,
    permitNumber: m.permitNumber,
    permitTypeRaw: m.permitTypeRaw,
    projectType,
    status: normalizeStatus(m.statusRaw),
    statusRaw: m.statusRaw,
    description: m.description,
    address: m.address ?? "",
    lat: m.lat,
    lng: m.lng,
    parcelId: m.parcelId,
    valuation: m.valuation,
    contractorName: m.contractorName,
    contractorLicense: m.contractorLicense,
    appliedDate: m.appliedDate,
    issuedDate: m.issuedDate,
    expirationDate: m.expirationDate,
    completedDate: m.completedDate,
    isAdu: isAdu || undefined,
    sourceUrl: raw.sourceUrl,
    retrievedAt: raw.retrievedAt,
    raw: raw.data,
  };
}

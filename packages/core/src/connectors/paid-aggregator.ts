import { NotEnabledError } from "../errors";
import { normalizePermit } from "../normalize";
import type {
  CanonicalPermit,
  FetchOptions,
  JurisdictionConfig,
  PermitSourceConnector,
  RawPermit,
} from "../types";

export interface PaidAggregatorOptions {
  /** e.g. Shovels API key. Absent → the connector stays disabled. */
  apiKey?: string;
  baseUrl?: string;
}

/**
 * OPTIONAL national-coverage fallback (e.g. Shovels). Deliberately a STUB and
 * DISABLED at launch — we self-ingest launch metros via Socrata to keep cost flat
 * and stay independent of a potential competitor. Defining the interface lets
 * national breadth be flipped on later without re-architecting; do NOT wire a
 * paid key or require this for launch.
 */
export function createPaidAggregatorConnector(
  config: JurisdictionConfig,
  options: PaidAggregatorOptions = {},
): PermitSourceConnector {
  return {
    jurisdictionId: config.jurisdictionId,
    platform: "paid_aggregator",
    config,

    async fetchRaw(_options: FetchOptions = {}): Promise<RawPermit[]> {
      if (!options.apiKey) {
        throw new NotEnabledError(
          config.jurisdictionId,
          "Paid aggregator (Shovels) is not enabled. Self-ingest via Socrata at launch; flip this on only for national coverage.",
        );
      }
      // Phase: real implementation maps the aggregator's API → RawPermit[].
      throw new NotEnabledError(config.jurisdictionId, "Paid aggregator connector is a stub.");
    },

    normalize(raw: RawPermit): CanonicalPermit {
      return normalizePermit(raw, config.fieldMapping);
    },
  };
}

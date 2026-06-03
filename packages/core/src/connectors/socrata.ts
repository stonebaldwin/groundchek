import { ParseError } from "../errors";
import { httpJson, type HttpOptions } from "../http";
import { normalizePermit } from "../normalize";
import type {
  CanonicalPermit,
  FetchOptions,
  JurisdictionConfig,
  PermitSourceConnector,
  RawPermit,
} from "../types";

const PAGE_SIZE = 1000;
const MAX_RECORDS = 50_000;

/**
 * Socrata SODA connector (primary). Queries any public Socrata permit dataset
 * via the key-less SODA API + SoQL — parameterized entirely by the jurisdiction
 * config (portal URL + dataset id + field mapping). Paginates with $limit/$offset
 * and filters incrementally on the mapped issued-date column.
 */
export function createSocrataConnector(
  config: JurisdictionConfig,
  http: HttpOptions = {},
): PermitSourceConnector {
  if (!config.datasetId) {
    throw new ParseError(config.jurisdictionId, "Socrata connector requires a datasetId");
  }
  const datasetUrl = `${config.portalBaseUrl.replace(/\/$/, "")}/resource/${config.datasetId}.json`;
  const sourceUrl = `${config.portalBaseUrl.replace(/\/$/, "")}/d/${config.datasetId}`;
  const issuedCol = config.fieldMapping.issuedDate?.column;

  return {
    jurisdictionId: config.jurisdictionId,
    platform: "socrata",
    config,

    async fetchRaw(options: FetchOptions = {}): Promise<RawPermit[]> {
      const retrievedAt = new Date().toISOString();
      const max = options.limit ?? MAX_RECORDS;
      const rows: RawPermit[] = [];

      for (let offset = 0; offset < max; offset += PAGE_SIZE) {
        const params = new URLSearchParams();
        params.set("$limit", String(Math.min(PAGE_SIZE, max - offset)));
        params.set("$offset", String(offset));
        if (issuedCol) params.set("$order", `${issuedCol} DESC`);
        if (options.since && issuedCol) {
          params.set("$where", `${issuedCol} >= '${options.since.toISOString().slice(0, 19)}'`);
        }

        const page = await httpJson<unknown>(
          config.jurisdictionId,
          `${datasetUrl}?${params.toString()}`,
          { ...http, signal: options.signal ?? http.signal },
        );
        if (!Array.isArray(page)) {
          throw new ParseError(config.jurisdictionId, "Socrata response was not a JSON array (SoQL error?)");
        }

        for (const row of page) {
          rows.push({
            jurisdictionId: config.jurisdictionId,
            retrievedAt,
            sourceUrl,
            data: row as Record<string, unknown>,
          });
        }
        if (page.length < PAGE_SIZE) break;
      }

      return rows;
    },

    normalize(raw: RawPermit): CanonicalPermit {
      return normalizePermit(raw, config.fieldMapping);
    },
  };
}

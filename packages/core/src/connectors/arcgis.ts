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

interface ArcgisFeature {
  attributes?: Record<string, unknown>;
  geometry?: { x?: number; y?: number };
}
interface ArcgisResponse {
  features?: ArcgisFeature[];
  exceededTransferLimit?: boolean;
  error?: { message?: string };
}

/**
 * ArcGIS REST connector (secondary). Queries a Feature Service layer's `/query`
 * endpoint. Geometry (x/y) is injected into each row as `__lng` / `__lat`, so a
 * jurisdiction's field mapping can map latitude→"__lat" / longitude→"__lng".
 * `config.datasetId` is the layer id appended to the service base URL.
 */
export function createArcgisConnector(
  config: JurisdictionConfig,
  http: HttpOptions = {},
): PermitSourceConnector {
  const base = config.portalBaseUrl.replace(/\/$/, "");
  const queryUrl = config.datasetId ? `${base}/${config.datasetId}/query` : `${base}/query`;
  const issuedCol = config.fieldMapping.issuedDate?.column;

  return {
    jurisdictionId: config.jurisdictionId,
    platform: "arcgis",
    config,

    async fetchRaw(options: FetchOptions = {}): Promise<RawPermit[]> {
      const retrievedAt = new Date().toISOString();
      const max = options.limit ?? MAX_RECORDS;
      const rows: RawPermit[] = [];

      const where =
        options.since && issuedCol
          ? `${issuedCol} >= DATE '${options.since.toISOString().slice(0, 10)}'`
          : "1=1";

      for (let offset = 0; offset < max; offset += PAGE_SIZE) {
        const params = new URLSearchParams({
          where,
          outFields: "*",
          f: "json",
          returnGeometry: "true",
          outSR: "4326",
          resultOffset: String(offset),
          resultRecordCount: String(Math.min(PAGE_SIZE, max - offset)),
        });
        if (issuedCol) params.set("orderByFields", `${issuedCol} DESC`);

        const res = await httpJson<ArcgisResponse>(
          config.jurisdictionId,
          `${queryUrl}?${params.toString()}`,
          { ...http, signal: options.signal ?? http.signal },
        );
        if (res.error) {
          throw new ParseError(config.jurisdictionId, `ArcGIS error: ${res.error.message ?? "unknown"}`);
        }
        const features = res.features ?? [];
        for (const f of features) {
          rows.push({
            jurisdictionId: config.jurisdictionId,
            retrievedAt,
            sourceUrl: base,
            data: {
              ...(f.attributes ?? {}),
              __lng: f.geometry?.x,
              __lat: f.geometry?.y,
            },
          });
        }
        if (features.length < PAGE_SIZE && !res.exceededTransferLimit) break;
        if (features.length === 0) break;
      }

      return rows;
    },

    normalize(raw: RawPermit): CanonicalPermit {
      return normalizePermit(raw, config.fieldMapping);
    },
  };
}

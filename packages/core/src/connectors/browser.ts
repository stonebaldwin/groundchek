import { NotEnabledError } from "../errors";
import { normalizePermit } from "../normalize";
import type {
  CanonicalPermit,
  FetchOptions,
  JurisdictionConfig,
  PermitSourceConnector,
  RawPermit,
} from "../types";

/**
 * Pulls raw rows for a portal that has no clean API (Accela citizen portals,
 * some CARTO setups). Injected by `apps/ingest` in Phase 6 — backed by a
 * Cloudflare Queue + Browser Rendering worker. Returns plain row objects so the
 * standard field mapping applies. Tests inject fixtures here.
 */
export type BrowserFetcher = (
  config: JurisdictionConfig,
  options: FetchOptions,
) => Promise<Record<string, unknown>[]>;

export function createBrowserConnector(
  config: JurisdictionConfig,
  deps: { fetcher?: BrowserFetcher } = {},
): PermitSourceConnector {
  return {
    jurisdictionId: config.jurisdictionId,
    platform: config.platform === "carto" ? "carto" : "accela_browser",
    config,

    async fetchRaw(options: FetchOptions = {}): Promise<RawPermit[]> {
      if (!deps.fetcher) {
        throw new NotEnabledError(
          config.jurisdictionId,
          "Browser-fallback fetcher not wired (Phase 6 provides it via Browser Rendering).",
        );
      }
      const retrievedAt = new Date().toISOString();
      const rows = await deps.fetcher(config, options);
      return rows.map((data) => ({
        jurisdictionId: config.jurisdictionId,
        retrievedAt,
        sourceUrl: config.portalBaseUrl,
        data,
      }));
    },

    normalize(raw: RawPermit): CanonicalPermit {
      return normalizePermit(raw, config.fieldMapping);
    },
  };
}

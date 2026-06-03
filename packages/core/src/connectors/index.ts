import type { HttpOptions } from "../http";
import type { JurisdictionConfig, PermitSourceConnector } from "../types";
import { createArcgisConnector } from "./arcgis";
import { createBrowserConnector, type BrowserFetcher } from "./browser";
import { createPaidAggregatorConnector, type PaidAggregatorOptions } from "./paid-aggregator";
import { createSocrataConnector } from "./socrata";

export { createSocrataConnector } from "./socrata";
export { createArcgisConnector } from "./arcgis";
export { createBrowserConnector, type BrowserFetcher } from "./browser";
export {
  createPaidAggregatorConnector,
  type PaidAggregatorOptions,
} from "./paid-aggregator";

export interface ConnectorDeps {
  http?: HttpOptions;
  browserFetcher?: BrowserFetcher;
  paidAggregator?: PaidAggregatorOptions;
}

/**
 * Build the right connector for a jurisdiction from its config. Adding a market
 * is a `JurisdictionConfig` (data), not code — this factory dispatches on platform.
 */
export function createConnector(
  config: JurisdictionConfig,
  deps: ConnectorDeps = {},
): PermitSourceConnector {
  switch (config.platform) {
    case "socrata":
      return createSocrataConnector(config, deps.http);
    case "arcgis":
      return createArcgisConnector(config, deps.http);
    case "accela_browser":
    case "carto":
      return createBrowserConnector(config, { fetcher: deps.browserFetcher });
    case "paid_aggregator":
      return createPaidAggregatorConnector(config, deps.paidAggregator);
    default: {
      const _exhaustive: never = config.platform;
      throw new Error(`Unsupported platform: ${String(_exhaustive)}`);
    }
  }
}

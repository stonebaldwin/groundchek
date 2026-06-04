import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// R2-backed incremental cache so ISR/static pages (e.g. the landing page) are
// served from the edge cache instead of re-rendering against the database on
// every request. Backed by the NEXT_INC_CACHE_R2_BUCKET binding (wrangler.jsonc).
export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });

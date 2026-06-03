import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Phase 0 baseline. Phase 7 adds an R2-backed incremental cache for ISR of the
// public property/area/contractor pages:
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
//   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
export default defineCloudflareConfig();

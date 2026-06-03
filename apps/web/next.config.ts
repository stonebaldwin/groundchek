import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@groundbreak/ui", "@groundbreak/core", "@groundbreak/db"],
};

// Enables Cloudflare bindings (env, KV, R2, …) during `next dev`. No-op in prod.
initOpenNextCloudflareForDev();

export default nextConfig;

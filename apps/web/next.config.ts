import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@groundbreak/ui", "@groundbreak/core", "@groundbreak/db"],
  // Baseline security headers (non-breaking — a full CSP is intentionally left
  // out so it can be authored against the real asset/font/map origins later).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// Enables Cloudflare bindings (env, KV, R2, …) during `next dev`. No-op in prod.
initOpenNextCloudflareForDev();

export default nextConfig;

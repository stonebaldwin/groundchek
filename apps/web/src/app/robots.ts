import type { MetadataRoute } from "next";
import { requestBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await requestBaseUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

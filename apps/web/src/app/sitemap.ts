import type { MetadataRoute } from "next";
import { allAreaIds, allPropertyKeys } from "@/lib/data/queries";
import { requestBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = await requestBaseUrl();
  const url = (p: string) => `${base}${p}`;
  const statics: MetadataRoute.Sitemap = [
    "/",
    "/search",
    "/pricing",
    "/methodology",
    "/legal/terms",
    "/legal/privacy",
  ].map((p) => ({ url: url(p), lastModified: now, changeFrequency: "weekly" as const }));

  try {
    // Contractor profiles are intentionally excluded — they're a gated Business
    // feature, so there's no public/indexable value in listing them.
    const [keys, areas] = await Promise.all([allPropertyKeys(), allAreaIds()]);
    return [
      ...statics,
      ...keys.map((k) => ({ url: url(`/property/${k}`), lastModified: now })),
      ...areas.map((k) => ({ url: url(`/area/${k}`), lastModified: now })),
    ];
  } catch {
    // Database unavailable — still serve the static routes rather than 500.
    return statics;
  }
}

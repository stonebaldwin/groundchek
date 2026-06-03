import type { MetadataRoute } from "next";
import { allAreaIds, allContractorIds, allPropertyKeys } from "@/lib/data/queries";
import { appUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics = ["/", "/search", "/pricing", "/methodology", "/legal/terms", "/legal/privacy"].map(
    (p) => ({ url: appUrl(p), lastModified: now, changeFrequency: "weekly" as const }),
  );
  const [keys, areas, contractors] = await Promise.all([
    allPropertyKeys(),
    allAreaIds(),
    allContractorIds(),
  ]);
  return [
    ...statics,
    ...keys.map((k) => ({ url: appUrl(`/property/${k}`), lastModified: now })),
    ...areas.map((k) => ({ url: appUrl(`/area/${k}`), lastModified: now })),
    ...contractors.map((k) => ({ url: appUrl(`/contractor/${k}`), lastModified: now })),
  ];
}

import { headers } from "next/headers";
import { appUrl } from "./env";

/**
 * Absolute origin for the current request (server-only). Derives the host from
 * request headers so sitemap.xml / robots.txt are correct on any deployment URL,
 * even if the build-time NEXT_PUBLIC_APP_URL wasn't set. Falls back to the
 * configured app URL when no request context is available.
 */
export async function requestBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // headers() not available (e.g. static generation) — use the configured URL.
  }
  return appUrl("").replace(/\/$/, "");
}

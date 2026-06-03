import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/env";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Accept only http(s) URLs (blocks javascript:/data: that could land in a report). */
function safeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Branded reports are a paid feature — enforce server-side, not just in the UI.
  if (!viewer.entitlements.brandedReports) {
    return NextResponse.json({ error: "Branded reports require a paid plan" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, string>;
  const fields = {
    name: (body.name ?? "").trim().slice(0, 120) || "My brand",
    logoUrl: safeUrl(body.logoUrl ?? ""),
    primaryColor: (body.primaryColor ?? "").trim().slice(0, 32) || null,
    contactName: (body.contactName ?? "").trim().slice(0, 120) || null,
    contactEmail: (body.contactEmail ?? "").trim().slice(0, 320) || null,
    contactPhone: (body.contactPhone ?? "").trim().slice(0, 40) || null,
  };

  if (isDbConfigured()) {
    try {
      const { getDb, schema, eq } = await import("@groundbreak/db");
      const db = getDb();
      const existing = await db
        .select({ id: schema.brandingProfiles.id })
        .from(schema.brandingProfiles)
        .where(eq(schema.brandingProfiles.userId, viewer.userId))
        .limit(1);
      if (existing[0]) {
        await db
          .update(schema.brandingProfiles)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(schema.brandingProfiles.id, existing[0].id));
      } else {
        await db.insert(schema.brandingProfiles).values({ userId: viewer.userId, ...fields });
      }
    } catch (err) {
      console.error("[branding] save failed", err);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

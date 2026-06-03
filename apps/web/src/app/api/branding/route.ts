import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, string>;
  const fields = {
    name: (body.name ?? "").trim() || "My brand",
    logoUrl: (body.logoUrl ?? "").trim() || null,
    primaryColor: (body.primaryColor ?? "").trim() || null,
    contactName: (body.contactName ?? "").trim() || null,
    contactEmail: (body.contactEmail ?? "").trim() || null,
    contactPhone: (body.contactPhone ?? "").trim() || null,
  };

  if (isDbConfigured()) {
    try {
      const { getDb, schema, eq } = await import("@groundbreak/db");
      const db = getDb();
      const existing = await db
        .select({ id: schema.brandingProfiles.id })
        .from(schema.brandingProfiles)
        .where(eq(schema.brandingProfiles.userId, user.id))
        .limit(1);
      if (existing[0]) {
        await db
          .update(schema.brandingProfiles)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(schema.brandingProfiles.id, existing[0].id));
      } else {
        await db.insert(schema.brandingProfiles).values({ userId: user.id, ...fields });
      }
    } catch (err) {
      console.error("[branding] save failed", err);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

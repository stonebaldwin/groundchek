import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string; market?: string };
  try {
    body = (await request.json()) as { email?: string; market?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().slice(0, 320);
  const market = (body.market ?? "").trim().slice(0, 160);
  if (!email || !market) {
    return NextResponse.json({ error: "email and market are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
  }

  if (isDbConfigured()) {
    try {
      const { getDb, schema } = await import("@groundbreak/db");
      await getDb().insert(schema.coverageRequests).values({ email, market });
    } catch (err) {
      console.error("[coverage] insert failed", err);
    }
  } else {
    console.log(`[coverage] request: ${market} <${email}>`);
  }

  return NextResponse.json({ ok: true });
}

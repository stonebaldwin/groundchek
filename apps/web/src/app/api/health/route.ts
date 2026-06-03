import { NextResponse } from "next/server";
import { getDb, MissingDatabaseUrlError, sql } from "@groundbreak/db";

export const dynamic = "force-dynamic";

/** Defensive row extraction — neon-http result shape varies by driver version. */
function firstRow(result: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(result)) return result[0] as Record<string, unknown> | undefined;
  if (result && typeof result === "object" && "rows" in result) {
    const rows = (result as { rows?: unknown[] }).rows;
    return rows?.[0] as Record<string, unknown> | undefined;
  }
  return undefined;
}

/**
 * Liveness + database/PostGIS connectivity check. Degrades gracefully when
 * DATABASE_URL is absent so the app is reviewable before a DB is wired.
 */
export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const db = getDb();
    await db.execute(sql`select 1 as ok`);

    let postgis: string | null = null;
    try {
      const res = await db.execute(sql`select postgis_version() as v`);
      const v = firstRow(res)?.v;
      postgis = typeof v === "string" ? v : null;
    } catch {
      postgis = null; // PostGIS not yet enabled — run `pnpm db:migrate`.
    }

    return NextResponse.json({ status: "ok", database: "connected", postgis, checkedAt });
  } catch (err) {
    if (err instanceof MissingDatabaseUrlError) {
      return NextResponse.json({
        status: "degraded",
        database: "not_configured",
        hint: "Set DATABASE_URL (see .env.example) to enable database features.",
        checkedAt,
      });
    }
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        error: err instanceof Error ? err.message : String(err),
        checkedAt,
      },
      { status: 503 },
    );
  }
}

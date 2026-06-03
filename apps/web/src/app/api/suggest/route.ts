import { NextResponse } from "next/server";
import { propertySuggestions } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const items = await propertySuggestions(q);
    return NextResponse.json({ items });
  } catch (err) {
    // Degrade to "no suggestions" rather than 500-ing the live-search UI.
    console.error("[suggest] failed:", err);
    return NextResponse.json({ items: [] });
  }
}

import { NextResponse } from "next/server";
import { propertySuggestions } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const items = await propertySuggestions(q);
  return NextResponse.json({ items });
}

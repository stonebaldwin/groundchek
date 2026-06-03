import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Built per request so the Worker env (secret, DATABASE_URL) is in scope.
export async function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).POST(request);
}

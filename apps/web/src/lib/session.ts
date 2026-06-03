import { headers } from "next/headers";
import { isDbConfigured } from "./env";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * The signed-in user, or null. Reads the Better Auth session server-side. Auth
 * is dynamically imported and guarded by `isDbConfigured()` so public/static
 * pages never pull in auth or the DB, and the build stays safe.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isDbConfigured()) return null;
  try {
    const { getAuth } = await import("./auth");
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? session.user.email,
    };
  } catch {
    return null;
  }
}

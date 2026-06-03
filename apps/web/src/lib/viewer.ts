import { resolvePlanForUser } from "./billing";
import { entitlementsFor, type Entitlements, type Plan } from "./entitlements";
import { getSessionUser } from "./session";

export interface Viewer {
  userId?: string;
  email?: string;
  name?: string;
  plan: Plan;
  entitlements: Entitlements;
}

/**
 * The current viewer's identity + entitlements: the Better Auth session resolved
 * to a plan from the active Stripe subscription. Anonymous (and any unconfigured
 * environment) resolves to the free tier, which is what the public, cacheable
 * pages assume.
 */
export async function getViewer(): Promise<Viewer> {
  const user = await getSessionUser();
  if (!user) return { plan: "free", entitlements: entitlementsFor("free") };
  const plan = await resolvePlanForUser(user.id);
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan,
    entitlements: entitlementsFor(plan),
  };
}

/** Require a signed-in viewer; returns null if anonymous (callers redirect). */
export async function requireViewer(): Promise<Viewer | null> {
  const viewer = await getViewer();
  return viewer.userId ? viewer : null;
}

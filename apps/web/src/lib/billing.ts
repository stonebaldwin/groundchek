import { desc, eq, getDb, schema } from "@groundbreak/db";
import type { Plan } from "./entitlements";
import { env, isDbConfigured } from "./env";
import { getStripe } from "./stripe";

export type BillingCycle = "monthly" | "annual";

/** Map a Stripe price id → plan, from env config. */
export function planForPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return "free";
  if (priceId === env("STRIPE_PRICE_PRO_MONTHLY") || priceId === env("STRIPE_PRICE_PRO_ANNUAL")) {
    return "pro";
  }
  if (
    priceId === env("STRIPE_PRICE_BUSINESS_MONTHLY") ||
    priceId === env("STRIPE_PRICE_BUSINESS_ANNUAL")
  ) {
    return "business";
  }
  return "free";
}

export function priceIdForPlan(plan: Plan, cycle: BillingCycle): string | undefined {
  if (plan === "pro") {
    return cycle === "annual" ? env("STRIPE_PRICE_PRO_ANNUAL") : env("STRIPE_PRICE_PRO_MONTHLY");
  }
  if (plan === "business") {
    return cycle === "annual"
      ? env("STRIPE_PRICE_BUSINESS_ANNUAL")
      : env("STRIPE_PRICE_BUSINESS_MONTHLY");
  }
  return undefined;
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export async function getSubscriptionRow(userId: string) {
  if (!isDbConfigured()) return null;
  try {
    const rows = await getDb()
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .orderBy(desc(schema.subscriptions.updatedAt))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Resolve a user's effective plan from their active subscription (default free). */
export async function resolvePlanForUser(userId: string): Promise<Plan> {
  const sub = await getSubscriptionRow(userId);
  if (!sub) return "free";
  if (!ACTIVE_STATUSES.has(sub.status)) return "free";
  return sub.plan;
}

/** Find-or-create the Stripe customer for a user and persist its id. */
export async function ensureStripeCustomer(userId: string, email: string): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe || !isDbConfigured()) return null;
  const existing = await getSubscriptionRow(userId);
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({ email, metadata: { userId } });
  const db = getDb();
  if (existing) {
    await db
      .update(schema.subscriptions)
      .set({ stripeCustomerId: customer.id })
      .where(eq(schema.subscriptions.id, existing.id));
  } else {
    await db.insert(schema.subscriptions).values({
      userId,
      stripeCustomerId: customer.id,
      plan: "free",
      status: "active",
    });
  }
  return customer.id;
}

/** Upsert a subscription row from a Stripe subscription object (webhook). */
export async function syncSubscriptionFromStripe(input: {
  userId?: string;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  status: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  const plan = planForPriceId(input.priceId);
  const values = {
    stripeSubscriptionId: input.subscriptionId,
    stripePriceId: input.priceId,
    plan,
    status: input.status as (typeof schema.subscriptions.$inferInsert)["status"],
    currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd * 1000) : null,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    updatedAt: new Date(),
  };

  const existing = await db
    .select({ id: schema.subscriptions.id })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.stripeCustomerId, input.customerId))
    .limit(1);

  if (existing[0]) {
    await db.update(schema.subscriptions).set(values).where(eq(schema.subscriptions.id, existing[0].id));
  } else {
    await db.insert(schema.subscriptions).values({
      userId: input.userId,
      stripeCustomerId: input.customerId,
      ...values,
    });
  }
}

import { NextResponse } from "next/server";
import { ensureStripeCustomer, priceIdForPlan, type BillingCycle } from "@/lib/billing";
import { appUrl } from "@/lib/env";
import { getSessionUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import type { Plan } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { plan?: Plan; cycle?: BillingCycle };
  const priceId = priceIdForPlan(body.plan ?? "pro", body.cycle ?? "monthly");
  if (!priceId) return NextResponse.json({ error: "Unknown plan or missing price id" }, { status: 400 });

  const customerId = await ensureStripeCustomer(user.id, user.email);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl("/dashboard/billing?status=success"),
    cancel_url: appUrl("/pricing?status=cancel"),
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}

import { NextResponse } from "next/server";
import { syncSubscriptionFromStripe } from "@/lib/billing";
import { env } from "@/lib/env";
import { getStripe, Stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Verifies the raw body signature using the Workers-compatible
 * async crypto provider (Node's sync crypto isn't available on workerd), then
 * upserts the subscription. Upserts are idempotent, so duplicate deliveries are
 * safe.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.customer) {
          const sub = await stripe.subscriptions.retrieve(String(session.subscription));
          await persist(sub, session.metadata?.userId ?? undefined);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await persist(sub, sub.metadata?.userId ?? undefined);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe:webhook] handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function persist(sub: Stripe.Subscription, userId?: string): Promise<void> {
  const item = sub.items.data[0];
  // `current_period_end` lives on the subscription item in newer API versions and
  // on the subscription in older ones — read whichever is present.
  const periodEnd =
    (item as { current_period_end?: number } | undefined)?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null;
  await syncSubscriptionFromStripe({
    userId,
    customerId: String(sub.customer),
    subscriptionId: sub.id,
    priceId: item?.price.id ?? null,
    status: sub.status,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

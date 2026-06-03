import { NextResponse } from "next/server";
import { getSubscriptionRow } from "@/lib/billing";
import { appUrl } from "@/lib/env";
import { getSessionUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscriptionRow(user.id);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: appUrl("/dashboard/billing"),
  });
  return NextResponse.json({ url: session.url });
}

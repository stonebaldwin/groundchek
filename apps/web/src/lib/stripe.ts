import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | undefined;

/**
 * Lazily build a Stripe client configured for the Workers runtime (Fetch HTTP
 * client instead of Node's http). Returns null when Stripe isn't configured so
 * callers can degrade gracefully.
 */
export function getStripe(): Stripe | null {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return null;
  client ??= new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

export { Stripe };

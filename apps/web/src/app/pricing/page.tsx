import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@groundbreak/ui";
import { PLAN_CATALOG } from "@/lib/entitlements";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free permit lookups, Pro for full history + alerts, Business for contractor intelligence, exports & API.",
};

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <header className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            Self-serve plans
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Start free. Upgrade when a property matters.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            Public permit data, a clean local product. No ads — you pay for depth, alerts, and
            intelligence, not the data.
          </p>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLAN_CATALOG.map((plan) => {
            const featured = plan.plan === "pro";
            return (
              <div
                key={plan.plan}
                className={`flex flex-col rounded-2xl border bg-surface p-6 ${
                  featured ? "border-primary shadow-card ring-1 ring-primary/20" : "border-border shadow-soft"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                  {featured ? <Badge variant="primary">Most popular</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{plan.audience}</p>
                <p className="mt-4">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums text-ink">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-ink-muted">/mo</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">{plan.blurb}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.plan === "free" ? "/signup" : `/signup?plan=${plan.plan}`}
                  className={`mt-6 inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors ${
                    featured
                      ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                      : "border border-border-strong text-ink hover:bg-surface-sunken"
                  }`}
                >
                  {plan.plan === "free" ? "Get started" : `Choose ${plan.name}`}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Prices in USD. Cancel anytime from the billing portal. Annual billing available at checkout.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

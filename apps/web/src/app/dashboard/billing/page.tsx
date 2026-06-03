import { Badge, StatCard, formatDateShort } from "@groundbreak/ui";
import { getSubscriptionRow } from "@/lib/billing";
import { PLAN_CATALOG } from "@/lib/entitlements";
import { getViewer } from "@/lib/viewer";
import { ManageBillingButton, UpgradeButton } from "../_components/billing-actions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const viewer = await getViewer();
  const sub = viewer.userId ? await getSubscriptionRow(viewer.userId) : null;
  const info = PLAN_CATALOG.find((p) => p.plan === viewer.plan) ?? PLAN_CATALOG[0]!;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Billing</h1>
        <p className="text-sm text-ink-muted">Your plan, usage, and payment details.</p>
      </header>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{info.name}</h2>
              <Badge variant={viewer.plan === "free" ? "neutral" : "primary"}>
                {sub?.status ?? "active"}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-ink-muted">
              ${info.priceMonthly}/mo · {info.blurb}
            </p>
            {sub?.currentPeriodEnd ? (
              <p className="mt-1 text-xs text-ink-muted">
                {sub.cancelAtPeriodEnd ? "Ends" : "Renews"} {formatDateShort(sub.currentPeriodEnd)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {viewer.plan === "free" ? (
              <>
                <UpgradeButton plan="pro" label="Upgrade to Pro" />
                <UpgradeButton plan="business" label="Business" variant="outline" />
              </>
            ) : (
              <ManageBillingButton />
            )}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Usage</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Lookups this month"
            value={0}
            sublabel={
              viewer.entitlements.monthlyLookups === Number.MAX_SAFE_INTEGER
                ? "Unlimited"
                : `of ${viewer.entitlements.monthlyLookups}`
            }
          />
          <StatCard
            label="Alerts"
            value={viewer.entitlements.alerts === 0 ? "—" : viewer.entitlements.alerts}
            sublabel="included"
          />
          <StatCard label="Seats" value={viewer.entitlements.seats} />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActivityBadge,
  AreaActivityCard,
  ContractorActivityList,
  FreshnessIndicator,
  PermitTimeline,
  SourceAttribution,
} from "@groundbreak/ui";
import { allAreaIds, getArea } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";
import { PaywallNotice } from "../../_components/paywall";
import { DetailBand, StampLabel } from "../../_components/detail-band";

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await allAreaIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const area = await getArea(id);
  if (!area) return { title: "Area not found" };
  return {
    title: `Building permits in ${area.label}`,
    description: `Construction activity in ${area.label}: ${area.summary.totalPermits} permits over 12 months, project-type mix, trends, and top contractors — from official public records.`,
  };
}

export default async function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const area = await getArea(id);
  if (!area) notFound();

  const { entitlements: ent } = await getViewer();

  return (
    <>
      <SiteHeader />
      <DetailBand>
        <nav className="mb-4 text-sm text-ink-muted">
          <Link href="/search" className="hover:text-ink">
            Explore
          </Link>{" "}
          <span aria-hidden="true">/</span> {area.jurisdictionName}
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <StampLabel>Neighborhood construction activity</StampLabel>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{area.label}</h1>
            <div className="flex items-center gap-2 pt-1">
              <ActivityBadge level={area.activityLevel} />
              {area.freshness.currentAs ? (
                <FreshnessIndicator
                  currentAs={area.freshness.currentAs}
                  stale={area.freshness.stale}
                  note={area.freshness.sourceName}
                />
              ) : null}
            </div>
          </div>
        </header>
      </DetailBand>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <section className="mt-2">
          <AreaActivityCard data={area.summary} />
          <div className="mt-2">
            <SourceAttribution
              sourceName={area.freshness.sourceName}
              retrievedAt="2026-06-02T08:00:00Z"
              dataCurrentAs={area.freshness.currentAs}
            />
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Recent permits in this area</h2>
          {area.recentPermits.length > 0 ? (
            <PermitTimeline entries={area.recentPermits} />
          ) : (
            <p className="text-sm text-ink-muted">No recent permits on record.</p>
          )}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Top contractors here</h2>
          {ent.contractorIntel ? (
            <ContractorActivityList contractors={area.topContractors} />
          ) : (
            <PaywallNotice
              title="Contractor activity is a Business feature"
              description="See which contractors are pulling permits in this area, what they build, and at what volume — useful to suppliers, brokerages, and competitors."
              cta="See Business plan"
            />
          )}
        </section>

        <section className="mt-8">
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">Monitor {area.label}</p>
              <p className="text-sm text-ink-muted">
                Get alerted when permit activity here spikes or a new project breaks ground.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Monitor with Pro
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

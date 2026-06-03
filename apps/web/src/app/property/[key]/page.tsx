import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, MapPin } from "lucide-react";
import {
  AreaActivityCard,
  Badge,
  FreshnessIndicator,
  PermitMap,
  PermitTimeline,
  SourceAttribution,
  StatCard,
  formatCurrency,
  projectTypeMeta,
} from "@groundbreak/ui";
import { allPropertyKeys, getProperty } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";
import { PaywallNotice } from "../../_components/paywall";

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await allPropertyKeys()).map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const data = await getProperty(key);
  if (!data) return { title: "Property not found" };
  const p = data.property;
  return {
    title: `${p.address} — permit history`,
    description: `${p.permitCount} building permit${p.permitCount === 1 ? "" : "s"} on record at ${p.address}, ${p.jurisdictionName} — values, status, and contractors from official public records.`,
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const data = await getProperty(key);
  if (!data) notFound();

  const { entitlements: ent } = await getViewer();
  const { property: p } = data;
  const visible = ent.fullPermitHistory ? data.permits : data.permits.slice(0, ent.freeHistoryLimit);
  const hidden = data.permits.length - visible.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <nav className="mb-4 text-sm text-ink-muted">
          <Link href="/search" className="hover:text-ink">
            Explore
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <Link href={`/area/${p.zip}`} className="hover:text-ink">
            {p.zip}
          </Link>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Property permit history
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{p.address}</h1>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin className="size-4" />
              {p.jurisdictionName}, {p.state}
              {p.county ? ` · ${p.county} County` : ""}
            </p>
          </div>
          {data.freshness.currentAs ? (
            <FreshnessIndicator
              currentAs={data.freshness.currentAs}
              stale={data.freshness.stale}
              note={data.freshness.sourceName}
            />
          ) : null}
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard label="Permits on record" value={p.permitCount} sublabel={`In ${p.jurisdictionName}`} />
          <StatCard
            label="Total declared value"
            value={formatCurrency(data.totalValuation, { compact: true })}
            sublabel="Across all permits"
            tone="text-primary"
          />
          <StatCard
            label="Most recent"
            value={p.latestProjectType ? projectTypeMeta(p.latestProjectType).label : "—"}
            sublabel={p.lastPermitDate ?? undefined}
          />
        </div>

        {p.lat && p.lng ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <PermitMap
              center={{ lat: p.lat, lng: p.lng }}
              marker={{ lat: p.lat, lng: p.lng, label: p.address }}
              permits={ent.nearbyDepth ? data.nearby : []}
              height={320}
            />
          </div>
        ) : null}

        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Permit history</h2>
            <Badge variant="neutral">{data.permits.length} total</Badge>
          </div>
          <PermitTimeline entries={visible} />
          {hidden > 0 ? (
            <PaywallNotice
              title={`${hidden} more permit${hidden === 1 ? "" : "s"} in the full history`}
              description="Pro unlocks a property's complete permit history, nearby activity, and the ability to watch it for new permits."
            />
          ) : null}
          <SourceAttribution
            sourceName={data.freshness.sourceName}
            sourceUrl={data.freshness.sourceUrl}
            retrievedAt="2026-06-02T08:00:00Z"
            dataCurrentAs={data.freshness.currentAs}
          />
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Neighborhood activity</h2>
          {ent.areaDepth && data.area ? (
            <AreaActivityCard data={data.area} />
          ) : data.area ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Area" value={p.zip ?? "—"} sublabel={data.area.label} />
                <StatCard label="Trailing 12mo permits" value={data.area.totalPermits} />
                <StatCard
                  label="Activity"
                  value={data.area.activityLevel}
                  tone={`text-activity-${data.area.activityLevel}`}
                />
              </div>
              <PaywallNotice
                title="See the full neighborhood trend"
                description="Pro shows the 12-month volume + value trend, project-type mix, and top contractors for this area."
              />
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No area activity computed for this property yet.</p>
          )}
          <Link href={`/area/${p.zip}`} className="inline-block text-sm font-medium text-primary hover:underline">
            View {p.zip} area report →
          </Link>
        </section>

        <section className="mt-8">
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-surface text-primary">
                <Bell className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">Watch this property</p>
                <p className="text-sm text-ink-muted">
                  Get an email the moment a new permit is filed here or next door.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Enable alerts with Pro
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

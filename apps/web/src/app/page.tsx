import Link from "next/link";
import { ArrowRight, Building2, HardHat, LineChart } from "lucide-react";
import { type ActivityLevel, formatCurrency } from "@groundbreak/ui";
import { getPlatformStats, listAreas } from "@/lib/data/queries";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { PropertySearch } from "./_components/property-search";

// ISR: prerender then revalidate hourly, served from the R2-backed edge cache
// instead of re-querying the database on every request. Safe to cache because the
// landing reads no per-user data (no cookies) — the detail pages stay dynamic
// since they read the session for entitlement gating.
export const revalidate = 3600;

const FEATURES = [
  {
    icon: Building2,
    title: "Permit history",
    body: "Every permit at a property — what was built, renovated, or added, the value, status, and contractor — each linked to the source record.",
  },
  {
    icon: LineChart,
    title: "Neighborhood activity",
    body: "Construction volume, value trends, project-type mix, and hotspots for any ZIP, neighborhood, or jurisdiction.",
  },
  {
    icon: HardHat,
    title: "Contractor activity",
    body: "Who's pulling permits where, what they build, and at what volume — public business records, not endorsements.",
  },
];

const USE_CASES: Array<[string, string]> = [
  ["Agents", "Prep listings and brief buyers with a clean permit story for the property."],
  ["Investors", "Spot where activity and value are moving before the comps catch up."],
  ["Contractors & suppliers", "Find leads and track competitors by where permits are pulled."],
  ["Homeowners", "Research what's been done to a house — and what's happening next door."],
];

const ACTIVITY_DOT: Record<ActivityLevel, string> = {
  quiet: "bg-activity-quiet",
  light: "bg-activity-light",
  moderate: "bg-activity-moderate",
  active: "bg-activity-active",
  hot: "bg-activity-hot",
};

function stampDate(iso?: string): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs font-medium text-accent">{index}</span>
      <span className="h-px w-6 bg-border-strong" />
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h2>
    </div>
  );
}

export default async function HomePage() {
  const [areas, stats] = await Promise.all([listAreas(), getPlatformStats()]);

  const statItems = [
    { value: stats.permits.toLocaleString("en-US"), label: "permits on record" },
    { value: formatCurrency(stats.totalValuation, { compact: true }), label: "declared value" },
    { value: stats.zips.toLocaleString("en-US"), label: "neighborhoods" },
    { value: stats.contractors.toLocaleString("en-US"), label: "contractors tracked" },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        {/* ── Hero: the drafting band ─────────────────────────────────────── */}
        <section className="draft-grid relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-draft/0 via-draft/0 to-draft-deep/80" />
          <div className="relative mx-auto max-w-5xl px-6 pb-14 pt-16 sm:pt-20">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-on-draft-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              Public records · Austin, TX{stats.dataCurrentAs ? ` · current ${stampDate(stats.dataCurrentAs)}` : ""}
            </div>
            <h1 className="max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-on-draft sm:text-5xl md:text-[3.4rem]">
              See what&apos;s been built — and what&apos;s coming — at any address.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-on-draft-muted">
              Permit history, neighborhood construction activity, project values, and contractors —
              drawn straight from official public records, deep in your market.
            </p>
            <div className="mt-8 max-w-xl rounded-xl border border-white/10 bg-surface p-2 shadow-pop">
              <PropertySearch />
            </div>
            <p className="mt-3 font-mono text-[0.7rem] text-on-draft-muted/90">
              Try an Austin address — e.g. <span className="text-on-draft">504 Walsh St</span> — or
              browse a neighborhood below.
            </p>
          </div>

          {/* Live stat strip — real numbers from the database */}
          <div className="relative border-t border-white/10 bg-draft-deep/60">
            <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-white/10 px-6 sm:grid-cols-4">
              {statItems.map((s) => (
                <div key={s.label} className="px-3 py-5 first:pl-0 sm:px-6">
                  <p className="font-display text-2xl font-bold tabular-nums text-on-draft sm:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-on-draft-muted">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What you get ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-16">
          <SectionLabel index="01" title="What you get" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="tick-frame rounded-xl border border-border bg-surface p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Covered neighborhoods (live ZIP areas) ──────────────────────── */}
        <section className="blueprint-grid border-y border-border bg-surface-sunken/40">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionLabel index="02" title="Neighborhoods, live in Austin" />
              <Link
                href="/search"
                className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Explore all
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((a) => (
                <Link
                  key={a.id}
                  href={`/area/${a.id}`}
                  className="group rounded-xl border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-semibold tracking-tight text-ink">
                      {a.id}
                    </span>
                    <span
                      className={`size-2.5 rounded-full ${ACTIVITY_DOT[a.activityLevel]}`}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">
                    {a.label.split(" · ")[1] ?? a.jurisdictionName}
                  </p>
                  <p className="mt-2 font-mono text-xs text-ink-muted">
                    {a.summary.totalPermits.toLocaleString("en-US")} permits · {a.activityLevel}
                  </p>
                </Link>
              ))}
            </div>
            <p className="mt-5 font-mono text-xs text-ink-muted">
              {stats.markets} live market · {stats.zips} neighborhoods — we go deep market by market,
              not wide and shallow.
            </p>
          </div>
        </section>

        {/* ── Use cases ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <SectionLabel index="03" title="Built for your next move" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map(([who, what]) => (
              <div key={who} className="rounded-xl border border-border bg-surface p-5">
                <p className="font-display text-sm font-semibold text-ink">{who}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{what}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="tick-frame draft-grid overflow-hidden rounded-2xl border border-ink/15 p-8 sm:p-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-on-draft">
                  Don&apos;t see your market?
                </h2>
                <p className="mt-1 text-on-draft-muted">
                  Tell us where to go deep next — we prioritize by demand.
                </p>
              </div>
              <Link
                href="/search"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-accent px-5 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Request a market
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

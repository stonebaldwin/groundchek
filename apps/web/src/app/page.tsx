import Link from "next/link";
import { Building2, HardHat, LineChart, MapPinned } from "lucide-react";
import { Badge, Card, CardContent } from "@groundbreak/ui";
import { listAreas, listJurisdictions } from "@/lib/data/queries";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { PropertySearch } from "./_components/property-search";

const FEATURES = [
  {
    icon: Building2,
    title: "Permit history",
    body: "Every permit at a property — what was built, renovated, or added, the value, status, and contractor.",
  },
  {
    icon: LineChart,
    title: "Neighborhood activity",
    body: "Construction trends, project-type mix, and hotspots for any ZIP, neighborhood, or jurisdiction.",
  },
  {
    icon: HardHat,
    title: "Contractor activity",
    body: "Who's pulling permits where, what they build, and at what volume — public business records.",
  },
];

const USE_CASES = [
  ["Agents", "Prep listings and brief buyers with a clean permit story for the property."],
  ["Investors", "Spot where activity and value are moving before the comps catch up."],
  ["Contractors & suppliers", "Find leads and track competitors by where permits are pulled."],
  ["Homeowners", "Research what's been done to a house — and what's happening next door."],
];

export default async function HomePage() {
  const [areas, jurisdictions] = await Promise.all([listAreas(), listJurisdictions()]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-6 pb-10 pt-16 text-center">
          <Badge variant="primary" className="mb-5">
            Local building-permit intelligence
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            See what&apos;s been built — and what&apos;s coming — at any property.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-ink-soft">
            Permit history, neighborhood construction activity, project values, and contractors —
            drawn straight from official local public records, deep in your market.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <PropertySearch />
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Public records, attributed to each source with a &ldquo;data current as of&rdquo; date.
            Informational only — not permitting or legal advice.
          </p>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-16 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="space-y-2 pt-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="text-sm text-ink-muted">{body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold text-ink">Covered markets</h2>
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              Explore all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => (
              <Link
                key={a.id}
                href={`/area/${a.id}`}
                className="rounded-xl border border-border bg-surface p-5 shadow-soft transition-colors hover:border-border-strong"
              >
                <p className="font-medium text-ink">{a.label}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {a.summary.totalPermits.toLocaleString("en-US")} permits · {a.activityLevel}
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            {jurisdictions.length} markets and growing. We go deep market by market rather than wide
            and shallow.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map(([who, what]) => (
              <div key={who} className="rounded-xl border border-border bg-surface p-5 shadow-soft">
                <p className="text-sm font-semibold text-ink">{who}</p>
                <p className="mt-1 text-sm text-ink-muted">{what}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-surface text-primary">
                <MapPinned className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">Don&apos;t see your market?</p>
                <p className="text-sm text-ink-muted">
                  Tell us where to go next and we&apos;ll prioritize it.
                </p>
              </div>
            </div>
            <Link
              href="/search"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Request a market
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

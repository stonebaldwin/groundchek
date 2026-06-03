import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HardHat } from "lucide-react";
import {
  Badge,
  PermitTimeline,
  ProjectTypeBadge,
  StatCard,
  formatCurrency,
} from "@groundbreak/ui";
import { allContractorIds, getContractor } from "@/lib/data/queries";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await allContractorIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await getContractor(id);
  if (!c) return { title: "Contractor not found" };
  return {
    title: `${c.name} — permit activity`,
    description: `${c.name} has pulled ${c.permitCount} permits across ${c.jurisdictions.join(", ")} — project types, values, and recent permits from public records.`,
  };
}

export default async function ContractorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getContractor(id);
  if (!c) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <nav className="mb-4 text-sm text-ink-muted">
          <Link href="/search" className="hover:text-ink">
            Explore
          </Link>{" "}
          <span aria-hidden="true">/</span> Contractors
        </nav>

        <header className="flex items-start gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <HardHat className="size-6" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{c.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              {c.license ? <span className="font-mono">{c.license}</span> : null}
              <span>Active in {c.jurisdictions.join(", ")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {c.topProjectTypes.map((t) => (
                <ProjectTypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Permits pulled" value={c.permitCount} />
          <StatCard
            label="Total declared value"
            value={formatCurrency(c.totalValuation, { compact: true })}
            tone="text-primary"
          />
          <StatCard label="Markets" value={c.jurisdictions.length} sublabel={c.jurisdictions.join(", ")} />
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          <Badge variant="outline" className="mr-1.5">
            Public business activity
          </Badge>
          This is permit-activity data drawn from public records — not an endorsement, rating, or
          recommendation.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Recent permits</h2>
          <PermitTimeline entries={c.recentPermits} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

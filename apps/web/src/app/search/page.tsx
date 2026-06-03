import type { Metadata } from "next";
import Link from "next/link";
import { Download, SearchX } from "lucide-react";
import {
  Badge,
  EmptyState,
  ProjectTypeBadge,
  formatCurrency,
  formatDateShort,
  permitStatusMeta,
  type PermitStatus,
  type ProjectType,
} from "@groundbreak/ui";
import { listJurisdictions, searchPermits } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { DetailBand, StampLabel } from "../_components/detail-band";
import { SearchFiltersForm } from "./_components/filters";
import { CoverageRequestForm } from "./_components/coverage-form";

export const metadata: Metadata = {
  title: "Explore building permits",
  description: "Search building permits across covered markets by type, value, status, and area.",
};

type SP = Record<string, string | string[] | undefined>;
function str(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);
  const filters = {
    q: str(sp.q) || undefined,
    jurisdiction: str(sp.jurisdiction) || undefined,
    projectType: (str(sp.projectType) || undefined) as ProjectType | undefined,
    status: (str(sp.status) || undefined) as PermitStatus | undefined,
    minValue: str(sp.minValue) ? Number(str(sp.minValue)) : undefined,
    page,
  };

  const [results, jurisdictions, viewer] = await Promise.all([
    searchPermits(filters),
    listJurisdictions(),
    getViewer(),
  ]);
  const totalPages = Math.max(1, Math.ceil(results.total / results.pageSize));

  const queryFor = (p: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.jurisdiction) params.set("jurisdiction", filters.jurisdiction);
    if (filters.projectType) params.set("projectType", filters.projectType);
    if (filters.status) params.set("status", filters.status);
    if (filters.minValue) params.set("minValue", String(filters.minValue));
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <>
      <SiteHeader />
      <DetailBand width="max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <StampLabel>Permit explorer</StampLabel>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Explore permits</h1>
            <p className="text-sm text-ink-muted">
              {results.total} permit{results.total === 1 ? "" : "s"} across covered markets.
            </p>
          </div>
          {viewer.entitlements.exports ? (
            <span
              title="CSV export is coming soon"
              aria-disabled="true"
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-medium text-ink-muted"
            >
              <Download className="size-4" /> Export CSV
              <span className="ml-0.5 rounded bg-surface-sunken px-1 py-0.5 text-[0.6rem] uppercase tracking-wide">
                soon
              </span>
            </span>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-ink-muted hover:bg-surface-sunken"
            >
              <Download className="size-4" /> Export (Business)
            </Link>
          )}
        </header>
      </DetailBand>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <SearchFiltersForm
              jurisdictions={jurisdictions}
              initial={{
                q: filters.q ?? "",
                jurisdiction: filters.jurisdiction ?? "",
                projectType: filters.projectType ?? "",
                status: filters.status ?? "",
                minValue: filters.minValue ? String(filters.minValue) : "",
              }}
            />
          </aside>

          <section>
            {results.items.length === 0 ? (
              <div className="space-y-6">
                <EmptyState
                  icon={<SearchX className="size-5" />}
                  title="No permits match"
                  description="This may be a covered market with no matching permits, or an area we don't cover yet. Tell us where to go deep next."
                />
                <div className="rounded-xl border border-border bg-surface p-6">
                  <p className="mb-3 text-center text-sm font-medium text-ink">Request a market</p>
                  <CoverageRequestForm defaultMarket={filters.q ?? ""} />
                </div>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                  {results.items.map((item) => {
                    const status = permitStatusMeta(item.status);
                    return (
                      <li key={`${item.propertyKey}-${item.permitNumber}`}>
                        <Link
                          href={`/property/${item.propertyKey}`}
                          className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-surface-sunken/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-ink">{item.address}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                              <ProjectTypeBadge type={item.projectType} size="sm" />
                              <Badge variant={status.variant}>{status.label}</Badge>
                              <span className="font-mono">{item.permitNumber}</span>
                              <span>{item.jurisdictionName}</span>
                              {item.issuedDate ? <span>{formatDateShort(item.issuedDate)}</span> : null}
                            </div>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-ink">
                            {formatCurrency(item.valuation, { compact: true })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {totalPages > 1 ? (
                  <div className="mt-5 flex items-center justify-between text-sm">
                    {page > 1 ? (
                      <Link href={queryFor(page - 1)} className="text-primary hover:underline">
                        ← Previous
                      </Link>
                    ) : (
                      <span className="text-ink-muted">← Previous</span>
                    )}
                    <span className="text-ink-muted">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages ? (
                      <Link href={queryFor(page + 1)} className="text-primary hover:underline">
                        Next →
                      </Link>
                    ) : (
                      <span className="text-ink-muted">Next →</span>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Shared, load-bearing disclaimer — see Phase 7 compliance surfaces. */
export const REPORT_DISCLAIMER =
  "This report is informational only. Permit records are public data drawn from " +
  "each jurisdiction's official portal as retrieved, and may be incomplete, " +
  "delayed, or out of date — see the freshness note on each section. Project-type " +
  "classifications and activity metrics are computed analysis, not official " +
  "designations. This is not legal, permitting, or professional advice. For any " +
  "permitting or transactional decision, verify directly with the jurisdiction.";

export interface ReportLayoutProps {
  address: string;
  generatedAtLabel?: string;
  /** Overall badge (e.g. an area activity level), rendered in the header. */
  badge?: ReactNode;
  /** Freshness pill — "data current as of [date]". */
  freshness?: ReactNode;
  /** Optional white-label brand header (Phase 4). */
  brand?: ReactNode;
  map?: ReactNode;
  summary?: ReactNode;
  /** Report sections (permit history, area activity, contractors — and, when the
   *  cluster is merged, a property-risk section from Terrain on the same parcel). */
  children: ReactNode;
  className?: string;
}

/** The full report scaffold. Doubles as the print/PDF view (note `print:` rules). */
export function ReportLayout({
  address,
  generatedAtLabel,
  badge,
  freshness,
  brand,
  map,
  summary,
  children,
  className,
}: ReportLayoutProps) {
  return (
    <article
      className={cn(
        "mx-auto w-full max-w-3xl space-y-6 print:max-w-none print:space-y-4",
        className,
      )}
    >
      {brand ? <div>{brand}</div> : null}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Property permit report
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{address}</h1>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {generatedAtLabel ? (
              <p className="text-sm text-ink-muted">Generated {generatedAtLabel}</p>
            ) : null}
            {freshness}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </header>
      {map ? (
        <div className="overflow-hidden rounded-xl border border-border print:hidden">{map}</div>
      ) : null}
      {summary}
      <div className="space-y-8">{children}</div>
      <footer className="border-t border-border pt-5">
        <p className="text-xs leading-relaxed text-ink-muted">{REPORT_DISCLAIMER}</p>
      </footer>
    </article>
  );
}

export interface ReportSectionProps {
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  attribution?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** One section inside a report (Permit history, Neighborhood activity, …). */
export function ReportSection({
  title,
  badge,
  description,
  attribution,
  children,
  className,
}: ReportSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
        </div>
        {badge}
      </div>
      <div className="space-y-3">{children}</div>
      {attribution}
    </section>
  );
}

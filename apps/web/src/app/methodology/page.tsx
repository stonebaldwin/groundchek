import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Groundbreak sources permit data, classifies project types, computes activity metrics, and shows freshness honestly.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Methodology</h1>
          <p className="text-ink-soft">
            Groundbreak is built on public records. Here&apos;s exactly where the data comes from and
            how we derive everything you see — including what is official and what is our computed
            analysis.
          </p>
        </header>

        <Section title="Where the data comes from">
          <p>
            Permit records are pulled from each jurisdiction&apos;s official open-data portal —
            primarily Socrata (SODA API) and ArcGIS REST services, with a browser-based fallback for
            portals without a clean API. We cache ingested records and serve from our database; we do
            not re-query a portal on every page view. Every record links back to its source and shows
            when it was retrieved.
          </p>
        </Section>

        <Section title="Freshness — “data current as of”">
          <p>
            Portals update on very different cadences — some daily, some monthly, and some lag a year
            or more. We surface a <strong>&ldquo;data current as of&rdquo;</strong> date for every
            market and flag jurisdictions that have gone quiet past their expected cadence. We would
            rather show you that a market is stale than present old data as if it were live.
          </p>
        </Section>

        <Section title="How we classify project types">
          <p>
            Jurisdictions describe permits inconsistently. We normalize each permit&apos;s type and
            description into a consistent taxonomy (new construction, addition, ADU, roofing, solar,
            HVAC, electrical, plumbing, demolition, and more) using keyword rules, and we honor
            native flags where a portal provides them (for example, an explicit ADU indicator). These
            classifications are <strong>computed analysis</strong>, not official designations.
          </p>
        </Section>

        <Section title="Activity metrics & hotspots">
          <p>
            Neighborhood activity levels, trends (month-over-month and year-over-year), project-type
            mix, and &ldquo;hotspot&rdquo; grades are computed from the underlying public permits over
            a trailing window. They are an analytical lens to help you read an area quickly — not an
            official measure or a prediction.
          </p>
        </Section>

        <Section title="Contractors">
          <p>
            Contractor pages aggregate public permit activity — where a contractor has pulled permits,
            what they build, and at what volume. This is public business information, not an
            endorsement, rating, or recommendation.
          </p>
        </Section>

        <Section title="What we exclude">
          <p>
            We limit output to public business and project fields. We deliberately exclude individual
            owners&apos; or applicants&apos; personal names and other personal information, even when a
            portal includes them.
          </p>
        </Section>

        <Section title="Corrections">
          <p>
            Found something wrong or out of date? Permit data ultimately lives with the jurisdiction —
            but we want our copy to be accurate. Contact us and we&apos;ll review and re-sync the
            source.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

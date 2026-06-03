import type { Metadata } from "next";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-4 px-6 py-12 text-sm leading-relaxed text-ink-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Terms of Service</h1>
        <p className="text-ink-muted">Codename draft — review with counsel before launch.</p>
        <p>
          Groundbreak provides access to building-permit records sourced from public government
          portals, together with derived analysis. By using the service you agree to these terms.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">Informational use only</h2>
        <p>
          The service is informational and does not constitute permitting, legal, financial, or
          professional advice. Permit records are public data that may be incomplete, delayed, or out
          of date; classifications and activity metrics are computed analysis, not official
          designations. Verify anything material directly with the jurisdiction.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">Acceptable use</h2>
        <p>
          You may not resell raw data in violation of a source portal&apos;s terms, attempt to
          de-anonymize individuals, or use the service to harass. API and export access is governed by
          your plan.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">No warranty; limitation of liability</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
          extent permitted by law, Groundbreak is not liable for decisions made in reliance on the
          data.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">Billing</h2>
        <p>
          Paid plans are billed via Stripe and can be canceled anytime from the billing portal.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

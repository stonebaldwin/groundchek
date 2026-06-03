import type { Metadata } from "next";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-4 px-6 py-12 text-sm leading-relaxed text-ink-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
        <p className="text-ink-muted">Codename draft — review with counsel before launch.</p>
        <h2 className="pt-2 text-lg font-semibold text-ink">What we collect</h2>
        <p>
          Account data (email, name) for authentication and billing, and product data (saved
          properties, watched areas, alert preferences). Billing is handled by Stripe; we do not store
          card numbers.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">Permit data &amp; personal information</h2>
        <p>
          The permit records we publish are public government records about properties, projects, and
          businesses. We deliberately exclude individual owners&apos; and applicants&apos; personal
          names and other personal information from our output, even where a source portal includes
          them.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">How we use data</h2>
        <p>
          To operate the service, send the alerts and reports you request, and improve coverage. We do
          not sell personal data and we do not run ads.
        </p>
        <h2 className="pt-2 text-lg font-semibold text-ink">Your choices</h2>
        <p>
          You can export or delete your account data and unsubscribe from alerts at any time. Contact
          us for any privacy request.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

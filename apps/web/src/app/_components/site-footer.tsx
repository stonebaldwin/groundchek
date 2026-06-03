import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl space-y-3 px-6 py-8 text-xs text-ink-muted">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/search" className="hover:text-ink">
            Explore permits
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/methodology" className="hover:text-ink">
            Methodology
          </Link>
          <Link href="/legal/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </div>
        <p className="max-w-3xl leading-relaxed">
          Groundbreak (codename). Permit data comes from each jurisdiction&apos;s official open-data
          portal, attributed with retrieval and &ldquo;current as of&rdquo; dates. Project-type
          classifications and activity metrics are computed analysis, not official designations.
          Informational only — not permitting, legal, or professional advice.
        </p>
      </div>
    </footer>
  );
}

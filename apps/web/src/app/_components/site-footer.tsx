import Link from "next/link";
import { Logo } from "./logo";

const LINKS = [
  { href: "/search", label: "Explore permits" },
  { href: "/pricing", label: "Pricing" },
  { href: "/methodology", label: "Methodology" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-2 border-ink/90 bg-surface-sunken/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-2">
            <Logo />
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted">
              The public record, redrawn
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-ink-soft transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-ink-muted">
          Groundbreak (codename). Permit data comes from each jurisdiction&apos;s official open-data
          portal, attributed with retrieval and &ldquo;current as of&rdquo; dates. Project-type
          classifications and activity metrics are computed analysis, not official designations.
          Informational only — not permitting, legal, or professional advice.
        </p>
      </div>
    </footer>
  );
}

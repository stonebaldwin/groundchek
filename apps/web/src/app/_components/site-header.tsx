import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Groundbreak
        </Link>
        <nav className="flex items-center gap-5 text-sm text-ink-soft">
          <Link href="/search" className="transition-colors hover:text-ink">
            Explore
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-ink">
            Pricing
          </Link>
          <Link href="/methodology" className="hidden transition-colors hover:text-ink sm:inline">
            Methodology
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border-strong px-3 py-1.5 font-medium text-ink transition-colors hover:bg-surface-sunken"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="draft-grid relative flex min-h-[62vh] items-center justify-center overflow-hidden px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-draft/0 to-draft-deep/70" />
        <div className="relative text-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-on-draft-muted">
            Public record · not found
          </p>
          <p className="mt-3 font-display text-6xl font-bold tracking-tight text-on-draft sm:text-7xl">
            404
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-on-draft">No record on file</h1>
          <p className="mx-auto mt-2 max-w-sm text-on-draft-muted">
            We couldn&apos;t find that property, area, or page. It may not be in a covered market yet.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-lg bg-accent px-4 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Back home
            </Link>
            <Link
              href="/search"
              className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 font-medium text-on-draft transition-colors hover:bg-white/10"
            >
              Explore permits
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

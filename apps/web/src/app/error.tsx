"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Segment-level error boundary for the public app. Catches errors thrown while
 * rendering a page (e.g. a transient database failure on a force-dynamic page)
 * and shows a branded, recoverable screen instead of Next's unstyled 500.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced in Cloudflare Workers observability for root-causing.
    console.error("Page render error:", error?.message, error?.digest);
  }, [error]);

  return (
    <main className="draft-grid relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-draft/0 to-draft-deep/70" />
      <div className="relative max-w-md text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-on-draft-muted">
          Something went sideways
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-on-draft">
          This data isn&apos;t loading right now
        </h1>
        <p className="mt-2 text-on-draft-muted">
          A temporary problem stopped this page from loading — usually a brief hiccup talking to the
          records database. Try again in a moment.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 font-medium text-on-draft transition-colors hover:bg-white/10"
          >
            Back home
          </Link>
        </div>
        {error?.digest ? (
          <p className="mt-6 font-mono text-[0.65rem] text-on-draft-muted/70">ref: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}

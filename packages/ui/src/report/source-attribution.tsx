import { ExternalLink } from "lucide-react";
import { cn } from "../lib/cn";

export interface SourceAttributionProps {
  sourceName: string;
  retrievedAt: string | Date;
  sourceUrl?: string;
  /** Per-jurisdiction freshness — "current as of [date]". Permit data lags vary. */
  dataCurrentAs?: string | Date;
  className?: string;
}

/** Deterministic UTC formatting avoids SSR/CSR hydration mismatches. */
function formatTimestamp(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * The attribution line every record carries: "Source: <portal> · retrieved <time>
 * · current as of <date>". Honesty + legal posture: figures always point back to
 * their official source, and freshness is shown rather than hidden.
 */
export function SourceAttribution({
  sourceName,
  retrievedAt,
  sourceUrl,
  dataCurrentAs,
  className,
}: SourceAttributionProps) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-muted",
        className,
      )}
    >
      <span>Source:</span>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-medium text-ink-soft underline decoration-border-strong underline-offset-2 hover:text-primary"
        >
          {sourceName}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      ) : (
        <span className="font-medium text-ink-soft">{sourceName}</span>
      )}
      <span aria-hidden="true">·</span>
      <span>retrieved {formatTimestamp(retrievedAt)}</span>
      {dataCurrentAs ? (
        <>
          <span aria-hidden="true">·</span>
          <span>current as of {formatDate(dataCurrentAs)}</span>
        </>
      ) : null}
    </p>
  );
}

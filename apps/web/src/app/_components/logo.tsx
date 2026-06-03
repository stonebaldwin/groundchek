import { APP_NAME } from "@/lib/env";

/**
 * Groundbreak wordmark. The mark is a stylized site plan: a parcel square on a
 * blueprint grid with a building footprint and an accent surveyor's tick — the
 * product's "public record, redrawn" idea in one glyph. Rename-safe (the name
 * comes from NEXT_PUBLIC_APP_NAME).
 */
export function Logo({
  withWordmark = true,
  className = "",
  tone = "ink",
}: {
  withWordmark?: boolean;
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="2" y="2" width="22" height="22" rx="3.5" className="fill-primary" />
        <path
          d="M9 2.5V23.5M16.5 2.5V23.5M2.5 9H23.5M2.5 16.5H23.5"
          className="stroke-white/20"
          strokeWidth="1"
        />
        <rect x="7" y="12" width="9" height="7" rx="1" className="fill-white" />
        <rect x="10.5" y="8" width="6.5" height="4.5" rx="1" className="fill-white/80" />
        <path d="M2.4 7V2.4H7" className="stroke-accent" strokeWidth="1.9" strokeLinecap="square" />
      </svg>
      {withWordmark ? (
        <span
          className={`font-display text-[1.15rem] font-bold leading-none tracking-tight ${
            tone === "light" ? "text-on-draft" : "text-ink"
          }`}
        >
          {APP_NAME}
        </span>
      ) : null}
    </span>
  );
}

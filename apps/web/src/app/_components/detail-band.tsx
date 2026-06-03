import type { ReactNode } from "react";

/** A small mono "stamp" eyebrow — the recurring civic-record label treatment. */
export function StampLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink-muted ${className}`}>
      {children}
    </p>
  );
}

/**
 * The document-header band used at the top of every detail page: a faint
 * blueprint grid on a sunken paper strip with a bottom rule, so property / area
 * / contractor reports all read like pages of the same dossier.
 */
export function DetailBand({
  children,
  width = "max-w-4xl",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="blueprint-grid border-b border-border bg-surface-sunken/30">
      <div className={`mx-auto ${width} px-6 pb-7 pt-7`}>{children}</div>
    </div>
  );
}

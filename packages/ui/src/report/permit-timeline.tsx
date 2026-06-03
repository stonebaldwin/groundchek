import { ExternalLink, HardHat } from "lucide-react";
import { Badge } from "../primitives/badge";
import { cn } from "../lib/cn";
import { formatCurrency, formatDateShort } from "../lib/format";
import { projectTypeMeta, type ProjectType } from "../lib/project-type";
import { permitStatusMeta, type PermitStatus } from "../lib/status";
import { ProjectTypeBadge } from "./project-type-badge";

export interface PermitTimelineEntry {
  id: string;
  permitNumber: string;
  projectType: ProjectType;
  status: PermitStatus;
  description?: string;
  valuation?: number;
  contractorName?: string;
  contractorLicense?: string;
  appliedDate?: string;
  issuedDate?: string;
  sourceUrl?: string;
}

export interface PermitTimelineProps {
  entries: PermitTimelineEntry[];
  className?: string;
}

/**
 * A property's permit history as a vertical timeline. Each entry leads with its
 * project type (color-coded), status, and value, then permit number, dates,
 * description, contractor (public business info only), and a link to the source
 * record.
 */
export function PermitTimeline({ entries, className }: PermitTimelineProps) {
  return (
    <ol className={cn("relative space-y-4 border-l border-border pl-6", className)}>
      {entries.map((e) => {
        const pt = projectTypeMeta(e.projectType);
        const status = permitStatusMeta(e.status);
        return (
          <li key={e.id} className="relative">
            <span
              className="absolute -left-[1.84rem] top-1.5 size-3 rounded-full border-2 border-surface"
              style={{ backgroundColor: pt.hex }}
              aria-hidden="true"
            />
            <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectTypeBadge type={e.projectType} size="sm" />
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatCurrency(e.valuation, { compact: true })}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                <span className="font-mono text-ink-soft">{e.permitNumber}</span>
                {e.issuedDate ? <span>Issued {formatDateShort(e.issuedDate)}</span> : null}
                {!e.issuedDate && e.appliedDate ? (
                  <span>Applied {formatDateShort(e.appliedDate)}</span>
                ) : null}
              </div>
              {e.description ? (
                <p className="mt-2 text-sm text-ink-soft">{e.description}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {e.contractorName ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                    <HardHat className="size-3.5" aria-hidden="true" />
                    {e.contractorName}
                    {e.contractorLicense ? (
                      <span className="font-mono">· {e.contractorLicense}</span>
                    ) : null}
                  </span>
                ) : (
                  <span />
                )}
                {e.sourceUrl ? (
                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft underline decoration-border-strong underline-offset-2 hover:text-primary"
                  >
                    Source record
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

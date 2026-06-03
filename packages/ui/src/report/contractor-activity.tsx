import { HardHat } from "lucide-react";
import { cn } from "../lib/cn";
import { formatCurrency } from "../lib/format";
import { type ProjectType } from "../lib/project-type";
import { ProjectTypeBadge } from "./project-type-badge";

export interface ContractorActivityEntry {
  name: string;
  license?: string;
  permitCount: number;
  totalValuation?: number;
  jurisdictions?: string[];
  topProjectTypes?: ProjectType[];
}

export interface ContractorActivityListProps {
  contractors: ContractorActivityEntry[];
  className?: string;
}

/**
 * Where a contractor is pulling permits, what they build, and at what volume —
 * public business activity (not an endorsement or rating). Useful to investors
 * and suppliers; the Business tier's lead-gen surface.
 */
export function ContractorActivityList({ contractors, className }: ContractorActivityListProps) {
  return (
    <ul className={cn("divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface", className)}>
      {contractors.map((c) => (
        <li key={`${c.name}-${c.license ?? ""}`} className="flex flex-wrap items-center gap-4 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <HardHat className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{c.name}</span>
              {c.license ? (
                <span className="font-mono text-xs text-ink-muted">{c.license}</span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {(c.topProjectTypes ?? []).slice(0, 3).map((t) => (
                <ProjectTypeBadge key={t} type={t} size="sm" />
              ))}
              {c.jurisdictions && c.jurisdictions.length > 0 ? (
                <span className="text-xs text-ink-muted">· {c.jurisdictions.join(", ")}</span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-sm font-semibold tabular-nums text-ink">{c.permitCount}</p>
              <p className="text-xs text-ink-muted">permits</p>
            </div>
            <div>
              <p className="text-sm font-semibold tabular-nums text-ink">
                {formatCurrency(c.totalValuation, { compact: true })}
              </p>
              <p className="text-xs text-ink-muted">value</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

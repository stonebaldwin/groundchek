import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../lib/cn";
import { formatCurrency, formatPercent } from "../lib/format";
import { projectTypeMeta, type ProjectType } from "../lib/project-type";
import { type ActivityLevel } from "../lib/activity";
import { ActivityBadge } from "./activity-badge";
import { ProjectTypeBadge } from "./project-type-badge";

export interface AreaActivityPoint {
  period: string; // e.g. "Apr"
  permitCount: number;
}

export interface AreaProjectShare {
  type: ProjectType;
  count: number;
  share: number; // 0..1
}

export interface AreaActivityData {
  label: string; // "78701 · Downtown Austin"
  activityLevel: ActivityLevel;
  totalPermits: number;
  totalValuation?: number;
  momChangePct?: number;
  yoyChangePct?: number;
  series: AreaActivityPoint[];
  projectMix: AreaProjectShare[];
}

export interface AreaActivityCardProps {
  data: AreaActivityData;
  className?: string;
}

function Delta({ label, value }: { label: string; value?: number }) {
  const up = (value ?? 0) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
          value == null ? "text-ink-muted" : up ? "text-success" : "text-danger",
        )}
      >
        {value != null ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        {formatPercent(value)}
      </span>
    </div>
  );
}

/**
 * Neighborhood activity dashboard: an activity grade, headline figures, a permit-
 * volume trend, and the project-type mix. All figures are computed analysis of
 * public permit records — not official designations.
 */
export function AreaActivityCard({ data, className }: AreaActivityCardProps) {
  const maxCount = Math.max(1, ...data.series.map((p) => p.permitCount));
  const mix = [...data.projectMix].sort((a, b) => b.share - a.share);

  return (
    <div
      className={cn("space-y-5 rounded-xl border border-border bg-surface p-5 shadow-card", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold tracking-tight text-ink">{data.label}</h3>
          <p className="text-xs text-ink-muted">Construction activity · trailing 12 months</p>
        </div>
        <ActivityBadge level={data.activityLevel} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Permits</span>
          <span className="text-2xl font-semibold tabular-nums text-ink">{data.totalPermits}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-muted">Total value</span>
          <span className="text-2xl font-semibold tabular-nums text-ink">
            {formatCurrency(data.totalValuation, { compact: true })}
          </span>
        </div>
        <Delta label="MoM" value={data.momChangePct} />
        <Delta label="YoY" value={data.yoyChangePct} />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-ink-muted">Permit volume by month</span>
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Monthly permit volume">
          {data.series.map((p) => (
            <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(4, (p.permitCount / maxCount) * 100)}%` }}
                title={`${p.period}: ${p.permitCount}`}
              />
              <span className="text-[10px] text-ink-muted">{p.period}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-ink-muted">Project-type mix</span>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-sunken">
          {mix.map((m) => (
            <span
              key={m.type}
              style={{ width: `${m.share * 100}%`, backgroundColor: projectTypeMeta(m.type).hex }}
              title={`${projectTypeMeta(m.type).label}: ${Math.round(m.share * 100)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
          {mix.slice(0, 6).map((m) => (
            <span key={m.type} className="inline-flex items-center gap-1.5">
              <ProjectTypeBadge type={m.type} size="sm" />
              <span className="text-xs tabular-nums text-ink-muted">{Math.round(m.share * 100)}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

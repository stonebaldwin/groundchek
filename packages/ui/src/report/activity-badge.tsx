import { activityMeta, type ActivityLevel } from "../lib/activity";
import { cn } from "../lib/cn";

export interface ActivityBadgeProps {
  level: ActivityLevel;
  size?: "sm" | "md" | "lg";
  withDot?: boolean;
  className?: string;
}

/** A graded badge for neighborhood construction-activity level. */
export function ActivityBadge({ level, size = "md", withDot = true, className }: ActivityBadgeProps) {
  const m = activityMeta(level);
  const sizing =
    size === "lg" ? "px-3 py-1 text-sm" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        m.soft,
        m.text,
        sizing,
        className,
      )}
    >
      {withDot ? <span className={cn("size-1.5 rounded-full", m.dot)} aria-hidden="true" /> : null}
      {m.label}
    </span>
  );
}

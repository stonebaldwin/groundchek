import { projectTypeMeta, type ProjectType } from "../lib/project-type";
import { cn } from "../lib/cn";

export interface ProjectTypeBadgeProps {
  type: ProjectType;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

/**
 * A categorical badge for a permit's normalized project type. Colors come from
 * the design system's project-type palette (inline-styled — there are ~18 hues).
 */
export function ProjectTypeBadge({
  type,
  size = "md",
  showDot = true,
  className,
}: ProjectTypeBadgeProps) {
  const m = projectTypeMeta(type);
  const sizing = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-medium", sizing, className)}
      style={{ backgroundColor: m.soft, color: m.hex }}
    >
      {showDot ? (
        <span className="size-1.5 rounded-full" style={{ backgroundColor: m.hex }} aria-hidden="true" />
      ) : null}
      {m.label}
    </span>
  );
}

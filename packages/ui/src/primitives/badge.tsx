import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "outline";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-surface-sunken text-ink-soft",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  outline: "border border-border-strong text-ink-soft",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

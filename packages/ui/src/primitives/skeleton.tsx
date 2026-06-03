import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/** A calm loading placeholder. Compose several to mimic the final layout. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  );
}

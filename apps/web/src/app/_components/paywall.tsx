import Link from "next/link";
import { Lock } from "lucide-react";

export function PaywallNotice({
  title,
  description,
  cta = "See plans",
  href = "/pricing",
}: {
  title: string;
  description: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-sunken/50 px-6 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-surface text-primary shadow-soft">
        <Lock className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mx-auto max-w-md text-sm text-ink-muted">{description}</p>
      </div>
      <Link
        href={href}
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {cta}
      </Link>
    </div>
  );
}

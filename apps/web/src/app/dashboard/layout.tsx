import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Badge } from "@groundbreak/ui";
import { getViewer } from "@/lib/viewer";
import { SiteHeader } from "../_components/site-header";
import { DashboardNav } from "./_components/nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/login?next=/dashboard");

  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
            <p className="truncate text-sm font-medium text-ink">{viewer.name ?? viewer.email}</p>
            <p className="truncate text-xs text-ink-muted">{viewer.email}</p>
            <Badge variant={viewer.plan === "free" ? "neutral" : "primary"} className="mt-2 capitalize">
              {viewer.plan} plan
            </Badge>
          </div>
          <DashboardNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}

import Link from "next/link";
import { Building2, MapPinned } from "lucide-react";
import { Badge, EmptyState, ProjectTypeBadge, StatCard } from "@groundbreak/ui";
import { listAreas } from "@/lib/data/queries";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const [viewer, areas] = await Promise.all([getViewer(), listAreas()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome back{viewer.name ? `, ${viewer.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-ink-muted">
          Your watched properties and areas, and recent permit activity.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Watched properties" value={0} sublabel="Save a property to watch it" />
        <StatCard label="Watched areas" value={0} sublabel="Monitor a ZIP or neighborhood" />
        <StatCard
          label="Alerts this month"
          value={0}
          sublabel={viewer.entitlements.alerts > 0 ? `${viewer.entitlements.alerts} included` : "Upgrade for alerts"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Recent activity in your markets</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {areas.map((a) => (
            <Link
              key={a.id}
              href={`/area/${a.id}`}
              className="rounded-xl border border-border bg-surface p-4 shadow-soft transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{a.label}</p>
                <Badge variant="neutral" className="capitalize">
                  {a.activityLevel}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {a.summary.momChangePct != null
                  ? `${a.summary.momChangePct > 0 ? "+" : ""}${Math.round(a.summary.momChangePct)}% month-over-month`
                  : "Steady activity"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.summary.projectMix.slice(0, 3).map((m) => (
                  <ProjectTypeBadge key={m.type} type={m.type} size="sm" />
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="No saved properties yet"
          description="Search an address and save it to track its permit history and get alerts."
          action={
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              Find a property →
            </Link>
          }
        />
        <EmptyState
          icon={<MapPinned className="size-5" />}
          title="No watched areas yet"
          description="Watch a ZIP or neighborhood to get notified when activity spikes."
          action={
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              Browse areas →
            </Link>
          }
        />
      </section>
    </div>
  );
}

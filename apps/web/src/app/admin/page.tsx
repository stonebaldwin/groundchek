import { AlertTriangle } from "lucide-react";
import { Badge, FreshnessIndicator, StatCard, type BadgeProps } from "@groundbreak/ui";
import { getAdminOverview } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "ok") return "success";
  if (status === "error") return "danger";
  if (status === "stale" || status === "partial") return "warning";
  return "neutral";
}

export default async function AdminPage() {
  const o = await getAdminOverview();
  const stale = o.jurisdictions.filter((j) => j.stale).length;
  const current = o.jurisdictions.length - stale;
  const newRequests = o.coverageRequests.filter((c) => c.status === "new").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Operator cockpit</h1>
          <p className="text-sm text-ink-muted">Ingestion health, freshness, and the coverage queue.</p>
        </div>
        <Badge variant={o.live ? "success" : "neutral"}>{o.live ? "Live data" : "Demo data"}</Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Jurisdictions" value={o.jurisdictions.length} />
        <StatCard label="Current" value={current} tone="text-success" />
        <StatCard label="Stale" value={stale} tone={stale > 0 ? "text-warning" : undefined} />
        <StatCard label="New coverage requests" value={newRequests} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Jurisdiction health</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken/60 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Market</th>
                <th className="px-4 py-2.5 font-medium">Platform</th>
                <th className="px-4 py-2.5 font-medium">Freshness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {o.jurisdictions.map((j) => (
                <tr key={j.id}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">
                      {j.name}, {j.state}
                    </span>
                    <span className="ml-2 font-mono text-xs text-ink-muted">{j.id}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{j.platform}</td>
                  <td className="px-4 py-3">
                    {j.dataCurrentAs ? (
                      <FreshnessIndicator currentAs={j.dataCurrentAs} stale={j.stale} />
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Recent sync runs</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {o.recentRuns.map((r, i) => (
            <li key={`${r.jurisdictionId}-${i}`} className="space-y-1 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                <span className="font-mono text-xs text-ink-soft">{r.jurisdictionId}</span>
                <span className="text-xs text-ink-muted">
                  {r.recordsSeen} seen · {r.recordsNew} new
                </span>
              </div>
              {r.error ? <p className="text-xs text-danger">{r.error}</p> : null}
              {r.anomalies.map((a) => (
                <p key={a} className="flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {a}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Coverage requests</h2>
        {o.coverageRequests.length === 0 ? (
          <p className="text-sm text-ink-muted">No requests yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {o.coverageRequests.map((c, i) => (
              <li key={`${c.market}-${i}`} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <span className="font-medium text-ink">{c.market}</span>
                  <span className="ml-2 text-xs text-ink-muted">{c.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted">{c.createdAt}</span>
                  <Badge variant={c.status === "new" ? "primary" : "neutral"}>{c.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

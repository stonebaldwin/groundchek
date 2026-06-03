import { isDbConfigured } from "../env";
import { DEMO_JURISDICTIONS } from "./demo";

export interface AdminSyncRun {
  jurisdictionId: string;
  status: string;
  recordsSeen: number;
  recordsNew: number;
  anomalies: string[];
  error?: string;
  startedAt: string;
  dataCurrentAs?: string;
}

export interface AdminCoverageRequest {
  market: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface AdminOverview {
  jurisdictions: typeof DEMO_JURISDICTIONS;
  recentRuns: AdminSyncRun[];
  coverageRequests: AdminCoverageRequest[];
  live: boolean;
}

const DEMO_RUNS: AdminSyncRun[] = [
  { jurisdictionId: "us-tx-austin", status: "ok", recordsSeen: 1284, recordsNew: 23, anomalies: [], startedAt: "2026-06-03T07:00:00Z", dataCurrentAs: "2026-05-29" },
  { jurisdictionId: "us-nc-wilmington", status: "ok", recordsSeen: 412, recordsNew: 6, anomalies: [], startedAt: "2026-06-03T07:00:00Z", dataCurrentAs: "2026-05-27" },
  {
    jurisdictionId: "us-ca-losangeles",
    status: "stale",
    recordsSeen: 9120,
    recordsNew: 0,
    anomalies: ["No new data since 2024-09-01 — past the monthly cadence (possible stale source)."],
    startedAt: "2026-06-03T07:00:00Z",
    dataCurrentAs: "2024-09-01",
  },
];

const DEMO_COVERAGE: AdminCoverageRequest[] = [
  { market: "Raleigh, NC", email: "agent@example.com", status: "new", createdAt: "2026-05-30" },
  { market: "78704", email: "investor@example.com", status: "reviewing", createdAt: "2026-05-28" },
];

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!isDbConfigured()) {
    return { jurisdictions: DEMO_JURISDICTIONS, recentRuns: DEMO_RUNS, coverageRequests: DEMO_COVERAGE, live: false };
  }
  try {
    const { getDb, schema, desc } = await import("@groundbreak/db");
    const db = getDb();
    const [jur, runs, coverage] = await Promise.all([
      db.select().from(schema.jurisdictions),
      db.select().from(schema.syncRuns).orderBy(desc(schema.syncRuns.startedAt)).limit(25),
      db.select().from(schema.coverageRequests).orderBy(desc(schema.coverageRequests.createdAt)).limit(50),
    ]);
    const stale = (d?: Date | null) => Boolean(d && Date.now() - d.getTime() > 45 * 86_400_000);
    return {
      live: true,
      jurisdictions: jur.map((j) => ({
        id: j.id,
        name: j.name,
        state: j.state,
        platform: j.platform,
        dataCurrentAs: j.dataCurrentAs?.toISOString().slice(0, 10),
        knownLagMonths: j.knownLagMonths ?? undefined,
        stale: j.status === "stale" || stale(j.dataCurrentAs),
        permitCount: 0,
      })),
      recentRuns: runs.map((r) => ({
        jurisdictionId: r.jurisdictionId,
        status: r.status,
        recordsSeen: r.recordsSeen,
        recordsNew: r.recordsNew,
        anomalies: r.anomalies ?? [],
        error: r.error ?? undefined,
        startedAt: r.startedAt.toISOString(),
        dataCurrentAs: r.dataCurrentAs?.toISOString().slice(0, 10),
      })),
      coverageRequests: coverage.map((c) => ({
        market: c.market,
        email: c.email,
        status: c.status,
        createdAt: c.createdAt.toISOString().slice(0, 10),
      })),
    };
  } catch {
    return { jurisdictions: DEMO_JURISDICTIONS, recentRuns: DEMO_RUNS, coverageRequests: DEMO_COVERAGE, live: false };
  }
}

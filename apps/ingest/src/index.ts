/**
 * Groundbreak ingestion worker.
 *
 * `scheduled` runs on per-cadence cron triggers: it selects due jurisdictions,
 * ingests each via `@groundbreak/core` against the Drizzle repository (logging a
 * `sync_run` and emitting `permit_events`), refreshes `area_aggregates`, and then
 * processes the alert queue. Non-ok/anomalous/stale runs email the operator.
 *
 * `fetch` exposes `/health` and a token-guarded `/run` for manual/dev triggers.
 * Browser-fallback (Accela/CARTO) sources dispatch to a Queue + Browser Rendering
 * worker — wired here by injecting a `browserFetcher` into the connector deps.
 */
import { processAlerts, type AlertEnv } from "./alerts";
import { runDueJurisdictions, type RunEnv } from "./run";

export interface Env {
  DATABASE_URL?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  OPERATOR_ALERT_EMAIL?: string;
  APP_URL?: string;
  INGEST_TOKEN?: string;
}

function runEnvFrom(env: Env): RunEnv & AlertEnv {
  return {
    DATABASE_URL: env.DATABASE_URL!,
    RESEND_API_KEY: env.RESEND_API_KEY,
    EMAIL_FROM: env.EMAIL_FROM,
    OPERATOR_ALERT_EMAIL: env.OPERATOR_ALERT_EMAIL,
    APP_URL: env.APP_URL,
  };
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.DATABASE_URL) {
      console.warn("[ingest] DATABASE_URL not set — skipping run.");
      return;
    }
    const runEnv = runEnvFrom(env);
    ctx.waitUntil(
      (async () => {
        const outcomes = await runDueJurisdictions(runEnv);
        const delivered = await processAlerts(runEnv);
        console.log(
          `[ingest] cron "${controller.cron}": ${outcomes.length} jurisdiction(s), ${delivered} alert(s)`,
        );
      })(),
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", db: Boolean(env.DATABASE_URL) });
    }

    if (url.pathname === "/run") {
      if (!env.DATABASE_URL) return new Response("DATABASE_URL not set", { status: 503 });
      if (env.INGEST_TOKEN && url.searchParams.get("token") !== env.INGEST_TOKEN) {
        return new Response("Forbidden", { status: 403 });
      }
      const runEnv = runEnvFrom(env);
      const outcomes = await runDueJurisdictions(runEnv, {
        only: url.searchParams.get("jurisdiction") ?? undefined,
        force: url.searchParams.get("force") === "1",
      });
      const delivered = await processAlerts(runEnv);
      return Response.json({ jurisdictions: outcomes.length, alerts: delivered, outcomes });
    }

    return new Response("groundbreak-ingest: ok", { headers: { "content-type": "text/plain" } });
  },
} satisfies ExportedHandler<Env>;

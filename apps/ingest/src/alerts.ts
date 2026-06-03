import { and, createDb, eq, schema, sql } from "@groundbreak/db";
import { escapeHtml, sendAlertEmail, type MailEnv } from "./email";

export interface AlertEnv extends MailEnv {
  DATABASE_URL: string;
  APP_URL?: string;
}

interface Subscriber {
  userId: string;
  email: string;
  subscriptionId: string;
}

/**
 * Process unprocessed permit events: find users watching the affected property
 * (or its area), email them, log the delivery, and mark the event processed.
 * Idempotent — events are marked processed and alerts are keyed to the event.
 */
export async function processAlerts(env: AlertEnv, limit = 100): Promise<number> {
  const db = createDb(env.DATABASE_URL);
  const events = await db
    .select()
    .from(schema.permitEvents)
    .where(eq(schema.permitEvents.processed, false))
    .limit(limit);

  let delivered = 0;
  for (const ev of events) {
    const subscribers = await subscribersFor(db, ev);
    const link = await linkFor(db, env, ev.propertyId, ev.jurisdictionId);

    const safeSummary = escapeHtml(ev.summary);
    for (const s of subscribers) {
      // Claim the (event, subscription) first; the unique index makes this the
      // idempotency gate. If it was already claimed (conflict → no row), the email
      // already went out on a prior pass — skip the re-send.
      const claimed = await db
        .insert(schema.alerts)
        .values({
          userId: s.userId,
          alertSubscriptionId: s.subscriptionId,
          permitEventId: ev.id,
          subject: ev.summary,
        })
        .onConflictDoNothing()
        .returning({ id: schema.alerts.id });
      if (claimed.length === 0) continue;
      await sendAlertEmail(env, s.email, ev.summary, [
        safeSummary,
        `<a href="${link}">View on Groundbreak</a>`,
      ]);
      delivered++;
    }

    await db.update(schema.permitEvents).set({ processed: true }).where(eq(schema.permitEvents.id, ev.id));
  }
  return delivered;
}

async function subscribersFor(
  db: ReturnType<typeof createDb>,
  ev: typeof schema.permitEvents.$inferSelect,
): Promise<Subscriber[]> {
  const byKey = new Map<string, Subscriber>();

  // Property-level watches.
  if (ev.propertyId) {
    const rows = await db
      .select({ userId: schema.users.id, email: schema.users.email, subscriptionId: schema.alertSubscriptions.id })
      .from(schema.alertSubscriptions)
      .innerJoin(schema.users, eq(schema.users.id, schema.alertSubscriptions.userId))
      .where(
        and(
          eq(schema.alertSubscriptions.active, true),
          eq(schema.alertSubscriptions.propertyId, ev.propertyId),
          sql`${ev.type} = ANY(${schema.alertSubscriptions.eventTypes})`,
        ),
      );
    for (const r of rows) byKey.set(`${r.userId}:${r.subscriptionId}`, r);
  }

  // Area-level watches that match by jurisdiction.
  const areaRows = await db
    .select({ userId: schema.users.id, email: schema.users.email, subscriptionId: schema.alertSubscriptions.id })
    .from(schema.alertSubscriptions)
    .innerJoin(schema.watchedAreas, eq(schema.watchedAreas.id, schema.alertSubscriptions.watchedAreaId))
    .innerJoin(schema.users, eq(schema.users.id, schema.alertSubscriptions.userId))
    .where(
      and(
        eq(schema.alertSubscriptions.active, true),
        eq(schema.watchedAreas.kind, "jurisdiction"),
        eq(schema.watchedAreas.areaId, ev.jurisdictionId),
        sql`${ev.type} = ANY(${schema.alertSubscriptions.eventTypes})`,
      ),
    );
  for (const r of areaRows) byKey.set(`${r.userId}:${r.subscriptionId}`, r);

  return [...byKey.values()];
}

async function linkFor(
  db: ReturnType<typeof createDb>,
  env: AlertEnv,
  propertyId: string | null,
  jurisdictionId: string,
): Promise<string> {
  const base = (env.APP_URL ?? "https://groundbreak.app").replace(/\/$/, "");
  if (propertyId) {
    const rows = await db
      .select({ key: schema.properties.addressKey })
      .from(schema.properties)
      .where(eq(schema.properties.id, propertyId))
      .limit(1);
    if (rows[0]) return `${base}/property/${rows[0].key}`;
  }
  return `${base}/area/${jurisdictionId}`;
}

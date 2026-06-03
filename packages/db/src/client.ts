import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * The Groundbreak database client.
 *
 * Uses Neon's HTTP driver, which is the right fit for serverless/edge runtimes
 * (Cloudflare Workers) where a single round-trip per query beats a pooled TCP
 * connection. Column names are auto-derived as `snake_case` from camelCase keys.
 */
export type Database = ReturnType<typeof createDb>;

export function createDb(connectionString: string): ReturnType<typeof drizzle<typeof schema>> {
  const sql = neon(connectionString);
  return drizzle(sql, { schema, casing: "snake_case" });
}

/** Thrown when the database URL is absent, so callers can degrade gracefully. */
export class MissingDatabaseUrlError extends Error {
  constructor() {
    super("DATABASE_URL is not set. See .env.example.");
    this.name = "MissingDatabaseUrlError";
  }
}

const clientCache = new Map<string, Database>();

/**
 * Returns a process-cached database client. In a Worker isolate this is created
 * once and reused. Reads `process.env.DATABASE_URL` by default (OpenNext
 * populates `process.env` from the Cloudflare environment).
 */
export function getDb(connectionString: string | undefined = process.env.DATABASE_URL): Database {
  if (!connectionString) throw new MissingDatabaseUrlError();
  // Key the cache by connection string so a different URL (read replica, tests,
  // a second tenant) never silently returns the first-created client.
  let db = clientCache.get(connectionString);
  if (!db) {
    db = createDb(connectionString);
    clientCache.set(connectionString, db);
  }
  return db;
}

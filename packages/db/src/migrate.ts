import "dotenv/config";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

// Use `||` (not `??`) so an empty-string DATABASE_URL_UNPOOLED — exactly what
// .env.example ships — falls through to DATABASE_URL instead of blanking it.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle");

async function main(databaseUrl: string) {
  const sql = neon(databaseUrl);
  // Enable PostGIS before any spatial tables are created. Idempotent.
  console.log("→ ensuring PostGIS extension…");
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`;

  const db = drizzle(sql);
  console.log(`→ applying migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("✓ migrations applied");
}

main(url).catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});

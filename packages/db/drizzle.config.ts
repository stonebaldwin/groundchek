import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// `||` (not `??`) so an empty-string DATABASE_URL_UNPOOLED falls through to DATABASE_URL.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});

export { createDb, getDb, MissingDatabaseUrlError, type Database } from "./client";
export * as schema from "./schema";
export * from "./schema";
export * from "./enums";

// Convenience re-exports so apps don't need a direct drizzle-orm import for the basics.
export {
  sql,
  eq,
  ne,
  and,
  or,
  not,
  inArray,
  notInArray,
  desc,
  asc,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  between,
  isNull,
  isNotNull,
  count,
  countDistinct,
  sum,
  avg,
  max,
  min,
} from "drizzle-orm";

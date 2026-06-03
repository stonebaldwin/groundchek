// Canonical vocabulary + presentational helpers
export * from "./types";
export * from "./taxonomy";
export * from "./activity";

// Engine
export * from "./errors";
export * from "./http";
export * from "./geo";
export * from "./mapping";
export * from "./status";
export * from "./classify";
export * from "./normalize";
export * from "./resolve";
export * from "./analytics";
export * from "./changes";
export * from "./health";
export * from "./ports";
export * from "./connectors";
export * from "./runner";

// Repositories
export {
  createInMemoryRepository,
  type InMemoryRepository,
  type InMemoryState,
} from "./testing/in-memory-repository";
export { createDrizzleIngestRepository } from "./persistence/drizzle-repository";

export const CORE_VERSION = "0.1.0";

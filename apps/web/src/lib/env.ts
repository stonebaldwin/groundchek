/** True when a database is wired. Public pages fall back to demo data otherwise,
 *  so the app is fully reviewable before any jurisdiction is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Read an env var, returning undefined for empty/missing values. */
export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** Read a required env var; throws if absent (used inside request scope only). */
export function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Groundbreak";

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

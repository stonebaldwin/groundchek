import { env } from "./env";

/** Operators are configured via ADMIN_EMAILS (comma-separated) or fall back to
 *  the operator alert address. No config → no operators (admin is locked). */
export function isOperatorEmail(email: string | undefined): boolean {
  if (!email) return false;
  const list = (env("ADMIN_EMAILS") ?? env("OPERATOR_ALERT_EMAIL") ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

import { Resend } from "resend";
import { env } from "./env";

let client: Resend | undefined;

function getResend(): Resend | null {
  const key = env("RESEND_API_KEY");
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

const FROM = env("EMAIL_FROM") || "Groundbreak <alerts@example.com>";

async function send(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[email:dev] → ${to} · ${subject}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

function shell(title: string, body: string): string {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1c20">
    <h2 style="color:#1d5a8a">${title}</h2>${body}
    <p style="color:#747a83;font-size:12px;margin-top:24px">Groundbreak — local building-permit intelligence. Informational only.</p>
  </div>`;
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  await send(
    email,
    "Your Groundbreak sign-in link",
    shell(
      "Sign in to Groundbreak",
      `<p>Click to sign in. This link expires shortly and can only be used once.</p>
       <p><a href="${url}" style="display:inline-block;background:#1d5a8a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Sign in</a></p>`,
    ),
  );
}

export async function sendAlertEmail(email: string, subject: string, lines: string[]): Promise<void> {
  await send(
    email,
    subject,
    shell(subject, lines.map((l) => `<p>${l}</p>`).join("")),
  );
}

export async function sendOperatorAlert(subject: string, lines: string[]): Promise<void> {
  const to = env("OPERATOR_ALERT_EMAIL");
  if (!to) {
    console.warn(`[email] operator alert (no OPERATOR_ALERT_EMAIL): ${subject}`);
    return;
  }
  await send(to, `[Groundbreak ops] ${subject}`, shell(subject, lines.map((l) => `<p>${l}</p>`).join("")));
}

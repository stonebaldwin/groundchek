export interface MailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  OPERATOR_ALERT_EMAIL?: string;
}

/** Send via the Resend REST API (fetch-based — no SDK, Workers-friendly). */
export async function sendEmail(
  env: MailEnv,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[ingest:email:dev] → ${to} · ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || "Groundbreak <alerts@example.com>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error(`[ingest:email] Resend ${res.status}: ${await res.text()}`);
  }
}

function shell(title: string, lines: string[]): string {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;color:#1a1c20">
    <h2 style="color:#1d5a8a">${title}</h2>${lines.map((l) => `<p>${l}</p>`).join("")}
    <p style="color:#747a83;font-size:12px;margin-top:24px">Groundbreak — local building-permit intelligence.</p>
  </div>`;
}

export async function sendAlertEmail(
  env: MailEnv,
  to: string,
  subject: string,
  lines: string[],
): Promise<void> {
  await sendEmail(env, to, subject, shell(subject, lines));
}

export async function sendOperatorAlert(
  env: MailEnv,
  subject: string,
  lines: string[],
): Promise<void> {
  if (!env.OPERATOR_ALERT_EMAIL) {
    console.warn(`[ingest:ops] ${subject}: ${lines.join(" | ")}`);
    return;
  }
  await sendEmail(env, env.OPERATOR_ALERT_EMAIL, `[Groundbreak ops] ${subject}`, shell(subject, lines));
}

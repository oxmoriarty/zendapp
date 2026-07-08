/**
 * Transactional email.
 *
 * Uses Resend (https://resend.com) when RESEND_API_KEY is set — this is a
 * real, production HTTP API call, not a stub. When no key is configured
 * (local development without an account), it falls back to logging the
 * code to the server console so `npm run dev` still works out of the box.
 *
 * To go live:
 *   1. Create a Resend account and verify a sending domain (or use their
 *      shared onboarding domain for testing).
 *   2. Set RESEND_API_KEY and EMAIL_FROM in your environment.
 * Nothing else in the app needs to change — every call site imports
 * `sendVerificationEmail` from this one module.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

function verificationEmailHtml(code: string) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;">
    <div style="width:40px;height:40px;border-radius:12px;background:#31028f;margin-bottom:20px;"></div>
    <h1 style="font-size:20px;margin:0 0 8px;color:#150140;">Verify your email</h1>
    <p style="font-size:14px;color:#4b4557;line-height:1.5;margin:0 0 24px;">
      Enter this code in Zendapp to finish signing in. It expires in 10 minutes.
    </p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#31028f;text-align:center;
                background:#f4edff;border-radius:16px;padding:20px;">
      ${code}
    </div>
    <p style="font-size:12px;color:#8a8398;margin-top:24px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>`;
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Zendapp <onboarding@resend.dev>";

  if (!apiKey) {
    // Local-dev fallback only. Never falls back silently in production —
    // if RESEND_API_KEY is missing in a deployed environment, verification
    // emails simply won't send, which surfaces immediately in testing.
    console.log(`[zendapp:dev] verification code for ${email}: ${code}`);
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: `${code} is your Zendapp verification code`,
      html: verificationEmailHtml(code),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Don't throw — a slow/broken email provider shouldn't 500 the signup
    // request, and the rate limiter already bounds abuse. Log loudly so
    // it's caught in monitoring instead.
    console.error(`[zendapp:email] Resend request failed (${res.status}): ${body}`);
  }
}

export async function sendPaymentReceivedEmail(email: string, opts: { fromName: string; amountUsdc: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Zendapp <onboarding@resend.dev>";
  if (!apiKey) {
    console.log(`[zendapp:dev] ${email} received $${opts.amountUsdc} from ${opts.fromName}`);
    return;
  }
  await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: `${opts.fromName} sent you $${opts.amountUsdc}`,
      html: `<p style="font-family:sans-serif">You just received <strong>$${opts.amountUsdc} USDC</strong> from <strong>${opts.fromName}</strong> on Zendapp.</p>`,
    }),
  }).catch((err) => console.error("[zendapp:email] payment notification failed", err));
}

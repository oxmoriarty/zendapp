import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/lib/server/db";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_CODE", message: "Enter the 6-digit code." } },
      { status: 400 },
    );
  }

  const result = await db.verifyCode(parsed.data.email, parsed.data.code);
  if (!result.ok) {
    const message =
      result.reason === "EXPIRED"
        ? "That code has expired. Request a new one."
        : result.reason === "TOO_MANY_ATTEMPTS"
          ? "Too many incorrect attempts. Request a new code."
          : "That code doesn't match. Check your email and try again.";
    return NextResponse.json(
      { error: { code: "EMAIL_VERIFICATION_FAILED", message } },
      { status: 400 },
    );
  }

  // If this email already has a completed account, this is a sign-in on
  // (possibly) a new device — activate the real session immediately and
  // hand back the user record so the client can check whether this
  // device already has the matching wallet locally, or needs to restore
  // it from the recovery phrase (see /restore-wallet).
  const existing = await db.getUserByEmail(parsed.data.email);
  if (existing) {
    await createSession({ sub: existing.id, email: parsed.data.email, stage: "active" });
    return NextResponse.json({ ok: true, existingAccount: true, user: existing });
  }

  // Otherwise this is a new signup — create a pending session with no
  // wallet or username yet; the normal onboarding flow picks up from here.
  const id = randomUUID();
  await createSession({ sub: id, email: parsed.data.email, stage: "pending" });
  return NextResponse.json({ ok: true, existingAccount: false });
}

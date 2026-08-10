import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { sendVerificationEmail } from "@/lib/server/email";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = db.rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again shortly." } },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_EMAIL", message: "Enter a valid email address." } },
      { status: 400 },
    );
  }

  const existing = await db.getUserByEmail(parsed.data.email);

  // Same entry point serves both "create an account" and "sign in on a new
  // device": either way, we send a code to prove the person controls this
  // inbox, then branch after verification based on whether an account
  // already exists. There's no separate "log in" button anywhere in the
  // UI — one email field handles both cases, like most modern apps do.
  const code = await db.createVerificationCode(parsed.data.email);
  await sendVerificationEmail(parsed.data.email, code);
  return NextResponse.json({ ok: true, accountExists: !!existing });
}

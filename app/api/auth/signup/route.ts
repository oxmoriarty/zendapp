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
  if (existing) {
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists." } },
      { status: 409 },
    );
  }

  const code = await db.createVerificationCode(parsed.data.email);
  await sendVerificationEmail(parsed.data.email, code);
  return NextResponse.json({ ok: true });
}

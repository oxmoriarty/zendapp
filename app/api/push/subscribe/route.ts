import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/db";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in required." } }, { status: 401 });
  }
  const me = await db.getUserByEmail(session.email);
  if (!me) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Complete onboarding first." } }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid subscription payload." } }, { status: 400 });
  }

  await db.savePushSubscription(me.id, {
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
  });

  return NextResponse.json({ ok: true });
}

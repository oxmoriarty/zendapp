import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { sendPaymentReceivedEmail } from "@/lib/server/email";
import { notifyPaymentReceived } from "@/lib/server/push";

const schema = z.object({
  hash: z.string().optional(),
  toAddress: z.string(),
  amountUsdc: z.string(),
  feeUsdc: z.string(),
  note: z.string().max(140).optional(),
  status: z.enum(["pending", "complete", "failed"]),
});

/**
 * The blockchain is the source of truth for amounts, status, and finality.
 * This endpoint only attaches off-chain context (an optional note, and a
 * resolved recipient for display) so the history feed can render instantly
 * without waiting on log indexing for every field, and fans out a
 * notification to the recipient if they have one on file.
 */
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
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid transaction payload." } }, { status: 400 });
  }

  const record = await db.recordTransaction({
    hash: parsed.data.hash,
    fromAddress: me.walletAddress,
    toAddress: parsed.data.toAddress,
    amountUsdc: parsed.data.amountUsdc,
    feeUsdc: parsed.data.feeUsdc,
    note: parsed.data.note,
    status: parsed.data.status,
  });

  if (parsed.data.status === "complete") {
    const recipient = await db.getUserByAddress(parsed.data.toAddress);
    if (recipient) {
      // Fire-and-forget — a slow email/push provider should never block the
      // sender's success screen.
      void sendPaymentReceivedEmail(recipient.email, { fromName: me.displayName, amountUsdc: parsed.data.amountUsdc });
      void notifyPaymentReceived(recipient.id, { fromName: me.displayName, amountUsdc: parsed.data.amountUsdc });
    }
  }

  return NextResponse.json({ transaction: record });
}

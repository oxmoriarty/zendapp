import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import type { ZendTransactionRecord } from "@/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in required." } }, { status: 401 });

  const me = await db.getUserByEmail(session.email);
  if (!me) return NextResponse.json({ transactions: [] });

  const raw = await db.getTransactionsForAddress(me.walletAddress);

  const transactions: ZendTransactionRecord[] = await Promise.all(
    raw.map(async (t) => {
      const direction = t.fromAddress.toLowerCase() === me.walletAddress.toLowerCase() ? "sent" : "received";
      const counterpartyAddress = direction === "sent" ? t.toAddress : t.fromAddress;
      const counterpartyUser = await db.getUserByAddress(counterpartyAddress);
      return {
        id: t.id,
        hash: t.hash as `0x${string}` | undefined,
        direction,
        status: t.status,
        counterparty: {
          username: counterpartyUser?.username ?? "unknown",
          displayName: counterpartyUser?.displayName ?? "Unknown user",
          avatarUrl: counterpartyUser?.avatarUrl,
        },
        amountUsdc: t.amountUsdc,
        feeUsdc: t.feeUsdc,
        note: t.note,
        createdAt: t.createdAt,
      };
    }),
  );

  return NextResponse.json({ transactions });
}

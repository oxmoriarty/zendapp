import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = db.rateLimit(`search:${ip}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Searching too fast. Slow down a moment." } },
      { status: 429 },
    );
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length === 0) return NextResponse.json({ users: [] });

  const results = await db.searchUsers(q, session?.sub);
  return NextResponse.json({
    users: results.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? null,
      walletAddress: u.walletAddress,
    })),
  });
}

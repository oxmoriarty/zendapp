import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { validateUsername } from "@/lib/validations/username";

/**
 * Exact-match username lookup — distinct from /api/users/search, which is
 * a substring match intended for the search-as-you-type UI. This is used
 * wherever a caller already has a specific, complete username and wants
 * to resolve it directly: currently the QR-scan flow in Send, which reads
 * a username out of a scanned code and needs the real account (including
 * the wallet address) behind it, not a list of fuzzy matches.
 */
export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = db.rateLimit(`user-lookup:${ip}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many lookups. Slow down a moment." } },
      { status: 429 },
    );
  }

  const result = validateUsername(params.username);
  if (!result.valid) {
    return NextResponse.json({ error: { code: "USER_NOT_FOUND", message: "No account with that username." } }, { status: 404 });
  }

  const user = await db.getUserByUsername(result.normalized);
  if (!user) {
    return NextResponse.json({ error: { code: "USER_NOT_FOUND", message: "No account with that username." } }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      walletAddress: user.walletAddress,
    },
  });
}

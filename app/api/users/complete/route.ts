import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { getSession, createSession } from "@/lib/auth/session";
import { validateUsername } from "@/lib/validations/username";
import { db } from "@/lib/server/db";

const schema = z.object({
  walletAddress: z.string().refine((v) => isAddress(v), "Invalid wallet address"),
  username: z.string(),
  displayName: z.string().trim().min(1).max(40),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Please verify your email first." } },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 },
    );
  }

  const usernameResult = validateUsername(parsed.data.username);
  if (!usernameResult.valid) {
    return NextResponse.json(
      { error: { code: "INVALID_USERNAME", message: usernameResult.error } },
      { status: 400 },
    );
  }
  if (await db.isUsernameTaken(usernameResult.normalized)) {
    return NextResponse.json(
      { error: { code: "USERNAME_TAKEN", message: "That username was just taken. Try another." } },
      { status: 409 },
    );
  }

  // The wallet address must also be globally unique — guards against a
  // client bug (or replay) trying to attach the same address to two users.
  const existingWallet = await db.getUserByAddress(parsed.data.walletAddress);
  if (existingWallet) {
    return NextResponse.json(
      { error: { code: "WALLET_CREATION_FAILED", message: "This wallet is already linked to an account." } },
      { status: 409 },
    );
  }

  let user;
  try {
    user = await db.createUser({
      email: session.email,
      username: usernameResult.normalized,
      displayName: parsed.data.displayName,
      walletAddress: parsed.data.walletAddress,
    });
  } catch {
    // Most likely a unique-constraint race (two requests claiming the same
    // username/wallet/email at once) — Postgres is the final arbiter.
    return NextResponse.json(
      { error: { code: "USERNAME_TAKEN", message: "That username or wallet was just claimed. Please try again." } },
      { status: 409 },
    );
  }

  await createSession({ sub: user.id, email: session.email, stage: "active" });

  return NextResponse.json({ user });
}

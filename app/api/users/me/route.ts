import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const user = await db.getUserByEmail(session.email);
  if (!user) return NextResponse.json({ user: null, stage: session.stage });

  return NextResponse.json({ user });
}

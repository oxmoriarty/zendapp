import { NextRequest, NextResponse } from "next/server";
import { validateUsername } from "@/lib/validations/username";
import { db } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("u") ?? "";
  const result = validateUsername(q);
  if (!result.valid) {
    return NextResponse.json({ available: false, error: result.error });
  }
  const taken = await db.isUsernameTaken(result.normalized);
  if (taken) {
    return NextResponse.json({
      available: false,
      error: "That username is already taken.",
    });
  }
  return NextResponse.json({ available: true, normalized: result.normalized });
}

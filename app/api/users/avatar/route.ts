import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { storeAvatarImage, AvatarStorageError } from "@/lib/server/avatar-storage";

/**
 * Accepts the already-compressed image as multipart form data (a single
 * "image" file field) rather than JSON, since the client already has a
 * Blob from canvas.toBlob-equivalent processing (lib/image/compress.ts
 * currently hands back a data URI; either shape works — this route reads
 * whichever the client sends).
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

  const rl = db.rateLimit(`avatar:${me.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many photo changes. Try again in a bit." } },
      { status: 429 },
    );
  }

  let dataUri: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("image");
    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    }
  } else {
    const body = await req.json().catch(() => null);
    if (typeof body?.image === "string") dataUri = body.image;
  }

  if (!dataUri) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "No image received." } }, { status: 400 });
  }

  let avatarUrl: string;
  try {
    avatarUrl = await storeAvatarImage(dataUri, me.id);
  } catch (err) {
    const message = err instanceof AvatarStorageError ? err.message : "Couldn't process that photo.";
    return NextResponse.json({ error: { code: "INVALID_INPUT", message } }, { status: 400 });
  }

  const updated = await db.updateUserAvatar(me.id, avatarUrl);
  return NextResponse.json({ user: updated });
}

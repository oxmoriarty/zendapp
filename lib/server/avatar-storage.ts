/**
 * Stores a profile photo and returns the URL to save on the user record.
 *
 * Uses Vercel Blob (@vercel/blob) when `BLOB_READ_WRITE_TOKEN` is set —
 * enabling the Blob store for a Vercel project sets this automatically,
 * so production needs zero manual configuration beyond turning it on in
 * the dashboard. Chosen over a generic S3-compatible integration because
 * it's the official, zero-config storage product for exactly this stack
 * (Next.js on Vercel), with a free tier (1 GB storage, 10 GB bandwidth/mo
 * as of writing) that comfortably covers avatar images for a project at
 * this stage.
 *
 * Without that token (local development without a Blob store yet), this
 * falls back to returning the image as a `data:` URI, which Postgres's
 * unbounded `text` column and the app's plain `<img>`-based Avatar
 * component both handle natively — no separate dev-storage system to
 * stand up, following the same "real code path either way, no mock to
 * swap out later" pattern already used for email and push in this app.
 */

const MAX_DECODED_BYTES = 3 * 1024 * 1024; // 3 MB — generous given client-side compression targets ~100-300 KB

export class AvatarStorageError extends Error {}

function decodeDataUri(dataUri: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUri);
  if (!match) throw new AvatarStorageError("Unsupported image format.");

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength === 0) throw new AvatarStorageError("Empty image.");
  if (buffer.byteLength > MAX_DECODED_BYTES) throw new AvatarStorageError("Image is too large.");

  return { buffer, contentType };
}

export async function storeAvatarImage(dataUri: string, ownerId: string): Promise<string> {
  const { buffer, contentType } = decodeDataUri(dataUri);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import("@vercel/blob");
    const ext = contentType.split("/")[1];
    const blob = await put(`avatars/${ownerId}-${Date.now()}.${ext}`, buffer, {
      access: "public",
      contentType,
      token,
    });
    return blob.url;
  }

  // Dev fallback: hand back the same data URI. It's already been through
  // decode/size validation above, so it's safe to store as-is.
  return dataUri;
}

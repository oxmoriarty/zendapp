/**
 * Resizes and compresses a user-selected image entirely client-side before
 * it's ever sent to the server — keeps profile photo uploads small (a few
 * hundred KB at most) regardless of the original camera photo's size,
 * using nothing but the built-in Canvas API (no extra dependency needed
 * for something this small).
 */
export async function compressImageToDataUri(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<string> {
  const { maxDimension = 512, quality = 0.85 } = opts;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNSUPPORTED");

  // Center-crop to a square so every avatar renders consistently in the
  // app's circular Avatar component, regardless of the source photo's
  // aspect ratio.
  const size = Math.min(width, height);
  const sx = (bitmap.width * scale - size) / 2 / scale;
  const sy = (bitmap.height * scale - size) / 2 / scale;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(bitmap, sx, sy, size / scale, size / scale, 0, 0, size, size);

  return canvas.toDataURL("image/jpeg", quality);
}

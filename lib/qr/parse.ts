import { validateUsername } from "@/lib/validations/username";

/**
 * Zendapp's own QR codes (Receive and Profile pages) encode
 * `https://zendapp.app/<username>`. This is the inverse operation: given
 * whatever text a camera scan decoded, extract a Zendapp username from it
 * if possible — accepting the full URL, a bare `zendapp.app/<username>`,
 * or (for convenience, e.g. scanning a code someone printed as just their
 * handle) a raw username on its own.
 *
 * Returns the normalized (lowercase) username, or null if the scanned
 * text isn't recognizable as one at all — callers show a clear "not a
 * Zendapp code" error in that case rather than guessing.
 */
export function parseZendappQrPayload(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  // Try as a URL first (handles both "https://zendapp.app/alice" and
  // protocol-relative / bare-host forms browsers' QR readers sometimes
  // normalize differently).
  try {
    const url = new URL(text.includes("://") ? text : `https://${text}`);
    if (url.hostname === "zendapp.app" || url.hostname === "www.zendapp.app") {
      const segment = url.pathname.split("/").filter(Boolean)[0];
      if (segment) {
        const result = validateUsername(segment);
        if (result.valid) return result.normalized;
      }
      return null;
    }
  } catch {
    // Not a URL at all — fall through and try it as a bare username.
  }

  const result = validateUsername(text);
  return result.valid ? result.normalized : null;
}

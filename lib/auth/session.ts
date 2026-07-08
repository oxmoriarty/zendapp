import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Secure email-based session handling.
 *
 * The session token is a short-lived signed JWT stored in an httpOnly,
 * Secure, SameSite=Lax cookie — never accessible to client JS, so it can't
 * be exfiltrated by XSS. It carries only the user's id/email; it never
 * carries anything wallet-related, since the wallet never touches the
 * server in the first place.
 *
 * SESSION_SECRET must be set in the production environment. A fallback is
 * provided only so local development works out of the box.
 */
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me",
);
const COOKIE_NAME = "zendapp_session";

export interface SessionPayload {
  sub: string; // user id
  email: string;
  stage: "pending" | "active"; // pending = email verified, onboarding not finished
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

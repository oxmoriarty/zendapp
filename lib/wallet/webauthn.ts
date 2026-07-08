/**
 * Biometric unlock via the WebAuthn PRF extension.
 *
 * This is a real, standards-based implementation — not a UI-only toggle.
 * It uses the WebAuthn "prf" extension (https://w3c.github.io/webauthn/#prf-extension)
 * to derive a stable, device-bound secret from a platform authenticator
 * (Face ID, Touch ID, Windows Hello, Android biometric unlock) and uses
 * that secret as an AES-GCM key to wrap a *second* copy of the wallet
 * mnemonic. The original passcode-encrypted copy is never removed, so
 * biometric unlock is always an additional convenience layer on top of the
 * passcode, never a replacement for it — losing access to the authenticator
 * (new phone, reset device) still leaves the passcode path intact.
 *
 * Browser/authenticator support for the PRF extension varies (broad support
 * on Chrome/Android/Windows Hello as of 2025; partial on Safari). Every
 * function here fails closed: if PRF isn't available, `registerBiometric`
 * throws `PRF_UNSUPPORTED` and the caller (Settings) simply doesn't offer
 * the toggle — there is no silent fake success.
 */

const RP_NAME = "Zendapp";

function toBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

export function isWebAuthnAvailable(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

async function deriveAesKeyFromPrf(prfBits: ArrayBuffer): Promise<CryptoKey> {
  // The PRF output is already a high-entropy 32-byte secret; import it
  // directly as raw AES-256-GCM key material.
  return crypto.subtle.importKey("raw", prfBits, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export interface BiometricRegistration {
  credentialId: string; // base64
  prfSalt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64 (mnemonic encrypted under the PRF-derived key)
}

/**
 * Registers a new platform credential with the PRF extension, then
 * immediately performs a `get()` against it (a second user-presence
 * prompt) to retrieve the PRF secret and use it to encrypt the mnemonic.
 * Throws `PRF_UNSUPPORTED` if the authenticator doesn't support PRF.
 */
export async function registerBiometric(username: string, userId: string, mnemonic: string): Promise<BiometricRegistration> {
  if (!(await isPlatformAuthenticatorAvailable())) {
    throw new Error("PRF_UNSUPPORTED");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME },
      user: { id: userIdBytes, name: username, displayName: username },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      extensions: { prf: {} } as AuthenticationExtensionsClientInputs,
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("PRF_UNSUPPORTED");

  const clientExtensions = credential.getClientExtensionResults() as any;
  if (!clientExtensions?.prf?.enabled) {
    throw new Error("PRF_UNSUPPORTED");
  }

  const credentialId = toBase64(credential.rawId);
  const prfSalt = crypto.getRandomValues(new Uint8Array(32));

  // Second prompt: evaluate the PRF with our chosen salt to get the secret.
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: credential.rawId, type: "public-key" }],
      userVerification: "required",
      extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs,
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  const results = assertion?.getClientExtensionResults() as any;
  const prfBits: ArrayBuffer | undefined = results?.prf?.results?.first;
  if (!prfBits) throw new Error("PRF_UNSUPPORTED");

  const key = await deriveAesKeyFromPrf(prfBits);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(mnemonic),
  );

  return {
    credentialId,
    prfSalt: toBase64(prfSalt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
}

/** Prompts Face ID / Touch ID / Windows Hello and returns the decrypted mnemonic. */
export async function unlockWithBiometric(registration: BiometricRegistration): Promise<string> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: toBuffer(registration.credentialId), type: "public-key" }],
      userVerification: "required",
      extensions: { prf: { eval: { first: toBuffer(registration.prfSalt) } } } as AuthenticationExtensionsClientInputs,
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  const results = assertion?.getClientExtensionResults() as any;
  const prfBits: ArrayBuffer | undefined = results?.prf?.results?.first;
  if (!prfBits) throw new Error("BIOMETRIC_UNLOCK_FAILED");

  const key = await deriveAesKeyFromPrf(prfBits);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toBuffer(registration.iv) },
      key,
      toBuffer(registration.ciphertext),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error("BIOMETRIC_UNLOCK_FAILED");
  }
}

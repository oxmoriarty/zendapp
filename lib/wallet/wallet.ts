import { mnemonicToAccount, english, generateMnemonic } from "viem/accounts";
import {
  getWalletRecord,
  putWalletRecord,
  deleteWalletRecord,
  migrateFromLocalStorageIfNeeded,
  type EncryptedWalletRecord,
} from "./storage";
import { registerBiometric, unlockWithBiometric, type BiometricRegistration } from "./webauthn";

type HdAccount = ReturnType<typeof mnemonicToAccount>;

/**
 * Non-custodial wallet core.
 *
 * Zendapp NEVER sends a private key or recovery phrase to the backend.
 * The mnemonic is generated in the browser, the private key is derived
 * client-side, and only encrypted blobs are ever persisted — in IndexedDB
 * (see ./storage.ts), never on a server:
 *
 *   - A PBKDF2(passcode) -> AES-GCM encrypted copy (the required baseline;
 *     this is what recovery/export always falls back to).
 *   - Optionally, a second WebAuthn-PRF-derived AES-GCM encrypted copy,
 *     used only for the "unlock with Face ID / Touch ID" convenience flow
 *     (see ./webauthn.ts). Enabling it never removes the passcode copy.
 *
 * This module is intentionally the ONLY place in the app that touches a
 * raw private key or mnemonic in memory outside of ./webauthn.ts's own
 * encrypt/decrypt calls.
 */

export interface GeneratedWallet {
  mnemonic: string;
  address: `0x${string}`;
  account: HdAccount;
}

/** Create a brand-new Arc-compatible wallet (standard secp256k1 / BIP-44, identical to Ethereum). */
export function createWallet(): GeneratedWallet {
  const mnemonic = generateMnemonic(english);
  const account = mnemonicToAccount(mnemonic);
  return { mnemonic, address: account.address, account };
}

const PBKDF2_ITERATIONS = 210_000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toB64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}
function fromB64(str: string) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/** Encrypt the mnemonic with a passcode-derived key and persist it in IndexedDB. */
export async function encryptAndStoreWallet(mnemonic: string, passphrase: string, address: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(mnemonic));

  await putWalletRecord({
    version: 1,
    address,
    passcode: { salt: toB64(salt), iv: toB64(iv), ciphertext: toB64(ciphertext) },
  });
}

export async function decryptStoredWallet(passphrase: string): Promise<string> {
  const record = await getWalletRecord();
  if (!record) throw new Error("WALLET_NOT_FOUND");
  const { salt, iv, ciphertext } = record.passcode;
  const key = await deriveKey(passphrase, fromB64(salt));
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ciphertext));
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error("INVALID_PASSPHRASE");
  }
}

export async function hasStoredWallet(): Promise<boolean> {
  await migrateFromLocalStorageIfNeeded();
  return (await getWalletRecord()) !== null;
}

export async function getStoredWalletAddress(): Promise<string | null> {
  await migrateFromLocalStorageIfNeeded();
  const record = await getWalletRecord();
  return record?.address ?? null;
}

export async function clearStoredWallet() {
  await deleteWalletRecord();
}

/** Re-derive the signing account from a decrypted mnemonic, used right before signing a send. */
export function accountFromMnemonic(mnemonic: string): HdAccount {
  return mnemonicToAccount(mnemonic);
}

// ---- Biometric unlock (optional convenience layer) -------------------------

export async function hasBiometricUnlock(): Promise<boolean> {
  const record = await getWalletRecord();
  return !!record?.biometric;
}

/**
 * Enables "unlock with Face ID / Touch ID" for future sends. Requires the
 * passcode once (to obtain the mnemonic) and then a platform authenticator
 * prompt. Throws `PRF_UNSUPPORTED` if the device/browser can't support it -
 * callers should catch this and simply not show the feature as available,
 * rather than surfacing it as a hard error.
 */
export async function enableBiometricUnlock(passphrase: string, username: string, userId: string): Promise<void> {
  const record = await getWalletRecord();
  if (!record) throw new Error("WALLET_NOT_FOUND");

  const mnemonic = await decryptStoredWallet(passphrase);
  const biometric: BiometricRegistration = await registerBiometric(username, userId, mnemonic);

  await putWalletRecord({ ...record, biometric });
}

export async function disableBiometricUnlock(): Promise<void> {
  const record = await getWalletRecord();
  if (!record) return;
  const { biometric, ...rest } = record;
  await putWalletRecord(rest as EncryptedWalletRecord);
}

/** Attempts a biometric unlock; throws if unavailable or the prompt fails/cancels. */
export async function unlockWalletWithBiometrics(): Promise<string> {
  const record = await getWalletRecord();
  if (!record?.biometric) throw new Error("BIOMETRIC_NOT_ENABLED");
  return unlockWithBiometric(record.biometric);
}

/**
 * IndexedDB-backed storage for the encrypted wallet record.
 *
 * Replaces the earlier localStorage implementation. IndexedDB is the right
 * choice here for three reasons over localStorage:
 *   1. It's asynchronous and doesn't block the main thread.
 *   2. It isn't capped at ~5MB and isn't serialized to a single string on
 *      every read/write, so adding fields (like the biometric wrapper
 *      below) doesn't mean re-encoding the whole blob as JSON in memory.
 *   3. It's the storage layer expected by a PWA/native-wrapper install,
 *      which is where a payment app like this is headed.
 *
 * This module is intentionally the ONLY place that touches the raw
 * IndexedDB API — everything else goes through wallet.ts.
 */

const DB_NAME = "zendapp-wallet";
const DB_VERSION = 1;
const STORE_NAME = "wallet";
const RECORD_KEY = "primary";

export interface EncryptedWalletRecord {
  version: 1;
  address: string;
  /** Passcode-derived encryption (PBKDF2 + AES-GCM). Always present — this is the recovery baseline. */
  passcode: { salt: string; iv: string; ciphertext: string };
  /** Optional biometric convenience unlock (WebAuthn PRF-derived AES-GCM key). Absent until the user opts in. */
  biometric?: {
    credentialId: string;
    prfSalt: string;
    iv: string;
    ciphertext: string;
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getWalletRecord(): Promise<EncryptedWalletRecord | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const record = await withStore<EncryptedWalletRecord | undefined>("readonly", (s) => s.get(RECORD_KEY));
    return record ?? null;
  } catch {
    return null;
  }
}

export async function putWalletRecord(record: EncryptedWalletRecord): Promise<void> {
  await withStore("readwrite", (s) => s.put(record, RECORD_KEY));
}

export async function deleteWalletRecord(): Promise<void> {
  await withStore("readwrite", (s) => s.delete(RECORD_KEY));
}

/**
 * One-time migration from the earlier localStorage-based storage (pre-v1
 * builds). Reads the old key, moves it into IndexedDB under the new shape,
 * and removes the localStorage copy. Safe to call on every load — it's a
 * no-op once migrated.
 */
export async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  const LEGACY_KEY = "zendapp:wallet:v1";
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;

  const existing = await getWalletRecord();
  if (existing) {
    localStorage.removeItem(LEGACY_KEY);
    return;
  }

  try {
    const parsed = JSON.parse(legacy);
    await putWalletRecord({
      version: 1,
      address: parsed.address,
      passcode: { salt: parsed.salt, iv: parsed.iv, ciphertext: parsed.ciphertext },
    });
  } finally {
    localStorage.removeItem(LEGACY_KEY);
  }
}

import type { ZendUser } from "@/types";

export class ApiRequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError("OFFLINE", "You appear to be offline. Check your connection and try again.", 0);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error ?? { code: "UNKNOWN", message: "Something went wrong. Please try again." };
    throw new ApiRequestError(err.code, err.message, res.status);
  }
  return json as T;
}

export const api = {
  signup: (email: string) =>
    request<{ ok: true; accountExists: boolean }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verify: (email: string, code: string) =>
    request<{ ok: true; existingAccount: boolean; user?: ZendUser }>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  checkUsername: (u: string) => request<{ available: boolean; error?: string; normalized?: string }>(`/api/username/check?u=${encodeURIComponent(u)}`),
  completeOnboarding: (payload: { walletAddress: string; username: string; displayName: string }) =>
    request<{ user: any }>("/api/users/complete", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<{ user: any }>("/api/users/me"),
  searchUsers: (q: string) => request<{ users: any[] }>(`/api/users/search?q=${encodeURIComponent(q)}`),
  recordTx: (payload: {
    hash?: string;
    toAddress: string;
    amountUsdc: string;
    feeUsdc: string;
    note?: string;
    status: "pending" | "complete" | "failed";
  }) => request<{ transaction: any }>("/api/tx/record", { method: "POST", body: JSON.stringify(payload) }),
  history: () => request<{ transactions: any[] }>("/api/tx/history"),
  subscribePush: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    request<{ ok: true }>("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub) }),
  unsubscribePush: (endpoint: string) =>
    request<{ ok: true }>("/api/push/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint }) }),
};

import { eq, ne, and, or, ilike, desc, sql } from "drizzle-orm";
import { db as client } from "./db-client";
import { users, verificationCodes, transactions, pushSubscriptions } from "./schema";
import type { ZendUser } from "@/types";

/**
 * Real persistence layer, backed by Postgres via Drizzle ORM (see
 * lib/server/schema.ts). Every function here durably reads/writes the
 * database — no in-memory Maps left except the rate limiter (see its own
 * comment below for why that one's fine to leave in-process).
 */

type UserRow = typeof users.$inferSelect;

function toZendUser(u: UserRow): ZendUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl ?? undefined,
    walletAddress: u.walletAddress as `0x${string}`,
    createdAt: u.createdAt.toISOString(),
  };
}

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export const db = {
  // ---- Email verification -------------------------------------------------

  async createVerificationCode(email: string) {
    const normalized = email.toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client
      .insert(verificationCodes)
      .values({ email: normalized, code, expiresAt, attempts: 0 })
      .onConflictDoUpdate({
        target: verificationCodes.email,
        set: { code, expiresAt, attempts: 0 },
      });

    return code;
  },

  async verifyCode(email: string, code: string) {
    const normalized = email.toLowerCase();
    const [entry] = await client.select().from(verificationCodes).where(eq(verificationCodes.email, normalized));

    if (!entry) return { ok: false as const, reason: "NOT_FOUND" as const };
    if (Date.now() > entry.expiresAt.getTime()) return { ok: false as const, reason: "EXPIRED" as const };
    if (entry.attempts >= 5) return { ok: false as const, reason: "TOO_MANY_ATTEMPTS" as const };

    if (entry.code !== code) {
      await client
        .update(verificationCodes)
        .set({ attempts: entry.attempts + 1 })
        .where(eq(verificationCodes.email, normalized));
      return { ok: false as const, reason: "MISMATCH" as const };
    }

    await client.delete(verificationCodes).where(eq(verificationCodes.email, normalized));
    return { ok: true as const };
  },

  // ---- Users ---------------------------------------------------------------

  async isUsernameTaken(username: string) {
    const [existing] = await client.select({ id: users.id }).from(users).where(eq(users.username, username.toLowerCase()));
    return !!existing;
  },

  async createUser(input: { email: string; username: string; displayName: string; walletAddress: string }) {
    const [row] = await client
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        walletAddress: input.walletAddress,
        emailVerified: 1,
      })
      .returning();
    return toZendUser(row);
  },

  async getUserByEmail(email: string) {
    const [u] = await client.select().from(users).where(eq(users.email, email.toLowerCase()));
    return u ? toZendUser(u) : null;
  },

  async getUserByUsername(username: string) {
    const [u] = await client.select().from(users).where(eq(users.username, username.toLowerCase()));
    return u ? toZendUser(u) : null;
  },

  async getUserByAddress(address: string) {
    const [u] = await client.select().from(users).where(ilike(users.walletAddress, address));
    return u ? toZendUser(u) : null;
  },

  async searchUsers(query: string, excludeUserId?: string) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const pattern = `%${q}%`;
    const matchClause = or(ilike(users.username, pattern), ilike(users.displayName, pattern));
    const whereClause = excludeUserId ? and(matchClause, ne(users.id, excludeUserId)) : matchClause;

    const rows = await client.select().from(users).where(whereClause).orderBy(users.username).limit(20);
    return rows.map(toZendUser);
  },

  // ---- Transactions ----------------------------------------------------------

  async recordTransaction(tx: {
    hash?: string;
    fromAddress: string;
    toAddress: string;
    amountUsdc: string;
    feeUsdc: string;
    note?: string;
    status: "pending" | "complete" | "failed";
  }) {
    const [sender, recipient] = await Promise.all([
      this.getUserByAddress(tx.fromAddress),
      this.getUserByAddress(tx.toAddress),
    ]);

    const [record] = await client
      .insert(transactions)
      .values({
        hash: tx.hash,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        amountUsdc: tx.amountUsdc,
        feeUsdc: tx.feeUsdc,
        note: tx.note,
        status: tx.status,
        senderId: sender?.id,
        recipientId: recipient?.id,
      })
      .returning();

    return {
      id: record.id,
      hash: record.hash ?? undefined,
      fromAddress: record.fromAddress,
      toAddress: record.toAddress,
      amountUsdc: record.amountUsdc,
      feeUsdc: record.feeUsdc,
      note: record.note ?? undefined,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
    };
  },

  async getTransactionsForAddress(address: string) {
    const rows = await client
      .select()
      .from(transactions)
      .where(or(ilike(transactions.fromAddress, address), ilike(transactions.toAddress, address)))
      .orderBy(desc(transactions.createdAt))
      .limit(200);

    return rows.map((t) => ({
      id: t.id,
      hash: t.hash ?? undefined,
      fromAddress: t.fromAddress,
      toAddress: t.toAddress,
      amountUsdc: t.amountUsdc,
      feeUsdc: t.feeUsdc,
      note: t.note ?? undefined,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }));
  },

  // ---- Push subscriptions ----------------------------------------------------

  async savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }) {
    await client
      .insert(pushSubscriptions)
      .values({ userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: sub.p256dh, auth: sub.auth },
      });
  },

  async removePushSubscription(endpoint: string) {
    await client.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  },

  async getPushSubscriptionsForUser(userId: string) {
    return client.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  },

  // ---- Rate limiting ----------------------------------------------------------
  //
  // Deliberately kept in-process rather than in Postgres: rate-limit
  // counters are extremely high-churn, short-lived, and totally fine to
  // lose on a restart. In a multi-instance production deployment, swap
  // this one function for a shared store (Upstash Redis's
  // `@upstash/ratelimit` is a drop-in) — nothing else in the app changes.

  rateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }
    if (bucket.count >= limit) {
      return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
    }
    bucket.count += 1;
    return { allowed: true, remaining: limit - bucket.count };
  },
};

import { pgTable, uuid, text, timestamp, integer, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Zendapp database schema (Drizzle ORM).
 *
 * Drizzle was chosen over an engine-based ORM (Prisma) deliberately: it
 * compiles straight to SQL over the standard `pg` driver with no native
 * binary to download at build/install time, which makes it drop-in
 * anywhere — this sandbox, serverless platforms, Docker, air-gapped CI —
 * without a postinstall step reaching out to a third-party binary host.
 *
 * To apply this schema to a fresh database:
 *   npx drizzle-kit push      # dev: push schema directly
 *   npx drizzle-kit generate  # prod: generate a versioned SQL migration
 *   npx drizzle-kit migrate   # prod: apply generated migrations
 */

export const txStatusEnum = pgEnum("tx_status", ["pending", "complete", "failed"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    walletAddress: text("wallet_address").notNull(),
    emailVerified: integer("email_verified").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
    walletIdx: uniqueIndex("users_wallet_idx").on(table.walletAddress),
  }),
);

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("verification_codes_email_idx").on(table.email),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hash: text("hash"),
    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(),
    amountUsdc: text("amount_usdc").notNull(),
    feeUsdc: text("fee_usdc").notNull(),
    note: text("note"),
    status: txStatusEnum("status").default("pending").notNull(),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
    recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hashIdx: uniqueIndex("transactions_hash_idx").on(table.hash),
    fromIdx: index("transactions_from_idx").on(table.fromAddress),
    toIdx: index("transactions_to_idx").on(table.toAddress),
  }),
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint),
    userIdx: index("push_subscriptions_user_idx").on(table.userId),
  }),
);

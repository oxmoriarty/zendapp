import { z } from "zod";

/**
 * Username rules (product spec):
 * - Globally unique, permanent, case-insensitive, stored lowercase
 * - Starts with a letter
 * - 3–20 characters
 * - Letters, numbers, underscores, periods only
 * - No spaces, no emoji
 */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "support",
  "arc",
  "zendapp",
  "system",
  "help",
  "security",
  "usdc",
  "circle",
  "root",
  "api",
  "settings",
  "wallet",
  "official",
  "moderator",
  "billing",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be 20 characters or fewer")
  .regex(/^[a-z]/, "Username must start with a letter")
  .regex(/^[a-z0-9_.]+$/, "Only letters, numbers, underscores, and periods are allowed")
  .refine((v) => !RESERVED_USERNAMES.has(v), "This username is reserved")
  .refine((v) => !v.includes(".."), "Periods can't repeat")
  .refine((v) => !v.endsWith(".") && !v.endsWith("_"), "Can't end with a period or underscore");

export type UsernameValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; error: string };

export function validateUsername(input: string): UsernameValidationResult {
  const result = usernameSchema.safeParse(input);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message ?? "Invalid username" };
  }
  return { valid: true, normalized: result.data };
}

import webpush from "web-push";
import { db } from "@/lib/server/db";

/**
 * Real Web Push (RFC 8030 / VAPID) integration. Works in any browser that
 * supports the Push API (Chrome, Edge, Firefox, and Safari 16.4+), with no
 * third-party push service dependency — the browser's own push service
 * (e.g. FCM for Chrome, APNs-backed for Safari) is used directly.
 *
 * Generate your own VAPID keypair once per deployment:
 *   npx web-push generate-vapid-keys
 * and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT in the
 * environment. A dev keypair ships in .env.example so `npm run dev` works
 * immediately, but production must use its own.
 */

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@zendapp.app";
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function notifyPaymentReceived(userId: string, opts: { fromName: string; amountUsdc: string }) {
  ensureConfigured();
  if (!configured) {
    console.log(`[zendapp:dev] push: ${userId} received $${opts.amountUsdc} from ${opts.fromName}`);
    return;
  }

  const subscriptions = await db.getPushSubscriptionsForUser(userId);
  const payload = JSON.stringify({
    title: `${opts.fromName} sent you money`,
    body: `$${opts.amountUsdc} USDC is now in your Zendapp balance.`,
    url: "/home",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err: any) {
        // 404/410 means the browser unsubscribed or the subscription expired.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.removePushSubscription(sub.endpoint);
        } else {
          console.error("[zendapp:push] send failed", err);
        }
      }
    }),
  );
}

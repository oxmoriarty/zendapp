"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

/** Convert a base64url VAPID public key into the Uint8Array applicationServerKey expects. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushSupport = "unsupported" | "unknown" | "granted" | "denied" | "default";

/**
 * Manages the browser's Push API subscription lifecycle end-to-end: service
 * worker registration, permission request, subscribing with the app's VAPID
 * public key, and persisting/removing the subscription server-side.
 */
export function usePushNotifications() {
  const [status, setStatus] = useState<PushSupport>("unknown");
  const [loading, setLoading] = useState(false);

  const supported =
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as PushSupport);
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as PushSupport);
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — push notifications are disabled.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await api.subscribePush(json);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api.unsubscribePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { status, supported, loading, enable, disable };
}

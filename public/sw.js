// Zendapp service worker — handles incoming Web Push events and click-through.
// Registered from hooks/use-push-notifications.ts.

self.addEventListener("push", (event) => {
  let data = { title: "Zendapp", body: "You have a new notification.", url: "/home" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Ignore malformed payloads rather than throwing inside the SW.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/zendapp-mark.png",
      badge: "/zendapp-mark.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

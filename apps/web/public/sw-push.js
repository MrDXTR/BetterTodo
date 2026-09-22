self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload = {
        title: "BetterTodo",
        body: "You have a new notification.",
        url: "/",
    };

    try {
        payload = event.data.json();
    } catch {
        payload.body = event.data.text() || payload.body;
    }

    const title = payload.title || "BetterTodo";
    const options = {
        body: payload.body || "You have a new notification.",
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        tag: payload.url || "bettertodo-notification",
        vibrate: [100, 50, 100],
        data: {
            url: payload.url || "/",
        },
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, options),
            self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
                for (const client of clients) {
                    client.postMessage({ type: "PUSH_RECEIVED", payload });
                }
            }),
        ]),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            const existing = clients.find((client) => "focus" in client);
            if (existing) {
                existing.navigate(targetUrl);
                return existing.focus();
            }
            return self.clients.openWindow(targetUrl);
        }),
    );
});

import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function decodeVapidKey(value: string): Uint8Array {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const subscribeMutation = useMutation(api.notifications.subscribeToPush);
    const unsubscribeMutation = useMutation(api.notifications.unsubscribeFromPush);

    const isSupported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

    const syncSubscription = useCallback(async () => {
        if (!isSupported) {
            setPermission("unsupported");
            setIsSubscribed(false);
            return;
        }

        setPermission(window.Notification.permission);

        try {
            const registration =
                (await navigator.serviceWorker.getRegistration("/")) ||
                (await navigator.serviceWorker.getRegistration());
            const subscription = await registration?.pushManager.getSubscription();
            setIsSubscribed(Boolean(subscription));
        } catch (error) {
            console.error("Failed to check push subscription:", error);
            setIsSubscribed(false);
        }
    }, [isSupported]);

    useEffect(() => {
        void syncSubscription();
    }, [syncSubscription]);

    const subscribe = async () => {
        if (!isSupported) {
            toast.error("Push notifications are not supported by your browser.");
            return;
        }

        if (typeof window !== "undefined" && !window.isSecureContext) {
            toast.error("Push notifications require a secure context (HTTPS or http://localhost).");
            return;
        }

        if (typeof window !== "undefined" && window.self !== window.top) {
            toast.error(
                "Push notifications cannot be enabled inside an embedded preview. Please open the app in a new browser tab.",
            );
            return;
        }

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            toast.error("Web Push is not configured yet (missing VAPID public key in environment).");
            return;
        }

        setIsLoading(true);
        try {
            const requestedPermission = await window.Notification.requestPermission();
            setPermission(requestedPermission);

            if (requestedPermission !== "granted") {
                toast.error("Notification permission was not granted.");
                return;
            }

            // Find existing registration or register service worker
            let registration =
                (await navigator.serviceWorker.getRegistration("/")) ||
                (await navigator.serviceWorker.getRegistration());

            if (!registration) {
                try {
                    registration = await navigator.serviceWorker.register("/sw.js", {
                        updateViaCache: "none",
                    });
                } catch (regErr) {
                    // In dev mode with VitePWA, the worker may be served under /dev-dist/sw.js
                    try {
                        registration = await navigator.serviceWorker.register("/dev-dist/sw.js", {
                            updateViaCache: "none",
                        });
                    } catch {
                        throw regErr;
                    }
                }
            }

            const activeRegistration = registration || (await navigator.serviceWorker.ready);
            let subscription = await activeRegistration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await activeRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: decodeVapidKey(vapidPublicKey) as unknown as BufferSource,
                });
            }

            const json = subscription.toJSON();
            if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
                throw new Error("Push subscription did not return required keys.");
            }

            await subscribeMutation({
                endpoint: json.endpoint,
                keys: {
                    p256dh: json.keys.p256dh,
                    auth: json.keys.auth,
                },
                userAgent: navigator.userAgent,
            });

            setIsSubscribed(true);
            toast.success("Desktop notifications enabled.");
        } catch (error: any) {
            console.error("Failed to enable push notifications:", error);

            if (
                error?.name === "SecurityError" ||
                error?.message?.toLowerCase().includes("insecure")
            ) {
                toast.error(
                    "Push notifications are blocked in private browsing or embedded frames. Please open directly in a regular browser window.",
                );
            } else {
                toast.error(
                    error?.message || "Could not enable desktop notifications. Please try again.",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            const registration =
                (await navigator.serviceWorker.getRegistration("/")) ||
                (await navigator.serviceWorker.getRegistration());
            const subscription = await registration?.pushManager.getSubscription();

            if (subscription) {
                const endpoint = subscription.endpoint;
                await subscription.unsubscribe();
                await unsubscribeMutation({ endpoint });
            }

            setIsSubscribed(false);
            toast.success("Desktop notifications disabled.");
        } catch (error) {
            console.error("Failed to disable push notifications:", error);
            toast.error("Could not disable desktop notifications.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
    };
}

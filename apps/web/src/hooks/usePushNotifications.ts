import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Convert a URL-safe base64 VAPID public key into bytes for the Push API. */
function decodeVapidKey(value: string) {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

/** Manage browser push permission, subscription state, and backend synchronization. */
export function usePushNotifications() {
    const convex = useConvex();
    const currentUser = useQuery(api.auth.getCurrentUser);
    const currentUserId = currentUser === undefined ? undefined : (currentUser?._id ?? null);
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const syncId = useRef(0);

    const subscribeMutation = useMutation(api.notifications.subscribeToPush);
    const unsubscribeMutation = useMutation(api.notifications.unsubscribeFromPush);

    const isIos =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1));

    const isStandalone =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
            Boolean((navigator as unknown as { standalone?: boolean }).standalone));

    const isIosPromptNeeded = isIos && !isStandalone;

    const isSupported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

    /** Reconcile the browser's active subscription with the signed-in backend user. */
    const syncSubscription = useCallback(async () => {
        const currentSyncId = ++syncId.current;

        if (!isSupported) {
            setPermission(isIosPromptNeeded ? "default" : "unsupported");
            setIsSubscribed(false);
            return;
        }

        setPermission(window.Notification.permission);

        try {
            const registration = await navigator.serviceWorker.getRegistration("/");
            const subscription = await registration?.pushManager.getSubscription();

            if (!subscription || !currentUserId) {
                if (currentSyncId === syncId.current) {
                    setIsSubscribed(false);
                }
                return;
            }

            const status = await convex.query(api.notifications.getPushSubscriptionStatus, {
                endpoint: subscription.endpoint,
            });

            if (status.isSubscribed) {
                if (currentSyncId === syncId.current) {
                    setIsSubscribed(true);
                }
                return;
            }

            if (currentSyncId !== syncId.current) return;

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

            if (currentSyncId === syncId.current) {
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error("Failed to check push subscription:", error);
            if (currentSyncId === syncId.current) {
                setIsSubscribed(false);
            }
        }
    }, [convex, currentUserId, isSupported, isIosPromptNeeded, subscribeMutation]);

    useEffect(() => {
        if (currentUserId === undefined) return;
        void syncSubscription();
    }, [currentUserId, syncSubscription]);

    /** Request permission and create a browser push subscription for the current user. */
    const subscribe = async () => {
        if (isIosPromptNeeded) {
            toast.info(
                "To receive push notifications on iOS, tap the Share button in Safari and choose 'Add to Home Screen'.",
            );
            return;
        }

        if (!isSupported) {
            toast.error("Push notifications are not supported by your browser.");
            return;
        }

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            toast.error(
                "Web Push is not configured yet (missing VAPID public key in environment).",
            );
            return;
        }

        ++syncId.current;
        setIsLoading(true);
        try {
            const requestedPermission = await window.Notification.requestPermission();
            setPermission(requestedPermission);

            if (requestedPermission !== "granted") {
                toast.error("Notification permission was not granted.");
                return;
            }

            await navigator.serviceWorker.register("/sw.js", {
                updateViaCache: "none",
            });

            const activeRegistration = await navigator.serviceWorker.ready;
            const subscription = await activeRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: decodeVapidKey(vapidPublicKey) as unknown as BufferSource,
            });

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
                    "Push notifications cannot be enabled in private browsing or embedded frames. Please open directly in a regular browser tab.",
                );
            } else {
                toast.error(
                    error?.message ||
                        "The notification service is still starting. Please wait a moment and try again.",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    /** Remove the current browser subscription locally and from the backend. */
    const unsubscribe = async ({ silent = false }: { silent?: boolean } = {}) => {
        if (!isSupported) return;

        ++syncId.current;
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.getRegistration("/");
            const subscription = await registration?.pushManager.getSubscription();

            if (subscription) {
                const endpoint = subscription.endpoint;
                await unsubscribeMutation({ endpoint });
                const didUnsubscribe = await subscription.unsubscribe();
                if (!didUnsubscribe) {
                    throw new Error("Browser push subscription could not be removed.");
                }
            }

            setIsSubscribed(false);
            if (!silent) {
                toast.success("Desktop notifications disabled.");
            }
        } catch (error) {
            console.error("Failed to disable push notifications:", error);
            try {
                const registration = await navigator.serviceWorker.getRegistration("/");
                const subscription = await registration?.pushManager.getSubscription();
                setIsSubscribed(Boolean(subscription));
            } catch {
                // Preserve the last known state when the browser cannot report it.
            }
            if (!silent) {
                toast.error("Could not disable desktop notifications.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isSupported,
        isIos,
        isStandalone,
        isIosPromptNeeded,
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
    };
}

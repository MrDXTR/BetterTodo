"use node";

import { v } from "convex/values";
import webpush from "web-push";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

let configured = false;

function configurePush(): boolean {
    if (configured) return true;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:support@bettertodo.com";

    if (!publicKey || !privateKey) {
        return false;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
}

export const sendPushToUser = internalAction({
    args: {
        userId: v.string(),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!configurePush()) {
            return { sent: 0, skipped: true };
        }

        const subscriptions = (await ctx.runQuery(
            internal.notifications.getSubscriptionsForUserInternal,
            { userId: args.userId },
        )) as Array<{
            _id: string;
            endpoint: string;
            keys: { p256dh: string; auth: string };
        }>;

        if (!subscriptions || subscriptions.length === 0) {
            return { sent: 0 };
        }

        const payload = JSON.stringify({
            title: args.title,
            body: args.body,
            url: args.url || "/",
        });

        let sentCount = 0;

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys.p256dh,
                            auth: sub.keys.auth,
                        },
                    },
                    payload,
                );
                sentCount++;
            } catch (err: any) {
                const statusCode = err?.statusCode || err?.status;
                if (statusCode === 404 || statusCode === 410) {
                    await ctx.runMutation(internal.notifications.removePushSubscriptionInternal, {
                        endpoint: sub.endpoint,
                    });
                } else {
                    console.error("Failed to send web push notification:", err);
                }
            }
        }

        return { sent: sentCount };
    },
});

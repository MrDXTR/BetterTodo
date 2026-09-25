import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { validatePushEndpoint } from "./lib/pushEndpoints";

// ============================================
// QUERIES
// ============================================

/**
 * Get all notifications for the current user
 */
export const getAll = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user_time", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(50);

        return notifications;
    },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
            .collect();

        return unread.length;
    },
});

/**
 * Report whether the signed-in user owns the supplied endpoint, or has any subscription when the
 * endpoint is omitted. Unauthenticated callers receive `{ isSubscribed: false }`.
 */
export const getPushSubscriptionStatus = query({
    args: { endpoint: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return { isSubscribed: false };

        const targetEndpoint = args.endpoint;
        if (targetEndpoint) {
            const sub = await ctx.db
                .query("pushSubscriptions")
                .withIndex("by_endpoint", (q) => q.eq("endpoint", targetEndpoint))
                .first();
            return { isSubscribed: !!sub && sub.userId === user._id };
        }

        const anySub = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return { isSubscribed: !!anySub };
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");

        if (notification.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.notificationId, { read: true });

        return { success: true };
    },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
            .collect();

        for (const notification of unread) {
            await ctx.db.patch(notification._id, { read: true });
        }

        return { success: true, count: unread.length };
    },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");

        if (notification.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.delete(args.notificationId);

        return { success: true };
    },
});

/**
 * Create or update a browser push subscription for the signed-in user.
 *
 * @throws {Error} If the caller is unauthenticated or the endpoint is invalid or unsupported.
 */
export const subscribeToPush = mutation({
    args: {
        endpoint: v.string(),
        keys: v.object({
            p256dh: v.string(),
            auth: v.string(),
        }),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        validatePushEndpoint(args.endpoint);

        const existing = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .first();

        const now = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, {
                userId: user._id,
                keys: args.keys,
                userAgent: args.userAgent,
            });
            return existing._id;
        }

        return await ctx.db.insert("pushSubscriptions", {
            userId: user._id,
            endpoint: args.endpoint,
            keys: args.keys,
            userAgent: args.userAgent,
            createdAt: now,
        });
    },
});

/**
 * Delete the signed-in user's subscriptions for an endpoint, succeeding when none exist.
 *
 * @throws {Error} If the caller is unauthenticated.
 */
export const unsubscribeFromPush = mutation({
    args: {
        endpoint: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const subs = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .collect();

        for (const sub of subs) {
            if (sub.userId === user._id) {
                await ctx.db.delete(sub._id);
            }
        }

        return { success: true };
    },
});

// ============================================
// INTERNAL HELPERS
// ============================================

/** Return all stored push subscriptions for a user. */
export const getSubscriptionsForUserInternal = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

/** Delete every stored push subscription matching an endpoint. */
export const removePushSubscriptionInternal = internalMutation({
    args: { endpoint: v.string() },
    handler: async (ctx, args) => {
        const subs = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
            .collect();

        for (const sub of subs) {
            await ctx.db.delete(sub._id);
        }
    },
});

/** Create an in-app notification and schedule a matching push notification. */
export const create = internalMutation({
    args: {
        userId: v.string(),
        type: v.string(),
        title: v.string(),
        message: v.string(),
        linkUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const notificationId = await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            title: args.title,
            message: args.message,
            linkUrl: args.linkUrl,
            read: false,
            createdAt: Date.now(),
        });

        await ctx.scheduler.runAfter(0, internal.push.sendPushToUser, {
            userId: args.userId,
            title: args.title,
            body: args.message,
            url: args.linkUrl,
        });

        return await ctx.db.get(notificationId);
    },
});

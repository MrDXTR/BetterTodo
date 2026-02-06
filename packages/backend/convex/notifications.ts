import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

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
 * Create a notification (internal helper)
 */
export const create = mutation({
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

        return await ctx.db.get(notificationId);
    },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// QUERIES
// ============================================

/**
 * Get comments for a card
 */
export const getByCard = query({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", card.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) throw new Error("Access denied");

        const comments = await ctx.db
            .query("comments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        // Sort by creation time (oldest first)
        comments.sort((a, b) => a.createdAt - b.createdAt);

        return comments;
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Add a comment to a card
 */
export const create = mutation({
    args: {
        cardId: v.id("cards"),
        content: v.string(),
        parentCommentId: v.optional(v.id("comments")),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", card.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) throw new Error("Access denied");

        const now = Date.now();
        const commentId = await ctx.db.insert("comments", {
            cardId: args.cardId,
            userId: user._id,
            content: args.content,
            parentCommentId: args.parentCommentId,
            edited: false,
            createdAt: now,
            updatedAt: now,
        });

        // ── @mention detection ─────────────────────────────────────────────────
        // Parse all @Name mentions from the comment content
        const mentionRegex = /@([\w][\w\s]*?)(?=\s|$|[^a-zA-Z0-9\s])/g;
        const mentionMatches = [...args.content.matchAll(mentionRegex)];

        if (mentionMatches.length > 0) {
            // Get all board members
            const members = await ctx.db
                .query("boardMembers")
                .withIndex("by_board", (q) => q.eq("boardId", card.boardId))
                .collect();

            const commenter = await authComponent.getAnyUserById(ctx, user._id);
            const commenterName = commenter?.name ?? commenter?.email ?? "Someone";

            // Collect unique userIds to notify (exclude the commenter)
            const notifiedUserIds = new Set<string>();

            for (const match of mentionMatches) {
                const mentionedName = match[1].trim().toLowerCase();

                for (const member of members) {
                    // Skip the commenter themselves
                    if (member.userId === user._id) continue;
                    if (notifiedUserIds.has(member.userId)) continue;

                    const memberUser = await authComponent.getAnyUserById(ctx, member.userId);
                    if (!memberUser) continue;

                    const memberName = memberUser.name ?? memberUser.email ?? "";
                    if (memberName.toLowerCase().includes(mentionedName)) {
                        notifiedUserIds.add(member.userId);

                        // Create in-app notification
                        await ctx.db.insert("notifications", {
                            userId: member.userId,
                            type: "mention",
                            title: "You were mentioned",
                            message: `${commenterName} mentioned you in "${card.title}"`,
                            linkUrl: `/boards/${card.boardId}?card=${args.cardId}`,
                            read: false,
                            createdAt: now,
                        });
                    }
                }
            }
        }

        return await ctx.db.get(commentId);
    },
});

/**
 * Update a comment
 */
export const update = mutation({
    args: {
        commentId: v.id("comments"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        // Only the comment author can edit it
        if (comment.userId !== user._id) {
            throw new Error("You can only edit your own comments");
        }

        await ctx.db.patch(args.commentId, {
            content: args.content,
            edited: true,
            updatedAt: Date.now(),
        });

        return await ctx.db.get(args.commentId);
    },
});

/**
 * Delete a comment
 */
export const deleteComment = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        const card = await ctx.db.get(comment.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user is the comment author or has admin/owner role
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", card.boardId).eq("userId", user._id)
            )
            .first();

        const canDelete =
            comment.userId === user._id ||
            (membership && ["owner", "admin"].includes(membership.role));

        if (!canDelete) {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.delete(args.commentId);


        return { success: true };
    },
});

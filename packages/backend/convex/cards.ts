import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// QUERIES
// ============================================

/**
 * Get a single card by ID with all details
 */
export const getById = query({
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

        // Get card labels
        const cardLabelLinks = await ctx.db
            .query("cardLabels")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        const labels = await Promise.all(
            cardLabelLinks.map((link) => ctx.db.get(link.labelId))
        );

        // Get assignments
        const assignments = await ctx.db
            .query("cardAssignments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        // Get checklists
        const checklists = await ctx.db
            .query("checklists")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        const checklistsWithItems = await Promise.all(
            checklists.map(async (checklist) => {
                const items = await ctx.db
                    .query("checklistItems")
                    .withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
                    .collect();
                items.sort((a, b) => a.position - b.position);
                return { ...checklist, items };
            })
        );

        return {
            ...card,
            labels: labels.filter((l) => l !== null),
            assignments,
            checklists: checklistsWithItems,
        };
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new card
 */
export const create = mutation({
    args: {
        listId: v.id("lists"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const list = await ctx.db.get(args.listId);
        if (!list) throw new Error("List not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", list.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // Get the current max position in this list
        const existingCards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q) => q.eq("listId", args.listId))
            .collect();

        const maxPosition = existingCards.reduce(
            (max, card) => Math.max(max, card.position),
            -1
        );

        const now = Date.now();
        const cardId = await ctx.db.insert("cards", {
            listId: args.listId,
            boardId: list.boardId,
            title: args.title,
            position: maxPosition + 1,
            createdBy: user._id,
            archived: false,
            completed: false,
            createdAt: now,
            updatedAt: now,
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: list.boardId,
            cardId,
            userId: user._id,
            actionType: "card_created",
            details: { title: args.title, listId: args.listId },
            createdAt: now,
        });

        return await ctx.db.get(cardId);
    },
});

/**
 * Update card properties
 */
export const update = mutation({
    args: {
        cardId: v.id("cards"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        dueDate: v.optional(v.number()),
        priority: v.optional(
            v.union(
                v.literal("low"),
                v.literal("medium"),
                v.literal("high"),
                v.literal("urgent")
            )
        ),
        estimatedHours: v.optional(v.number()),
        actualHours: v.optional(v.number()),
        completed: v.optional(v.boolean()),
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

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        const updates: any = { updatedAt: Date.now() };
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
        if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
        if (args.priority !== undefined) updates.priority = args.priority;
        if (args.estimatedHours !== undefined) updates.estimatedHours = args.estimatedHours;
        if (args.actualHours !== undefined) updates.actualHours = args.actualHours;
        if (args.completed !== undefined) updates.completed = args.completed;

        await ctx.db.patch(args.cardId, updates);

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: args.cardId,
            userId: user._id,
            actionType: "card_updated",
            details: updates,
            createdAt: Date.now(),
        });

        return await ctx.db.get(args.cardId);
    },
});

/**
 * Move card to a different list and/or position
 */
export const move = mutation({
    args: {
        cardId: v.id("cards"),
        targetListId: v.id("lists"),
        newPosition: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        const targetList = await ctx.db.get(args.targetListId);
        if (!targetList) throw new Error("Target list not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", card.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        const oldListId = card.listId;
        const oldPosition = card.position;

        // If moving to a different list
        if (oldListId !== args.targetListId) {
            // Update positions in the old list
            const oldListCards = await ctx.db
                .query("cards")
                .withIndex("by_list", (q) => q.eq("listId", oldListId))
                .filter((q) => q.eq(q.field("archived"), false))
                .collect();

            for (const c of oldListCards) {
                if (c._id !== args.cardId && c.position > oldPosition) {
                    await ctx.db.patch(c._id, { position: c.position - 1 });
                }
            }

            // Update positions in the new list
            const newListCards = await ctx.db
                .query("cards")
                .withIndex("by_list", (q) => q.eq("listId", args.targetListId))
                .filter((q) => q.eq(q.field("archived"), false))
                .collect();

            for (const c of newListCards) {
                if (c.position >= args.newPosition) {
                    await ctx.db.patch(c._id, { position: c.position + 1 });
                }
            }

            // Update the card
            await ctx.db.patch(args.cardId, {
                listId: args.targetListId,
                position: args.newPosition,
                updatedAt: Date.now(),
            });
        } else {
            // Moving within the same list
            const listCards = await ctx.db
                .query("cards")
                .withIndex("by_list", (q) => q.eq("listId", oldListId))
                .filter((q) => q.eq(q.field("archived"), false))
                .collect();

            for (const c of listCards) {
                if (c._id === args.cardId) {
                    await ctx.db.patch(c._id, { position: args.newPosition, updatedAt: Date.now() });
                } else if (oldPosition < args.newPosition) {
                    // Moving down
                    if (c.position > oldPosition && c.position <= args.newPosition) {
                        await ctx.db.patch(c._id, { position: c.position - 1 });
                    }
                } else if (oldPosition > args.newPosition) {
                    // Moving up
                    if (c.position >= args.newPosition && c.position < oldPosition) {
                        await ctx.db.patch(c._id, { position: c.position + 1 });
                    }
                }
            }
        }

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: args.cardId,
            userId: user._id,
            actionType: "card_moved",
            details: {
                oldListId,
                newListId: args.targetListId,
                oldPosition,
                newPosition: args.newPosition,
            },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Archive a card
 */
export const archive = mutation({
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

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.patch(args.cardId, {
            archived: true,
            updatedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: args.cardId,
            userId: user._id,
            actionType: "card_archived",
            details: { title: card.title },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Restore an archived card
 */
export const restore = mutation({
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

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.patch(args.cardId, {
            archived: false,
            updatedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: args.cardId,
            userId: user._id,
            actionType: "card_restored",
            details: { title: card.title },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Duplicate a card
 */
export const duplicate = mutation({
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

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // Get the current max position in the list
        const existingCards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q) => q.eq("listId", card.listId))
            .collect();

        const maxPosition = existingCards.reduce(
            (max, c) => Math.max(max, c.position),
            -1
        );

        const { _id, _creationTime, ...cardData } = card;

        const now = Date.now();
        const newCardId = await ctx.db.insert("cards", {
            ...cardData,
            title: `${card.title} (Copy)`,
            position: maxPosition + 1,
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: newCardId,
            userId: user._id,
            actionType: "card_duplicated",
            details: { originalCardId: args.cardId, title: card.title },
            createdAt: now,
        });

        return await ctx.db.get(newCardId);
    },
});

/**
 * Delete a card
 */
export const deleteCard = mutation({
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

        if (!membership || !["owner", "admin", "member"].includes(membership.role)) {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.delete(args.cardId);

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            userId: user._id,
            actionType: "card_deleted",
            details: { cardId: args.cardId, title: card.title },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Assign a user to a card
 */
export const assignUser = mutation({
    args: {
        cardId: v.id("cards"),
        userId: v.string(),
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

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // Check if already assigned
        const existing = await ctx.db
            .query("cardAssignments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();

        if (existing) {
            throw new Error("User already assigned to this card");
        }

        const now = Date.now();
        await ctx.db.insert("cardAssignments", {
            cardId: args.cardId,
            userId: args.userId,
            assignedAt: now,
            assignedBy: user._id,
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: args.cardId,
            userId: user._id,
            actionType: "user_assigned",
            details: { assignedUserId: args.userId },
            createdAt: now,
        });

        return { success: true };
    },
});

/**
 * Unassign a user from a card
 */
export const unassignUser = mutation({
    args: {
        cardId: v.id("cards"),
        userId: v.string(),
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

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        const assignment = await ctx.db
            .query("cardAssignments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();

        if (!assignment) {
            throw new Error("User not assigned to this card");
        }

        await ctx.db.delete(assignment._id);

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: card.boardId,
            cardId: args.cardId,
            userId: user._id,
            actionType: "user_unassigned",
            details: { unassignedUserId: args.userId },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

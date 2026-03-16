import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { ensureBoardReadAccessForQuery } from "./permissions";

// ============================================
// QUERIES
// ============================================

/**
 * Get all checklists for a card
 */
export const getByCard = query({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Allow public/anonymous read for public boards,
        // while enforcing normal access rules otherwise.
        await ensureBoardReadAccessForQuery(ctx, card.boardId);

        const checklists = await ctx.db
            .query("checklists")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        // Get items for each checklist
        const checklistsWithItems = await Promise.all(
            checklists.map(async (checklist) => {
                const items = await ctx.db
                    .query("checklistItems")
                    .withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
                    .collect();

                return {
                    ...checklist,
                    items: items.sort((a, b) => a.position - b.position),
                };
            }),
        );

        return checklistsWithItems.sort((a, b) => a.position - b.position);
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new checklist
 */
export const create = mutation({
    args: {
        cardId: v.id("cards"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // Get max position
        const existingChecklists = await ctx.db
            .query("checklists")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        const maxPosition = Math.max(0, ...existingChecklists.map((c) => c.position));

        const checklistId = await ctx.db.insert("checklists", {
            cardId: args.cardId,
            title: args.title,
            position: maxPosition + 1,
        });

        return await ctx.db.get(checklistId);
    },
});

/**
 * Delete a checklist
 */
export const deleteChecklist = mutation({
    args: { checklistId: v.id("checklists") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const checklist = await ctx.db.get(args.checklistId);
        if (!checklist) throw new Error("Checklist not found");

        const card = await ctx.db.get(checklist.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // Delete all items
        const items = await ctx.db
            .query("checklistItems")
            .withIndex("by_checklist", (q) => q.eq("checklistId", args.checklistId))
            .collect();

        for (const item of items) {
            await ctx.db.delete(item._id);
        }

        await ctx.db.delete(args.checklistId);

        return { success: true };
    },
});

/**
 * Create a checklist item
 */
export const createItem = mutation({
    args: {
        checklistId: v.id("checklists"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const checklist = await ctx.db.get(args.checklistId);
        if (!checklist) throw new Error("Checklist not found");

        const card = await ctx.db.get(checklist.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // Get max position
        const existingItems = await ctx.db
            .query("checklistItems")
            .withIndex("by_checklist", (q) => q.eq("checklistId", args.checklistId))
            .collect();

        const maxPosition = Math.max(0, ...existingItems.map((i) => i.position));

        const itemId = await ctx.db.insert("checklistItems", {
            checklistId: args.checklistId,
            title: args.title,
            completed: false,
            position: maxPosition + 1,
        });

        return await ctx.db.get(itemId);
    },
});

/**
 * Update a checklist item
 */
export const updateItem = mutation({
    args: {
        itemId: v.id("checklistItems"),
        title: v.optional(v.string()),
        completed: v.optional(v.boolean()),
        assignedTo: v.optional(v.string()),
        dueDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error("Item not found");

        const checklist = await ctx.db.get(item.checklistId);
        if (!checklist) throw new Error("Checklist not found");

        const card = await ctx.db.get(checklist.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.completed !== undefined) updates.completed = args.completed;
        if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
        if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

        await ctx.db.patch(args.itemId, updates);

        return await ctx.db.get(args.itemId);
    },
});

/**
 * Delete a checklist item
 */
export const deleteItem = mutation({
    args: { itemId: v.id("checklistItems") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error("Item not found");

        const checklist = await ctx.db.get(item.checklistId);
        if (!checklist) throw new Error("Checklist not found");

        const card = await ctx.db.get(checklist.cardId);
        if (!card) throw new Error("Card not found");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.delete(args.itemId);

        return { success: true };
    },
});

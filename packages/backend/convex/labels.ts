import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { ensureBoardReadAccessForQuery, ensureBoardRole } from "./permissions";

// ============================================
// QUERIES
// ============================================

/**
 * Get all labels for a board
 */
export const getByBoard = query({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        await ensureBoardReadAccessForQuery(ctx, args.boardId);

        return await ctx.db
            .query("labels")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new label
 */
export const create = mutation({
    args: {
        boardId: v.id("boards"),
        name: v.string(),
        color: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureBoardRole(ctx, args.boardId, "member");

        const labelId = await ctx.db.insert("labels", {
            boardId: args.boardId,
            name: args.name,
            color: args.color,
        });

        return await ctx.db.get(labelId);
    },
});

/**
 * Update a label
 */
export const update = mutation({
    args: {
        labelId: v.id("labels"),
        name: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const label = await ctx.db.get(args.labelId);
        if (!label) throw new Error("Label not found");

        await ensureBoardRole(ctx, label.boardId, "member");

        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.color !== undefined) updates.color = args.color;

        await ctx.db.patch(args.labelId, updates);

        return await ctx.db.get(args.labelId);
    },
});

/**
 * Delete a label
 */
export const deleteLabel = mutation({
    args: { labelId: v.id("labels") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const label = await ctx.db.get(args.labelId);
        if (!label) throw new Error("Label not found");

        await ensureBoardRole(ctx, label.boardId, "admin");

        // Remove all card-label associations
        const cardLabels = await ctx.db
            .query("cardLabels")
            .withIndex("by_label", (q) => q.eq("labelId", args.labelId))
            .collect();

        for (const cardLabel of cardLabels) {
            await ctx.db.delete(cardLabel._id);
        }

        await ctx.db.delete(args.labelId);

        return { success: true };
    },
});

/**
 * Add a label to a card
 */
export const addToCard = mutation({
    args: {
        cardId: v.id("cards"),
        labelId: v.id("labels"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        await ensureBoardRole(ctx, card.boardId, "member");

        // Check if label already added
        const existing = await ctx.db
            .query("cardLabels")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .filter((q) => q.eq(q.field("labelId"), args.labelId))
            .first();

        if (existing) {
            throw new Error("Label already added to this card");
        }

        await ctx.db.insert("cardLabels", {
            cardId: args.cardId,
            labelId: args.labelId,
        });

        return { success: true };
    },
});

/**
 * Remove a label from a card
 */
export const removeFromCard = mutation({
    args: {
        cardId: v.id("cards"),
        labelId: v.id("labels"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        await ensureBoardRole(ctx, card.boardId, "member");

        const cardLabel = await ctx.db
            .query("cardLabels")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .filter((q) => q.eq(q.field("labelId"), args.labelId))
            .first();

        if (!cardLabel) {
            throw new Error("Label not found on this card");
        }

        await ctx.db.delete(cardLabel._id);

        return { success: true };
    },
});

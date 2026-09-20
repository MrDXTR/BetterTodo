import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ensureBoardRole, ensureListWriteAccess } from "./permissions";

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new list
 */
export const create = mutation({
    args: {
        boardId: v.id("boards"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureBoardRole(ctx, args.boardId, "member");

        // Get the current max position
        const existingLists = await ctx.db
            .query("lists")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();

        const maxPosition = existingLists.reduce((max, list) => Math.max(max, list.position), -1);

        const now = Date.now();
        const listId = await ctx.db.insert("lists", {
            boardId: args.boardId,
            title: args.title,
            position: maxPosition + 1,
            archived: false,
            createdAt: now,
        });

        return await ctx.db.get(listId);
    },
});

/**
 * Update list title or settings
 */
export const update = mutation({
    args: {
        listId: v.id("lists"),
        title: v.optional(v.string()),
        cardLimit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ensureListWriteAccess(ctx, args.listId, "member");

        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.cardLimit !== undefined) updates.cardLimit = args.cardLimit;

        await ctx.db.patch(args.listId, updates);

        return await ctx.db.get(args.listId);
    },
});

/**
 * Update list title (convenience wrapper)
 */
export const updateTitle = mutation({
    args: {
        listId: v.id("lists"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureListWriteAccess(ctx, args.listId, "member");
        await ctx.db.patch(args.listId, { title: args.title });
        return await ctx.db.get(args.listId);
    },
});

/**
 * Update list position (for drag and drop reordering)
 */
export const updatePosition = mutation({
    args: {
        listId: v.id("lists"),
        newPosition: v.number(),
    },
    handler: async (ctx, args) => {
        const { list } = await ensureListWriteAccess(ctx, args.listId, "member");

        const oldPosition = list.position;

        // Get all lists in the board
        const allLists = await ctx.db
            .query("lists")
            .withIndex("by_board", (q) => q.eq("boardId", list.boardId))
            .filter((q) => q.eq(q.field("archived"), false))
            .collect();

        // Update positions
        for (const l of allLists) {
            if (l._id === args.listId) {
                // Update the moved list
                await ctx.db.patch(l._id, { position: args.newPosition });
            } else if (oldPosition < args.newPosition) {
                // Moving right: shift lists between old and new position left
                if (l.position > oldPosition && l.position <= args.newPosition) {
                    await ctx.db.patch(l._id, { position: l.position - 1 });
                }
            } else if (oldPosition > args.newPosition) {
                // Moving left: shift lists between new and old position right
                if (l.position >= args.newPosition && l.position < oldPosition) {
                    await ctx.db.patch(l._id, { position: l.position + 1 });
                }
            }
        }

        return { success: true };
    },
});

/**
 * Duplicate a list and all its cards
 */
export const duplicate = mutation({
    args: { listId: v.id("lists") },
    handler: async (ctx, args) => {
        const { user, list } = await ensureListWriteAccess(ctx, args.listId, "member");

        // Get max position of lists on the board
        const existingLists = await ctx.db
            .query("lists")
            .withIndex("by_board", (q) => q.eq("boardId", list.boardId))
            .filter((q) => q.eq(q.field("archived"), false))
            .collect();

        const maxPosition = existingLists.reduce((max, l) => Math.max(max, l.position), -1);

        const now = Date.now();
        const newListId = await ctx.db.insert("lists", {
            boardId: list.boardId,
            title: `${list.title} (Copy)`,
            position: maxPosition + 1,
            cardLimit: list.cardLimit,
            archived: false,
            createdAt: now,
        });

        // Duplicate all non-archived cards in this list
        const cards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q) => q.eq("listId", args.listId))
            .filter((q) => q.eq(q.field("archived"), false))
            .collect();

        for (const card of cards) {
            const { _id: oldCardId, _creationTime, ...cardData } = card;
            const newCardId = await ctx.db.insert("cards", {
                ...cardData,
                listId: newListId,
                createdBy: user._id,
                createdAt: now,
                updatedAt: now,
            });

            // Duplicate checklists
            const checklists = await ctx.db
                .query("checklists")
                .withIndex("by_card", (q) => q.eq("cardId", oldCardId))
                .collect();

            for (const cl of checklists) {
                const newClId = await ctx.db.insert("checklists", {
                    cardId: newCardId,
                    title: cl.title,
                    position: cl.position,
                });

                const items = await ctx.db
                    .query("checklistItems")
                    .withIndex("by_checklist", (q) => q.eq("checklistId", cl._id))
                    .collect();

                for (const item of items) {
                    await ctx.db.insert("checklistItems", {
                        checklistId: newClId,
                        title: item.title,
                        position: item.position,
                        completed: item.completed,
                        dueDate: item.dueDate,
                        assignedTo: item.assignedTo,
                    });
                }
            }

            // Duplicate card label links
            const cardLabels = await ctx.db
                .query("cardLabels")
                .withIndex("by_card", (q) => q.eq("cardId", oldCardId))
                .collect();

            for (const cl of cardLabels) {
                await ctx.db.insert("cardLabels", {
                    cardId: newCardId,
                    labelId: cl.labelId,
                });
            }
        }

        return await ctx.db.get(newListId);
    },
});

/**
 * Archive a list
 */
export const archive = mutation({
    args: { listId: v.id("lists") },
    handler: async (ctx, args) => {
        await ensureListWriteAccess(ctx, args.listId, "member");

        await ctx.db.patch(args.listId, { archived: true });

        return { success: true };
    },
});

/**
 * Delete a list and all its cards
 */
export const deleteList = mutation({
    args: { listId: v.id("lists") },
    handler: async (ctx, args) => {
        await ensureListWriteAccess(ctx, args.listId, "admin");

        // Delete all cards in this list
        const cards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q) => q.eq("listId", args.listId))
            .collect();

        for (const card of cards) {
            await ctx.db.delete(card._id);
        }

        // Delete the list
        await ctx.db.delete(args.listId);

        return { success: true };
    },
});

/**
 * Restore an archived list
 */
export const restore = mutation({
    args: { listId: v.id("lists") },
    handler: async (ctx, args) => {
        await ensureListWriteAccess(ctx, args.listId, "member");

        await ctx.db.patch(args.listId, { archived: false });

        return { success: true };
    },
});


import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { ensureCardReadAccess, ensureCardWriteAccess, ensureListWriteAccess } from "./permissions";

// ============================================
// QUERIES
// ============================================

/**
 * Get a single card by ID with all details
 */
export const getById = query({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const { card } = await ensureCardReadAccess(ctx, args.cardId);

        // Get card labels
        const cardLabelLinks = await ctx.db
            .query("cardLabels")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        const labels = await Promise.all(cardLabelLinks.map((link) => ctx.db.get(link.labelId)));

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
            }),
        );

        const customFields = await ctx.db
            .query("customFields")
            .withIndex("by_board", (q) => q.eq("boardId", card.boardId))
            .collect();
        customFields.sort((a, b) => a.position - b.position);

        const customValues = await ctx.db
            .query("cardCustomFieldValues")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();
        const valueByField = new Map(customValues.map((value) => [value.fieldId, value]));

        return {
            ...card,
            labels: labels.filter((l) => l !== null),
            assignments,
            checklists: checklistsWithItems,
            customFields: customFields.map((field) => ({
                ...field,
                value: valueByField.get(field._id) ?? null,
            })),
        };
    },
});

/**
 * Get all assignments for a card
 */
export const getAssignments = query({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        await ensureCardReadAccess(ctx, args.cardId);

        return await ctx.db
            .query("cardAssignments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();
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
        const { user, list } = await ensureListWriteAccess(ctx, args.listId, "member");

        // Get the current max position in this list
        const existingCards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q) => q.eq("listId", args.listId))
            .collect();

        const maxPosition = existingCards.reduce((max, card) => Math.max(max, card.position), -1);

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
            v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
        ),
        estimatedHours: v.optional(v.number()),
        actualHours: v.optional(v.number()),
        completed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await ensureCardWriteAccess(ctx, args.cardId, "member");

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
        const { card } = await ensureCardWriteAccess(ctx, args.cardId, "member");

        const targetList = await ctx.db.get(args.targetListId);
        if (!targetList) throw new Error("Target list not found");

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
                    await ctx.db.patch(c._id, {
                        position: args.newPosition,
                        updatedAt: Date.now(),
                    });
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

        return { success: true };
    },
});

/**
 * Archive a card
 */
export const archive = mutation({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        await ensureCardWriteAccess(ctx, args.cardId, "member");

        await ctx.db.patch(args.cardId, {
            archived: true,
            updatedAt: Date.now(),
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
        await ensureCardWriteAccess(ctx, args.cardId, "member");

        await ctx.db.patch(args.cardId, {
            archived: false,
            updatedAt: Date.now(),
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
        const { user, card } = await ensureCardWriteAccess(ctx, args.cardId, "member");

        // Get the current max position in the list
        const existingCards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q) => q.eq("listId", card.listId))
            .collect();

        const maxPosition = existingCards.reduce((max, c) => Math.max(max, c.position), -1);

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

        return await ctx.db.get(newCardId);
    },
});

/**
 * Delete a card
 */
export const deleteCard = mutation({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const { card } = await ensureCardWriteAccess(ctx, args.cardId, "member");

        // Delete all attachments and their storage files
        const attachments = await ctx.db
            .query("attachments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        for (const attachment of attachments) {
            await ctx.storage.delete(attachment.storageId);
            await ctx.db.delete(attachment._id);
        }

        // Delete the cover image storage if it exists and isn't from an attachment
        if (card.coverStorageId) {
            // Only delete if not already deleted as part of attachments
            const stillExists = attachments.every((a) => a.storageId !== card.coverStorageId);
            if (stillExists) {
                try {
                    await ctx.storage.delete(card.coverStorageId);
                } catch {
                    // Storage file may already be deleted
                }
            }
        }

        await ctx.db.delete(args.cardId);

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
        const { user, card } = await ensureCardWriteAccess(ctx, args.cardId, "member");

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

        // NOTIFICATIONS LOGIC
        if (args.userId !== user._id) {
            const assignedUser = await authComponent.getAnyUserById(ctx, args.userId);
            const assignerUser = await authComponent.getAnyUserById(ctx, user._id);
            const board = await ctx.db.get(card.boardId);

            const assignerName = assignerUser?.name ?? assignerUser?.email ?? "Someone";

            if (assignedUser) {
                // In-app notification
                await ctx.db.insert("notifications", {
                    userId: args.userId,
                    type: "assignment",
                    title: "New Assignment",
                    message: `${assignerName} assigned you to "${card.title}"`,
                    linkUrl: `/boards/${card.boardId}?card=${args.cardId}`,
                    read: false,
                    createdAt: now,
                });

                // Email notification
                if (assignedUser.email) {
                    await ctx.scheduler.runAfter(0, internal.emails.sendCardAssignmentEmail, {
                        to: assignedUser.email,
                        recipientName: assignedUser.name ?? undefined,
                        assignerName,
                        cardTitle: card.title,
                        boardTitle: board?.title ?? "a board",
                        boardId: card.boardId,
                        cardId: args.cardId,
                    });
                }
            }
        }

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
        await ensureCardWriteAccess(ctx, args.cardId, "member");

        const assignment = await ctx.db
            .query("cardAssignments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();

        if (!assignment) {
            throw new Error("User not assigned to this card");
        }

        await ctx.db.delete(assignment._id);

        return { success: true };
    },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { ensureBoardReadAccessForQuery } from "./permissions";

// ============================================
// QUERIES
// ============================================

/**
 * Get all attachments for a card with resolved URLs
 */
export const getByCard = query({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Allow public/anonymous read for public boards,
        // while enforcing normal access rules otherwise.
        await ensureBoardReadAccessForQuery(ctx, card.boardId);

        const attachments = await ctx.db
            .query("attachments")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        // Resolve storage URLs
        return Promise.all(
            attachments.map(async (attachment) => ({
                ...attachment,
                url: await ctx.storage.getUrl(attachment.storageId),
            })),
        );
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Add a new attachment to a card
 */
export const addAttachment = mutation({
    args: {
        cardId: v.id("cards"),
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Check board membership
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        const now = Date.now();
        const attachmentId = await ctx.db.insert("attachments", {
            cardId: args.cardId,
            uploadedBy: user._id,
            fileName: args.fileName,
            storageId: args.storageId,
            fileSize: args.fileSize,
            mimeType: args.mimeType,
            createdAt: now,
        });

        return await ctx.db.get(attachmentId);
    },
});

/**
 * Delete an attachment and its storage file
 */
export const deleteAttachment = mutation({
    args: { attachmentId: v.id("attachments") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const attachment = await ctx.db.get(args.attachmentId);
        if (!attachment) throw new Error("Attachment not found");

        const card = await ctx.db.get(attachment.cardId);
        if (!card) throw new Error("Card not found");

        // Check board membership
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        // If this attachment is the card's cover, remove it
        if (card.coverStorageId && card.coverStorageId === attachment.storageId) {
            await ctx.db.patch(card._id, {
                coverImage: undefined,
                coverStorageId: undefined,
            });
        }

        // Delete from storage
        await ctx.storage.delete(attachment.storageId);

        // Delete the DB record
        await ctx.db.delete(args.attachmentId);

        return { success: true };
    },
});

/**
 * Set an attachment image as the card's cover
 */
export const setAsCover = mutation({
    args: {
        cardId: v.id("cards"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Check board membership
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("File not found in storage");

        await ctx.db.patch(args.cardId, {
            coverImage: url,
            coverStorageId: args.storageId,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Remove the card's cover image
 */
export const removeCover = mutation({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        // Check board membership
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", card.boardId).eq("userId", user._id))
            .first();

        if (!membership || membership.role === "viewer") {
            throw new Error("Insufficient permissions");
        }

        await ctx.db.patch(args.cardId, {
            coverImage: undefined,
            coverStorageId: undefined,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

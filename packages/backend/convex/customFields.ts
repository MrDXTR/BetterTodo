import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
    ensureBoardReadAccess,
    ensureBoardReadAccessForQuery,
    ensureBoardWriteAccess,
    requireAuth,
} from "./permissions";

const customFieldType = v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("date"),
    v.literal("select"),
    v.literal("checkbox"),
);

export const getByBoard = query({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        await ensureBoardReadAccessForQuery(ctx, args.boardId);

        const fields = await ctx.db
            .query("customFields")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();

        fields.sort((a, b) => a.position - b.position);
        return fields;
    },
});

export const getForCard = query({
    args: { cardId: v.id("cards") },
    handler: async (ctx, args) => {
        const card = await ctx.db.get(args.cardId);
        if (!card) {
            throw new ConvexError("Card not found");
        }

        await ensureBoardReadAccessForQuery(ctx, card.boardId);

        const fields = await ctx.db
            .query("customFields")
            .withIndex("by_board", (q) => q.eq("boardId", card.boardId))
            .collect();

        fields.sort((a, b) => a.position - b.position);

        const values = await ctx.db
            .query("cardCustomFieldValues")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();

        const valueByFieldId = new Map(values.map((value) => [value.fieldId, value]));

        return fields.map((field) => ({
            ...field,
            value: valueByFieldId.get(field._id) ?? null,
        }));
    },
});

export const create = mutation({
    args: {
        boardId: v.id("boards"),
        name: v.string(),
        type: customFieldType,
        required: v.optional(v.boolean()),
        options: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const { user } = await ensureBoardWriteAccess(ctx, args.boardId);

        const existing = await ctx.db
            .query("customFields")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();

        const maxPosition = existing.reduce((max, field) => Math.max(max, field.position), -1);

        const now = Date.now();
        const fieldId = await ctx.db.insert("customFields", {
            boardId: args.boardId,
            name: args.name.trim(),
            type: args.type,
            required: args.required ?? false,
            options: args.options,
            position: maxPosition + 1,
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });

        return await ctx.db.get(fieldId);
    },
});

export const update = mutation({
    args: {
        fieldId: v.id("customFields"),
        name: v.optional(v.string()),
        required: v.optional(v.boolean()),
        options: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const field = await ctx.db.get(args.fieldId);
        if (!field) {
            throw new ConvexError("Custom field not found");
        }

        await ensureBoardWriteAccess(ctx, field.boardId);

        const updates: {
            name?: string;
            required?: boolean;
            options?: string[];
            updatedAt: number;
        } = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) updates.name = args.name.trim();
        if (args.required !== undefined) updates.required = args.required;
        if (args.options !== undefined) updates.options = args.options;

        await ctx.db.patch(args.fieldId, updates);

        return await ctx.db.get(args.fieldId);
    },
});

export const remove = mutation({
    args: { fieldId: v.id("customFields") },
    handler: async (ctx, args) => {
        const field = await ctx.db.get(args.fieldId);
        if (!field) {
            throw new ConvexError("Custom field not found");
        }

        await ensureBoardWriteAccess(ctx, field.boardId);

        const values = await ctx.db
            .query("cardCustomFieldValues")
            .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
            .collect();

        await Promise.all(values.map((value) => ctx.db.delete(value._id)));
        await ctx.db.delete(args.fieldId);

        return { success: true };
    },
});

export const setCardValue = mutation({
    args: {
        cardId: v.id("cards"),
        fieldId: v.id("customFields"),
        textValue: v.optional(v.string()),
        numberValue: v.optional(v.number()),
        dateValue: v.optional(v.number()),
        checkboxValue: v.optional(v.boolean()),
        selectValue: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        const card = await ctx.db.get(args.cardId);
        if (!card) {
            throw new ConvexError("Card not found");
        }

        const field = await ctx.db.get(args.fieldId);
        if (!field) {
            throw new ConvexError("Custom field not found");
        }

        if (card.boardId !== field.boardId) {
            throw new ConvexError("Field does not belong to this card's board");
        }

        await ensureBoardWriteAccess(ctx, card.boardId);

        if (field.type === "select" && args.selectValue && field.options) {
            if (!field.options.includes(args.selectValue)) {
                throw new ConvexError("Invalid select option");
            }
        }

        const existing = await ctx.db
            .query("cardCustomFieldValues")
            .withIndex("by_card_field", (q) =>
                q.eq("cardId", args.cardId).eq("fieldId", args.fieldId),
            )
            .first();

        const valuePayload = {
            textValue: field.type === "text" ? args.textValue : undefined,
            numberValue: field.type === "number" ? args.numberValue : undefined,
            dateValue: field.type === "date" ? args.dateValue : undefined,
            checkboxValue: field.type === "checkbox" ? args.checkboxValue : undefined,
            selectValue: field.type === "select" ? args.selectValue : undefined,
            updatedBy: user._id,
            updatedAt: Date.now(),
        };

        const isEmpty =
            valuePayload.textValue === undefined &&
            valuePayload.numberValue === undefined &&
            valuePayload.dateValue === undefined &&
            valuePayload.checkboxValue === undefined &&
            valuePayload.selectValue === undefined;

        if (existing) {
            if (isEmpty) {
                await ctx.db.delete(existing._id);
                return { success: true, deleted: true };
            }

            await ctx.db.patch(existing._id, valuePayload);
            return { success: true, deleted: false };
        }

        if (isEmpty) {
            return { success: true, deleted: false };
        }

        await ctx.db.insert("cardCustomFieldValues", {
            cardId: args.cardId,
            fieldId: args.fieldId,
            ...valuePayload,
        });

        return { success: true, deleted: false };
    },
});

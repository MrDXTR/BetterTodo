import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { createImportedBoardTitle, parseBoardTransferPayload } from "./lib/boardTransfer";
import { ensureBoardReadAccess, requireAuth } from "./permissions";

export const exportBoard = query({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        await ensureBoardReadAccess(ctx, args.boardId);

        const board = await ctx.db.get(args.boardId);
        if (!board) {
            throw new ConvexError("Board not found");
        }

        const [
            lists,
            cards,
            labels,
            cardLabels,
            checklists,
            checklistItems,
            comments,
            attachments,
            customFields,
            automations,
        ] = await Promise.all([
            ctx.db
                .query("lists")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
                .collect(),
            ctx.db
                .query("cards")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
                .collect(),
            ctx.db
                .query("labels")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
                .collect(),
            ctx.db.query("cardLabels").collect(),
            ctx.db.query("checklists").collect(),
            ctx.db.query("checklistItems").collect(),
            ctx.db.query("comments").collect(),
            ctx.db.query("attachments").collect(),
            ctx.db
                .query("customFields")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
                .collect(),
            ctx.db
                .query("automationRules")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
                .collect(),
        ]);

        const listIds = new Set(lists.map((list) => list._id));
        const cardIds = new Set(cards.map((card) => card._id));
        const checklistIds = new Set(
            checklists
                .filter((checklist) => cardIds.has(checklist.cardId))
                .map((checklist) => checklist._id),
        );
        const customFieldIds = new Set(customFields.map((field) => field._id));

        const filteredCardLabels = cardLabels.filter((link) => cardIds.has(link.cardId));
        const filteredChecklists = checklists.filter((checklist) => cardIds.has(checklist.cardId));
        const filteredChecklistItems = checklistItems.filter((item) =>
            checklistIds.has(item.checklistId),
        );
        const filteredComments = comments.filter((comment) => cardIds.has(comment.cardId));
        const filteredAttachments = attachments.filter((attachment) =>
            cardIds.has(attachment.cardId),
        );
        const customFieldValues = (await ctx.db.query("cardCustomFieldValues").collect()).filter(
            (value) => cardIds.has(value.cardId) && customFieldIds.has(value.fieldId),
        );

        return {
            exportedAt: Date.now(),
            version: 1,
            board,
            lists: lists.filter((list) => listIds.has(list._id)),
            cards,
            labels,
            cardLabels: filteredCardLabels,
            checklists: filteredChecklists,
            checklistItems: filteredChecklistItems,
            comments: filteredComments,
            attachments: filteredAttachments,
            customFields,
            customFieldValues,
            automations,
        };
    },
});

export const importBoard = mutation({
    args: {
        payload: v.string(),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);

        let parsed;
        try {
            parsed = parseBoardTransferPayload(args.payload);
        } catch {
            throw new ConvexError("Invalid JSON payload");
        }

        const now = Date.now();
        const boardId = await ctx.db.insert("boards", {
            title: createImportedBoardTitle(parsed.board.title, args.title),
            description: parsed.board.description,
            color: parsed.board.color,
            backgroundUrl: parsed.board.backgroundUrl,
            visibility: "private",
            workspaceId: undefined,
            createdBy: user._id,
            archived: false,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("boardMembers", {
            boardId,
            userId: user._id,
            role: "owner",
            addedAt: now,
            addedBy: user._id,
        });

        const listMap = new Map<string, string>();
        const cardMap = new Map<string, string>();
        const checklistMap = new Map<string, string>();
        const labelMap = new Map<string, string>();
        const customFieldMap = new Map<string, string>();

        const sortedLists = [...parsed.lists].sort(
            (a: { position: number }, b: { position: number }) => a.position - b.position,
        );
        for (const list of sortedLists) {
            const newListId = await ctx.db.insert("lists", {
                boardId,
                title: list.title,
                position: list.position,
                cardLimit: list.cardLimit,
                archived: !!list.archived,
                createdAt: now,
            });
            listMap.set(list._id, newListId as string);
        }

        const sortedCards = [...parsed.cards].sort(
            (a: { position: number }, b: { position: number }) => a.position - b.position,
        );
        for (const card of sortedCards) {
            const mappedListId = listMap.get(card.listId);
            if (!mappedListId) continue;

            const newCardId = await ctx.db.insert("cards", {
                listId: mappedListId as any,
                boardId,
                title: card.title,
                description: card.description,
                position: card.position,
                coverImage: card.coverImage,
                dueDate: card.dueDate,
                priority: card.priority,
                estimatedHours: card.estimatedHours,
                actualHours: card.actualHours,
                createdBy: user._id,
                archived: !!card.archived,
                completed: !!card.completed,
                createdAt: now,
                updatedAt: now,
            });

            cardMap.set(card._id, newCardId as string);
        }

        for (const label of parsed.labels ?? []) {
            const newLabelId = await ctx.db.insert("labels", {
                boardId,
                name: label.name,
                color: label.color,
            });
            labelMap.set(label._id, newLabelId as string);
        }

        for (const link of parsed.cardLabels ?? []) {
            const mappedCardId = cardMap.get(link.cardId);
            const mappedLabelId = labelMap.get(link.labelId);
            if (!mappedCardId || !mappedLabelId) continue;

            await ctx.db.insert("cardLabels", {
                cardId: mappedCardId as any,
                labelId: mappedLabelId as any,
            });
        }

        for (const checklist of parsed.checklists ?? []) {
            const mappedCardId = cardMap.get(checklist.cardId);
            if (!mappedCardId) continue;

            const newChecklistId = await ctx.db.insert("checklists", {
                cardId: mappedCardId as any,
                title: checklist.title,
                position: checklist.position,
            });
            checklistMap.set(checklist._id, newChecklistId as string);
        }

        for (const item of parsed.checklistItems ?? []) {
            const mappedChecklistId = checklistMap.get(item.checklistId);
            if (!mappedChecklistId) continue;

            await ctx.db.insert("checklistItems", {
                checklistId: mappedChecklistId as any,
                title: item.title,
                completed: !!item.completed,
                assignedTo: item.assignedTo,
                dueDate: item.dueDate,
                position: item.position,
            });
        }

        for (const comment of parsed.comments ?? []) {
            const mappedCardId = cardMap.get(comment.cardId);
            if (!mappedCardId) continue;

            await ctx.db.insert("comments", {
                cardId: mappedCardId as any,
                userId: user._id,
                content: comment.content,
                edited: false,
                createdAt: now,
                updatedAt: now,
            });
        }

        for (const field of parsed.customFields ?? []) {
            const newFieldId = await ctx.db.insert("customFields", {
                boardId,
                name: field.name,
                type: field.type,
                required: !!field.required,
                options: field.options,
                position: field.position,
                createdBy: user._id,
                createdAt: now,
                updatedAt: now,
            });
            customFieldMap.set(field._id, newFieldId as string);
        }

        for (const value of parsed.customFieldValues ?? []) {
            const mappedCardId = cardMap.get(value.cardId);
            const mappedFieldId = customFieldMap.get(value.fieldId);
            if (!mappedCardId || !mappedFieldId) continue;

            await ctx.db.insert("cardCustomFieldValues", {
                cardId: mappedCardId as any,
                fieldId: mappedFieldId as any,
                textValue: value.textValue,
                numberValue: value.numberValue,
                dateValue: value.dateValue,
                checkboxValue: value.checkboxValue,
                selectValue: value.selectValue,
                updatedBy: user._id,
                updatedAt: now,
            });
        }

        for (const automation of parsed.automations ?? []) {
            if (automation.trigger !== "due_date_reminder") continue;
            await ctx.db.insert("automationRules", {
                boardId,
                name: automation.name,
                trigger: "due_date_reminder",
                enabled: !!automation.enabled,
                config: {
                    hoursBefore: automation.config?.hoursBefore ?? 24,
                },
                createdBy: user._id,
                createdAt: now,
                updatedAt: now,
            });
        }

        return {
            success: true,
            boardId,
        };
    },
});

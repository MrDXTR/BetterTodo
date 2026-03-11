import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import { ensureBoardReadAccess, ensureBoardWriteAccess } from "./permissions";

export const getByBoard = query({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        await ensureBoardReadAccess(ctx, args.boardId);

        return await ctx.db
            .query("automationRules")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();
    },
});

export const upsertDueDateReminder = mutation({
    args: {
        boardId: v.id("boards"),
        name: v.optional(v.string()),
        enabled: v.boolean(),
        hoursBefore: v.number(),
    },
    handler: async (ctx, args) => {
        const { user } = await ensureBoardWriteAccess(ctx, args.boardId);

        const existing = await ctx.db
            .query("automationRules")
            .withIndex("by_board_trigger", (q) =>
                q.eq("boardId", args.boardId).eq("trigger", "due_date_reminder"),
            )
            .first();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                name: args.name?.trim() || existing.name,
                enabled: args.enabled,
                config: { hoursBefore: args.hoursBefore },
                updatedAt: now,
            });

            return await ctx.db.get(existing._id);
        }

        const createdId = await ctx.db.insert("automationRules", {
            boardId: args.boardId,
            name: args.name?.trim() || "Due date reminder",
            trigger: "due_date_reminder",
            enabled: args.enabled,
            config: { hoursBefore: args.hoursBefore },
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });

        return await ctx.db.get(createdId);
    },
});

export const remove = mutation({
    args: { ruleId: v.id("automationRules") },
    handler: async (ctx, args) => {
        const rule = await ctx.db.get(args.ruleId);
        if (!rule) return { success: true };

        await ensureBoardWriteAccess(ctx, rule.boardId);
        await ctx.db.delete(args.ruleId);

        return { success: true };
    },
});

export const processDueDateReminders = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        const rules = await ctx.db
            .query("automationRules")
            .withIndex("by_enabled_trigger", (q) =>
                q.eq("enabled", true).eq("trigger", "due_date_reminder"),
            )
            .collect();

        let notificationsCreated = 0;

        for (const rule of rules) {
            const upperBound = now + rule.config.hoursBefore * 60 * 60 * 1000;

            const cards = await ctx.db
                .query("cards")
                .withIndex("by_board", (q) => q.eq("boardId", rule.boardId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("archived"), false),
                        q.eq(q.field("completed"), false),
                        q.gte(q.field("dueDate"), now),
                        q.lte(q.field("dueDate"), upperBound),
                    ),
                )
                .collect();

            for (const card of cards) {
                if (!card.dueDate) continue;

                const assignments = await ctx.db
                    .query("cardAssignments")
                    .withIndex("by_card", (q) => q.eq("cardId", card._id))
                    .collect();

                for (const assignment of assignments) {
                    const dueBucket = Math.floor(card.dueDate / (60 * 60 * 1000));
                    const dedupeKey = `due:${rule._id}:${card._id}:${assignment.userId}:${dueBucket}`;

                    const existingNotification = await ctx.db
                        .query("notifications")
                        .withIndex("by_dedupe", (q) => q.eq("dedupeKey", dedupeKey))
                        .first();

                    if (existingNotification) continue;

                    await ctx.db.insert("notifications", {
                        userId: assignment.userId,
                        type: "due_date_reminder",
                        title: "Card due soon",
                        message: `\"${card.title}\" is due soon`,
                        linkUrl: `/boards/${card.boardId}`,
                        read: false,
                        dedupeKey,
                        createdAt: now,
                    });

                    notificationsCreated += 1;
                }
            }

            await ctx.db.patch(rule._id, { lastRunAt: now, updatedAt: now });
        }

        return {
            processedRules: rules.length,
            notificationsCreated,
        };
    },
});

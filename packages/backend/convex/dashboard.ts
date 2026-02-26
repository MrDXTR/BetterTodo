import { query } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// DASHBOARD QUERIES
// ============================================

/**
 * Get all open checklist tasks across boards the current user can access.
 */
export const getMyOpenTasks = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return { tasks: [], overdueCount: 0 };

        // Get boards the user has access to
        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        if (memberships.length === 0) return { tasks: [], overdueCount: 0 };

        const now = Date.now();
        let overdueCount = 0;
        const tasks: any[] = [];

        for (const membership of memberships) {
            const board = await ctx.db.get(membership.boardId);
            if (!board || board.archived) continue;

            const cards = await ctx.db
                .query("cards")
                .withIndex("by_board", (q) => q.eq("boardId", board._id))
                .filter((q) =>
                    q.and(q.eq(q.field("archived"), false), q.eq(q.field("completed"), false)),
                )
                .collect();

            for (const card of cards) {
                const list = await ctx.db.get(card.listId);
                const checklists = await ctx.db
                    .query("checklists")
                    .withIndex("by_card", (q) => q.eq("cardId", card._id))
                    .collect();

                for (const checklist of checklists) {
                    const checklistItems = await ctx.db
                        .query("checklistItems")
                        .withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
                        .collect();

                    for (const item of checklistItems) {
                        if (item.completed) continue;

                        const effectiveDueDate = item.dueDate ?? card.dueDate;
                        const isOverdue = effectiveDueDate ? effectiveDueDate < now : false;
                        if (isOverdue) overdueCount++;

                        tasks.push({
                            _id: item._id,
                            title: item.title,
                            checklistTitle: checklist.title,
                            cardId: card._id,
                            cardTitle: card.title,
                            priority: card.priority,
                            dueDate: effectiveDueDate,
                            isOverdue,
                            listName: list?.title ?? "Unknown",
                            boardId: board._id,
                            boardTitle: board.title,
                            boardColor: board.color,
                        });
                    }
                }
            }
        }

        // Sort: overdue first, then by due date (soonest first), then by title.
        tasks.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return a.title.localeCompare(b.title);
        });

        return { tasks, overdueCount };
    },
});

/**
 * Get count of completed checklist tasks across boards the user can access.
 */
export const getMyCompletedThisWeek = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return 0;

        // Get boards the user can access.
        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        if (memberships.length === 0) return 0;

        const boardIds = new Set(memberships.map((membership) => membership.boardId));
        let completedTasks = 0;

        for (const boardId of boardIds) {
            const cards = await ctx.db
                .query("cards")
                .withIndex("by_board", (q) => q.eq("boardId", boardId))
                .filter((q) => q.eq(q.field("archived"), false))
                .collect();

            for (const card of cards) {
                const checklists = await ctx.db
                    .query("checklists")
                    .withIndex("by_card", (q) => q.eq("cardId", card._id))
                    .collect();

                for (const checklist of checklists) {
                    const items = await ctx.db
                        .query("checklistItems")
                        .withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
                        .collect();

                    completedTasks += items.filter((item) => item.completed).length;
                }
            }
        }

        return completedTasks;
    },
});

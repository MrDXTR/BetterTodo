import { query } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// DASHBOARD QUERIES
// ============================================

/**
 * Get all open tasks (assigned cards that have a due date, with their checklist items)
 * across boards the current user can access. Each card is returned once.
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

        // Get cards assigned to this user
        const userAssignments = await ctx.db
            .query("cardAssignments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        const assignedCardIds = new Set(userAssignments.map((a) => a.cardId));

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
                const isCardAssignedToUser = assignedCardIds.has(card._id);
                // Must be assigned to the user
                if (!isCardAssignedToUser) continue;

                // Query checklists for this card
                const checklists = await ctx.db
                    .query("checklists")
                    .withIndex("by_card", (q) => q.eq("cardId", card._id))
                    .collect();

                const allChecklistItems: any[] = [];
                for (const checklist of checklists) {
                    const items = await ctx.db
                        .query("checklistItems")
                        .withIndex("by_checklist", (q) => q.eq("checklistId", checklist._id))
                        .collect();
                    allChecklistItems.push(...items);
                }

                // Effective due date: card.dueDate or the earliest item due date
                const itemDueDates = allChecklistItems
                    .map((item) => item.dueDate)
                    .filter((d): d is number => typeof d === "number");
                const earliestItemDueDate =
                    itemDueDates.length > 0 ? Math.min(...itemDueDates) : null;
                const effectiveDueDate = card.dueDate ?? earliestItemDueDate;

                // Must have a due date
                if (effectiveDueDate == null) continue;

                const isOverdue = effectiveDueDate < now;
                if (isOverdue) overdueCount++;

                const list = await ctx.db.get(card.listId);
                const listName = list?.title ?? "Unknown";

                const totalItems = allChecklistItems.length;
                const completedItems = allChecklistItems.filter((i) => i.completed).length;

                // Incomplete checklist items for this card
                const incompleteItems = allChecklistItems
                    .filter((i) => !i.completed)
                    .sort((a, b) => a.position - b.position)
                    .map((i) => ({
                        _id: i._id,
                        title: i.title,
                        completed: i.completed,
                        dueDate: i.dueDate,
                    }));

                // Each card is added once
                tasks.push({
                    _id: card._id,
                    cardId: card._id,
                    title: card.title,
                    listName,
                    boardId: board._id,
                    boardTitle: board.title,
                    boardColor: board.color,
                    priority: card.priority,
                    dueDate: effectiveDueDate,
                    isOverdue,
                    checklistItems: incompleteItems,
                    totalChecklistCount: totalItems,
                    completedChecklistCount: completedItems,
                });
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
 * Get count of assigned cards completed this week.
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

        // Get cards assigned to this user
        const userAssignments = await ctx.db
            .query("cardAssignments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        const assignedCardIds = new Set(userAssignments.map((a) => a.cardId));

        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        let completedCards = 0;

        for (const membership of memberships) {
            const board = await ctx.db.get(membership.boardId);
            if (!board || board.archived) continue;

            const cards = await ctx.db
                .query("cards")
                .withIndex("by_board", (q) => q.eq("boardId", board._id))
                .filter((q) => q.eq(q.field("archived"), false))
                .collect();

            for (const card of cards) {
                const isCardAssignedToUser = assignedCardIds.has(card._id);
                if (isCardAssignedToUser && card.completed && card.updatedAt >= oneWeekAgo) {
                    completedCards++;
                }
            }
        }

        return completedCards;
    },
});

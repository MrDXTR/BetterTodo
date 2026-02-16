import { query } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// DASHBOARD QUERIES
// ============================================

/**
 * Get all cards assigned to the current user across all boards.
 * Returns cards grouped with board info.
 */
export const getMyAssignedCards = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return { cards: [], overdueCount: 0 };

        // Get all assignments for this user
        const assignments = await ctx.db
            .query("cardAssignments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        if (assignments.length === 0) return { cards: [], overdueCount: 0 };

        const now = Date.now();
        let overdueCount = 0;

        // Fetch each card and its context
        const cardsWithContext = await Promise.all(
            assignments.map(async (assignment) => {
                const card = await ctx.db.get(assignment.cardId);
                if (!card || card.archived || card.completed) return null;

                const list = await ctx.db.get(card.listId);
                const board = await ctx.db.get(card.boardId);
                if (!board || board.archived) return null;

                const isOverdue = card.dueDate ? card.dueDate < now : false;
                if (isOverdue) overdueCount++;

                return {
                    _id: card._id,
                    title: card.title,
                    priority: card.priority,
                    dueDate: card.dueDate,
                    isOverdue,
                    listName: list?.title ?? "Unknown",
                    boardId: board._id,
                    boardTitle: board.title,
                    boardColor: board.color,
                };
            })
        );

        const cards = cardsWithContext.filter(Boolean);

        // Sort: overdue first, then by due date (soonest first), then by title
        cards.sort((a, b) => {
            if (a!.isOverdue && !b!.isOverdue) return -1;
            if (!a!.isOverdue && b!.isOverdue) return 1;
            if (a!.dueDate && b!.dueDate) return a!.dueDate - b!.dueDate;
            if (a!.dueDate) return -1;
            if (b!.dueDate) return 1;
            return a!.title.localeCompare(b!.title);
        });

        return { cards, overdueCount };
    },
});

/**
 * Get count of cards completed this week that were assigned to the current user.
 */
export const getMyCompletedThisWeek = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return 0;

        // Get start of current week (Monday)
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1; // Monday = 0
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(monday.getDate() - diff);
        const weekStart = monday.getTime();

        // Get all assignments for this user
        const assignments = await ctx.db
            .query("cardAssignments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        if (assignments.length === 0) return 0;

        let completedCount = 0;

        for (const assignment of assignments) {
            const card = await ctx.db.get(assignment.cardId);
            if (card && card.completed && card.updatedAt >= weekStart) {
                completedCount++;
            }
        }

        return completedCount;
    },
});

/**
 * Get recent activity across all boards the user has access to.
 */
export const getRecentActivity = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        // Get all board memberships
        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        if (memberships.length === 0) return [];

        // Fetch recent activity from each board and merge
        const allActivities = [];

        for (const membership of memberships) {
            const activities = await ctx.db
                .query("activityLogs")
                .withIndex("by_board_time", (q) =>
                    q.eq("boardId", membership.boardId)
                )
                .order("desc")
                .take(10);

            const board = await ctx.db.get(membership.boardId);

            for (const activity of activities) {
                allActivities.push({
                    ...activity,
                    boardTitle: board?.title ?? "Deleted Board",
                    boardColor: board?.color,
                });
            }
        }

        // Sort by time descending and take top 20
        allActivities.sort((a, b) => b.createdAt - a.createdAt);
        return allActivities.slice(0, 20);
    },
});

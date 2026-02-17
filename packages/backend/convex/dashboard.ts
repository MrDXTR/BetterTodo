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
                    q.and(
                        q.eq(q.field("archived"), false),
                        q.eq(q.field("completed"), false)
                    )
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

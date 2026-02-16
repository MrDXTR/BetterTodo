import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// QUERIES
// ============================================

/**
 * Get all boards accessible to the current user
 */
export const getAll = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        // Get boards where user is a member
        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const boardIds = memberships.map((m) => m.boardId);

        // Fetch all boards
        const boards = await Promise.all(
            boardIds.map((id) => ctx.db.get(id))
        );

        // Filter out null boards and archived ones
        return boards
            .filter((board) => board !== null && !board.archived)
            .map((board) => ({
                ...board!,
                // Add member role
                role: memberships.find((m) => m.boardId === board!._id)?.role,
            }));
    },
});

/**
 * Get archived boards and cards for the current user
 */
export const getArchived = query({
    args: { boardId: v.optional(v.id("boards")) },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return { boards: [], cards: [] };

        // Get archived boards
        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const boardIds = memberships.map((m) => m.boardId);
        const allBoards = await Promise.all(boardIds.map((id) => ctx.db.get(id)));

        const archivedBoards = allBoards
            .filter((b) => b !== null && b.archived)
            .map((board) => ({
                ...board!,
                role: memberships.find((m) => m.boardId === board!._id)?.role,
            }));

        // Get archived cards (optionally scoped to a board)
        let archivedCards: any[] = [];
        if (args.boardId) {
            const cards = await ctx.db
                .query("cards")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId!))
                .filter((q) => q.eq(q.field("archived"), true))
                .collect();

            const board = await ctx.db.get(args.boardId);
            archivedCards = cards.map((c) => ({
                ...c,
                boardTitle: board?.title ?? "Unknown",
                boardColor: board?.color,
            }));
        } else {
            // Get archived cards from all user's boards
            for (const boardId of boardIds) {
                const cards = await ctx.db
                    .query("cards")
                    .withIndex("by_board", (q) => q.eq("boardId", boardId))
                    .filter((q) => q.eq(q.field("archived"), true))
                    .collect();

                const board = await ctx.db.get(boardId);
                for (const c of cards) {
                    archivedCards.push({
                        ...c,
                        boardTitle: board?.title ?? "Unknown",
                        boardColor: board?.color,
                    });
                }
            }
        }

        return { boards: archivedBoards, cards: archivedCards };
    },
});

/**
 * Get a single board by ID with lists and cards
 */
export const getById = query({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) throw new Error("Access denied");

        const board = await ctx.db.get(args.boardId);
        if (!board) throw new Error("Board not found");

        // Get lists for this board
        const lists = await ctx.db
            .query("lists")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .filter((q) => q.eq(q.field("archived"), false))
            .collect();

        // Sort lists by position
        lists.sort((a, b) => a.position - b.position);

        // Get cards for each list
        const listsWithCards = await Promise.all(
            lists.map(async (list) => {
                const cards = await ctx.db
                    .query("cards")
                    .withIndex("by_list", (q) => q.eq("listId", list._id))
                    .filter((q) => q.eq(q.field("archived"), false))
                    .collect();

                // Sort cards by position
                cards.sort((a, b) => a.position - b.position);

                return {
                    ...list,
                    cards,
                };
            })
        );

        return {
            ...board,
            role: membership.role,
            lists: listsWithCards,
        };
    },
});

/**
 * Get board members
 */
export const getMembers = query({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) throw new Error("Access denied");

        const members = await ctx.db
            .query("boardMembers")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();

        // Resolve user data for each member
        const membersWithUser = await Promise.all(
            members.map(async (member) => {
                // Look up user via the auth component API
                const authUser = await authComponent.getAnyUserById(ctx, member.userId);

                return {
                    ...member,
                    user: authUser
                        ? {
                            name: authUser.name ?? null,
                            email: authUser.email ?? null,
                            image: authUser.image ?? null,
                        }
                        : null,
                };
            })
        );

        return membersWithUser;
    },
});

/**
 * Get board activity log
 */
export const getActivity = query({
    args: {
        boardId: v.id("boards"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) throw new Error("Access denied");

        const activities = await ctx.db
            .query("activityLogs")
            .withIndex("by_board_time", (q) => q.eq("boardId", args.boardId))
            .order("desc")
            .take(args.limit ?? 50);

        return activities;
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new board
 */
export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        visibility: v.optional(
            v.union(v.literal("private"), v.literal("team"), v.literal("public"))
        ),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const now = Date.now();

        // Create the board
        const boardId = await ctx.db.insert("boards", {
            title: args.title,
            description: args.description,
            color: args.color,
            visibility: args.visibility || "private",
            createdBy: user._id,
            archived: false,
            createdAt: now,
            updatedAt: now,
        });

        // Add the creator as an owner
        await ctx.db.insert("boardMembers", {
            boardId,
            userId: user._id,
            role: "owner",
            addedBy: user._id,
            addedAt: now,
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId,
            userId: user._id,
            actionType: "board_created",
            details: { title: args.title },
            createdAt: now,
        });

        return await ctx.db.get(boardId);
    },
});

/**
 * Update board details
 */
export const update = mutation({
    args: {
        boardId: v.id("boards"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        visibility: v.optional(
            v.union(v.literal("private"), v.literal("team"), v.literal("public"))
        ),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user has admin or owner role
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("Insufficient permissions");
        }

        const updates: any = { updatedAt: Date.now() };
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.color !== undefined) updates.color = args.color;
        if (args.visibility !== undefined) updates.visibility = args.visibility;

        await ctx.db.patch(args.boardId, updates);

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "board_updated",
            details: updates,
            createdAt: Date.now(),
        });

        return await ctx.db.get(args.boardId);
    },
});

/**
 * Archive a board
 */
export const archive = mutation({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user is owner
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || membership.role !== "owner") {
            throw new Error("Only owners can archive boards");
        }

        await ctx.db.patch(args.boardId, {
            archived: true,
            updatedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "board_archived",
            details: {},
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Restore an archived board
 */
export const restore = mutation({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user is owner
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || membership.role !== "owner") {
            throw new Error("Only owners can restore boards");
        }

        await ctx.db.patch(args.boardId, {
            archived: false,
            updatedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "board_restored",
            details: {},
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Delete a board (owner only)
 */
export const deleteBoard = mutation({
    args: { boardId: v.id("boards") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if user is owner
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || membership.role !== "owner") {
            throw new Error("Only owners can delete boards");
        }

        // Delete all related data
        // Note: In production, consider soft delete or archiving instead

        // Delete lists and cards
        const lists = await ctx.db
            .query("lists")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();

        for (const list of lists) {
            const cards = await ctx.db
                .query("cards")
                .withIndex("by_list", (q) => q.eq("listId", list._id))
                .collect();

            for (const card of cards) {
                await ctx.db.delete(card._id);
            }
            await ctx.db.delete(list._id);
        }

        // Delete board members
        const members = await ctx.db
            .query("boardMembers")
            .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
            .collect();

        for (const member of members) {
            await ctx.db.delete(member._id);
        }

        // Delete the board
        await ctx.db.delete(args.boardId);

        return { success: true };
    },
});

/**
 * Add a member to the board
 */
export const addMember = mutation({
    args: {
        boardId: v.id("boards"),
        userId: v.string(),
        role: v.union(
            v.literal("admin"),
            v.literal("member"),
            v.literal("viewer")
        ),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if current user has admin or owner role
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("Insufficient permissions");
        }

        // Check if user is already a member
        const existingMember = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", args.userId)
            )
            .first();

        if (existingMember) {
            throw new Error("User is already a member");
        }

        const now = Date.now();
        await ctx.db.insert("boardMembers", {
            boardId: args.boardId,
            userId: args.userId,
            role: args.role,
            addedAt: now,
            addedBy: user._id,
        });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "member_added",
            details: { addedUserId: args.userId, role: args.role },
            createdAt: now,
        });

        return { success: true };
    },
});

/**
 * Add a member by email address
 */
export const addMemberByEmail = mutation({
    args: {
        boardId: v.id("boards"),
        email: v.string(),
        role: v.union(
            v.literal("admin"),
            v.literal("member"),
            v.literal("viewer")
        ),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if current user has admin or owner role
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("Insufficient permissions");
        }

        // Search for the user by email by checking known users
        const allMembers = await ctx.db.query("boardMembers").collect();
        const uniqueUserIds = [...new Set(allMembers.map(m => m.userId))];

        let targetUser = null;
        for (const uid of uniqueUserIds) {
            const u = await authComponent.getAnyUserById(ctx, uid);
            if (u && u.email?.toLowerCase() === args.email.toLowerCase()) {
                targetUser = u;
                break;
            }
        }

        if (!targetUser) {
            throw new Error("No user found with that email. They must sign up first.");
        }

        // Check if already a member
        const existing = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", targetUser._id)
            )
            .first();

        if (existing) {
            throw new Error("This user is already a member of this board");
        }

        const now = Date.now();
        await ctx.db.insert("boardMembers", {
            boardId: args.boardId,
            userId: targetUser._id,
            role: args.role,
            addedAt: now,
            addedBy: user._id,
        });

        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "member_added",
            details: { addedUserId: targetUser._id, email: args.email, role: args.role },
            createdAt: now,
        });

        return { success: true, userName: targetUser.name };
    },
});

/**
 * Update member role
 */
export const updateMemberRole = mutation({
    args: {
        boardId: v.id("boards"),
        userId: v.string(),
        role: v.union(
            v.literal("admin"),
            v.literal("member"),
            v.literal("viewer")
        ),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if current user is owner
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || membership.role !== "owner") {
            throw new Error("Only owners can change member roles");
        }

        // Get the member to update
        const targetMember = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", args.userId)
            )
            .first();

        if (!targetMember) {
            throw new Error("Member not found");
        }

        if (targetMember.role === "owner") {
            throw new Error("Cannot change owner role");
        }

        await ctx.db.patch(targetMember._id, { role: args.role });

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "member_role_updated",
            details: { targetUserId: args.userId, newRole: args.role },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Remove a member from the board
 */
export const removeMember = mutation({
    args: {
        boardId: v.id("boards"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if current user has admin or owner role
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("Insufficient permissions");
        }

        // Get the member to remove
        const targetMember = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", args.userId)
            )
            .first();

        if (!targetMember) {
            throw new Error("Member not found");
        }

        if (targetMember.role === "owner") {
            throw new Error("Cannot remove board owner");
        }

        await ctx.db.delete(targetMember._id);

        // Log activity
        await ctx.db.insert("activityLogs", {
            boardId: args.boardId,
            userId: user._id,
            actionType: "member_removed",
            details: { removedUserId: args.userId },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

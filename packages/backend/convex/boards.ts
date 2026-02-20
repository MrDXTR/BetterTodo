import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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
        if (!user) return null;

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) return null;

        const board = await ctx.db.get(args.boardId);
        if (!board) return null;

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

                const cardsWithTaskSummary = await Promise.all(
                    cards.map(async (card) => {
                        const checklists = await ctx.db
                            .query("checklists")
                            .withIndex("by_card", (q) => q.eq("cardId", card._id))
                            .collect();

                        if (checklists.length === 0) {
                            return {
                                ...card,
                                checklistCount: 0,
                                checklistItemsCompleted: 0,
                                checklistItemsTotal: 0,
                            };
                        }

                        const checklistItemsPerList = await Promise.all(
                            checklists.map((checklist) =>
                                ctx.db
                                    .query("checklistItems")
                                    .withIndex("by_checklist", (q) =>
                                        q.eq("checklistId", checklist._id)
                                    )
                                    .collect()
                            )
                        );

                        const checklistItems = checklistItemsPerList.flat();
                        const checklistItemsCompleted = checklistItems.filter(
                            (item) => item.completed
                        ).length;

                        return {
                            ...card,
                            checklistCount: checklists.length,
                            checklistItemsCompleted,
                            checklistItemsTotal: checklistItems.length,
                        };
                    })
                );

                return {
                    ...list,
                    cards: cardsWithTaskSummary,
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
        if (!user) return [];

        // Check if user has access to this board
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", args.boardId).eq("userId", user._id)
            )
            .first();

        if (!membership) return [];

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


        return { success: true };
    },
});

/**
 * Invite a member by email address.
 * - If the email belongs to an existing user: creates an in-app invite + notification + sends invite email.
 * - If the email is unregistered: creates a token-based invite and sends an external signup email.
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

        const board = await ctx.db.get(args.boardId);
        const now = Date.now();
        const inviterName = user.name ?? user.email ?? "Someone";
        const boardTitle = board?.title ?? "a board";

        // ── Step 1: Search for a registered user by email ──────────────────────
        // We scan all board members across the system to find a matching auth user.
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

        // ── Step 2a: Registered user flow ──────────────────────────────────────
        if (targetUser) {
            // Check if already a member
            const existing = await ctx.db
                .query("boardMembers")
                .withIndex("by_board_user", (q) =>
                    q.eq("boardId", args.boardId).eq("userId", targetUser!._id)
                )
                .first();

            if (existing) {
                throw new Error("This user is already a member of this board");
            }

            // Check if there's already a pending invite
            const existingInvite = await ctx.db
                .query("boardInvites")
                .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("invitedUserId"), targetUser!._id),
                        q.eq(q.field("status"), "pending")
                    )
                )
                .first();

            if (existingInvite) {
                throw new Error("An invite is already pending for this user");
            }

            // Create the invite record
            const inviteId = await ctx.db.insert("boardInvites", {
                boardId: args.boardId,
                invitedUserId: targetUser._id,
                invitedByUserId: user._id,
                role: args.role,
                status: "pending",
                createdAt: now,
            });

            // Create an in-app notification
            await ctx.db.insert("notifications", {
                userId: targetUser._id,
                type: "board_invite",
                title: "Board Invitation",
                message: `You've been invited to join "${boardTitle}"`,
                linkUrl: `/boards/${args.boardId}`,
                read: false,
                createdAt: now,
            });

            // Schedule the invite email
            await ctx.scheduler.runAfter(0, internal.emails.sendBoardInviteEmail, {
                to: targetUser.email ?? args.email,
                recipientName: targetUser.name ?? undefined,
                inviterName,
                boardTitle,
                boardId: args.boardId,
                role: args.role,
                inviteId,
            });

            return { success: true, isNewUser: false, userName: targetUser.name };
        }

        // ── Step 2b: Unregistered user flow ────────────────────────────────────
        // Check if there's already a pending external invite for this email
        const existingEmailInvite = await ctx.db
            .query("boardInvites")
            .withIndex("by_email", (q) => q.eq("invitedEmail", args.email.toLowerCase()))
            .filter((q) =>
                q.and(
                    q.eq(q.field("boardId"), args.boardId),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();

        if (existingEmailInvite) {
            throw new Error("An invite is already pending for this email");
        }

        // Generate a unique secure token
        const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

        // Create the token-based invite (no userId yet)
        await ctx.db.insert("boardInvites", {
            boardId: args.boardId,
            invitedEmail: args.email.toLowerCase(),
            invitedByUserId: user._id,
            role: args.role,
            status: "pending",
            token,
            createdAt: now,
        });

        // Schedule the external signup email
        await ctx.scheduler.runAfter(0, internal.emails.sendBoardInviteEmailExternal, {
            to: args.email,
            inviterName,
            boardTitle,
            role: args.role,
            token,
        });

        return { success: true, isNewUser: true, userName: null };
    },
});

/**
 * Accept a board invite
 */
export const acceptInvite = mutation({
    args: { inviteId: v.id("boardInvites") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const invite = await ctx.db.get(args.inviteId);
        if (!invite) throw new Error("Invite not found");

        if (invite.invitedUserId !== user._id) {
            throw new Error("This invite is not for you");
        }

        if (invite.status !== "pending") {
            throw new Error("This invite has already been responded to");
        }

        const now = Date.now();

        // Add user as board member
        await ctx.db.insert("boardMembers", {
            boardId: invite.boardId,
            userId: user._id,
            role: invite.role,
            addedAt: now,
            addedBy: invite.invitedByUserId,
        });

        // Update invite status
        await ctx.db.patch(args.inviteId, {
            status: "accepted",
            respondedAt: now,
        });

        return { success: true };
    },
});

/**
 * Decline a board invite
 */
export const declineInvite = mutation({
    args: { inviteId: v.id("boardInvites") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const invite = await ctx.db.get(args.inviteId);
        if (!invite) throw new Error("Invite not found");

        if (invite.invitedUserId !== user._id) {
            throw new Error("This invite is not for you");
        }

        if (invite.status !== "pending") {
            throw new Error("This invite has already been responded to");
        }

        await ctx.db.patch(args.inviteId, {
            status: "declined",
            respondedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Accept a board invite via token (email link flow for unregistered users).
 * Called after the user signs up/in using the invite link.
 */
export const acceptInviteByToken = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Find invite by token
        const invite = await ctx.db
            .query("boardInvites")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!invite) throw new Error("Invite not found or expired");
        if (invite.status !== "pending") throw new Error("This invite has already been used");

        // Validate the user's email matches the invited email (if set)
        if (invite.invitedEmail && user.email?.toLowerCase() !== invite.invitedEmail) {
            throw new Error("This invite was sent to a different email address");
        }

        const now = Date.now();

        // Check if user is already a board member
        const existingMember = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) =>
                q.eq("boardId", invite.boardId).eq("userId", user._id)
            )
            .first();

        if (!existingMember) {
            // Add user as board member
            await ctx.db.insert("boardMembers", {
                boardId: invite.boardId,
                userId: user._id,
                role: invite.role,
                addedAt: now,
                addedBy: invite.invitedByUserId,
            });
        }

        // Mark invite as accepted
        await ctx.db.patch(invite._id, {
            status: "accepted",
            invitedUserId: user._id, // link the user account to the invite
            respondedAt: now,
        });

        return { success: true, boardId: invite.boardId };
    },
});

/**
 * Get pending invites for the current user
 */
export const getPendingInvites = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        const invites = await ctx.db
            .query("boardInvites")
            .withIndex("by_user_status", (q) =>
                q.eq("invitedUserId", user._id).eq("status", "pending")
            )
            .collect();

        // Enrich with board details
        const enriched = await Promise.all(
            invites.map(async (invite) => {
                const board = await ctx.db.get(invite.boardId);
                const inviter = await authComponent.getAnyUserById(ctx, invite.invitedByUserId);
                return {
                    ...invite,
                    boardTitle: board?.title ?? "Unknown Board",
                    boardColor: board?.color,
                    inviterName: inviter?.name ?? "Someone",
                };
            })
        );

        return enriched;
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


        return { success: true };
    },
});

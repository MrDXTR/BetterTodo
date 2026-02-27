import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";

import type { DataModel } from "./_generated/dataModel";

import { components } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const convexSiteUrl = process.env.CONVEX_SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
    return betterAuth({
        baseURL: convexSiteUrl,
        trustedOrigins: [siteUrl],
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
        },
        socialProviders: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            },
        },
        plugins: [
            crossDomain({ siteUrl }),
            convex({
                authConfig,
                jwksRotateOnTokenGenerationError: true,
            }),
        ],
    });
}

export { createAuth };

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return await authComponent.safeGetAuthUser(ctx);
    },
});

async function isAdminUser(ctx: any, userId: string) {
    const row = await ctx.db
        .query("userRoles")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .first();

    return row?.role === "admin";
}

async function requireAdmin(ctx: any) {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
        throw new Error("Unauthorized");
    }

    const isAdmin = await isAdminUser(ctx, user._id);
    if (!isAdmin) {
        throw new Error("Admin access required");
    }

    return user;
}

async function deleteCardWithRelations(ctx: any, cardId: string) {
    const checklists = await ctx.db
        .query("checklists")
        .withIndex("by_card", (q: any) => q.eq("cardId", cardId))
        .collect();
    for (const checklist of checklists) {
        const items = await ctx.db
            .query("checklistItems")
            .withIndex("by_checklist", (q: any) => q.eq("checklistId", checklist._id))
            .collect();
        for (const item of items) {
            await ctx.db.delete(item._id);
        }
        await ctx.db.delete(checklist._id);
    }

    const comments = await ctx.db
        .query("comments")
        .withIndex("by_card", (q: any) => q.eq("cardId", cardId))
        .collect();
    for (const comment of comments) {
        await ctx.db.delete(comment._id);
    }

    const attachments = await ctx.db
        .query("attachments")
        .withIndex("by_card", (q: any) => q.eq("cardId", cardId))
        .collect();
    for (const attachment of attachments) {
        try {
            await ctx.storage.delete(attachment.storageId);
        } catch {
            // file may already be gone
        }
        await ctx.db.delete(attachment._id);
    }

    const labels = await ctx.db
        .query("cardLabels")
        .withIndex("by_card", (q: any) => q.eq("cardId", cardId))
        .collect();
    for (const row of labels) {
        await ctx.db.delete(row._id);
    }

    const assignments = await ctx.db
        .query("cardAssignments")
        .withIndex("by_card", (q: any) => q.eq("cardId", cardId))
        .collect();
    for (const assignment of assignments) {
        await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(cardId);
}

async function deleteBoardWithRelations(ctx: any, boardId: string) {
    const lists = await ctx.db
        .query("lists")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect();

    for (const list of lists) {
        const cards = await ctx.db
            .query("cards")
            .withIndex("by_list", (q: any) => q.eq("listId", list._id))
            .collect();

        for (const card of cards) {
            await deleteCardWithRelations(ctx, card._id);
        }

        await ctx.db.delete(list._id);
    }

    const labels = await ctx.db
        .query("labels")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect();
    for (const label of labels) {
        await ctx.db.delete(label._id);
    }

    const members = await ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect();
    for (const member of members) {
        await ctx.db.delete(member._id);
    }

    const invites = await ctx.db
        .query("boardInvites")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect();
    for (const invite of invites) {
        await ctx.db.delete(invite._id);
    }

    const presenceRows = await ctx.db
        .query("presence")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect();
    for (const row of presenceRows) {
        await ctx.db.delete(row._id);
    }

    await ctx.db.delete(boardId);
}

export const getMyRole = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) {
            return "user";
        }

        return (await isAdminUser(ctx, user._id)) ? "admin" : "user";
    },
});

export const listUsersForAdmin = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);

        const [boardMembers, workspaceMembers, notifications] = await Promise.all([
            ctx.db.query("boardMembers").collect(),
            ctx.db.query("workspaceMembers").collect(),
            ctx.db.query("notifications").collect(),
        ]);

        const userIds = new Set<string>();
        for (const row of boardMembers) userIds.add(row.userId);
        for (const row of workspaceMembers) userIds.add(row.userId);
        for (const row of notifications) userIds.add(row.userId);

        const results = await Promise.all(
            [...userIds].map(async (userId) => {
                const authUser = await authComponent.getAnyUserById(ctx, userId);
                const roleRow = await ctx.db
                    .query("userRoles")
                    .withIndex("by_user", (q: any) => q.eq("userId", userId))
                    .first();
                return {
                    userId,
                    role: roleRow?.role ?? "user",
                    name: authUser?.name ?? null,
                    email: authUser?.email ?? null,
                    image: authUser?.image ?? null,
                };
            }),
        );

        return results.sort((a, b) =>
            (a.name ?? a.email ?? a.userId).localeCompare(b.name ?? b.email ?? b.userId),
        );
    },
});

export const setUserRole = mutation({
    args: {
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("user")),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);

        const existing = await ctx.db
            .query("userRoles")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                role: args.role,
                updatedAt: Date.now(),
                updatedBy: admin._id,
            });
        } else {
            await ctx.db.insert("userRoles", {
                userId: args.userId,
                role: args.role,
                updatedAt: Date.now(),
                updatedBy: admin._id,
            });
        }

        return { success: true };
    },
});

export const createAdmin = internalMutation({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const callerIdOrSystem = "system";

        const authUser = await authComponent.getAnyUserById(ctx, args.userId);
        if (!authUser) {
            throw new Error("User not found.");
        }

        const existing = await ctx.db
            .query("userRoles")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                role: "admin",
                updatedAt: Date.now(),
                updatedBy: callerIdOrSystem,
            });
        } else {
            await ctx.db.insert("userRoles", {
                userId: args.userId,
                role: "admin",
                updatedAt: Date.now(),
                updatedBy: callerIdOrSystem,
            });
        }

        return { success: true };
    },
});

export const deleteUserAndAllData = mutation({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);

        if (admin._id === args.userId) {
            throw new Error("Admins cannot delete their own account.");
        }

        const adminRows = await ctx.db.query("userRoles").collect();
        const adminCount = adminRows.filter((r) => r.role === "admin").length;
        const targetRole = adminRows.find((r) => r.userId === args.userId)?.role ?? "user";
        if (targetRole === "admin" && adminCount <= 1) {
            throw new Error("Cannot delete the last admin user.");
        }

        const boardsOwned = await ctx.db
            .query("boards")
            .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
            .collect();
        for (const board of boardsOwned) {
            await deleteBoardWithRelations(ctx, board._id);
        }

        const cardsCreated = await ctx.db
            .query("cards")
            .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
            .collect();
        for (const card of cardsCreated) {
            const stillExists = await ctx.db.get(card._id);
            if (stillExists) {
                await deleteCardWithRelations(ctx, card._id);
            }
        }

        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const row of memberships) {
            await ctx.db.delete(row._id);
        }

        const wsMemberships = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const row of wsMemberships) {
            await ctx.db.delete(row._id);
        }

        const workspacesOwned = await ctx.db
            .query("workspaces")
            .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
            .collect();
        for (const workspace of workspacesOwned) {
            const boardsInWorkspace = await ctx.db
                .query("boards")
                .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
                .collect();
            for (const board of boardsInWorkspace) {
                await deleteBoardWithRelations(ctx, board._id);
            }
            const members = await ctx.db
                .query("workspaceMembers")
                .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
                .collect();
            for (const member of members) {
                await ctx.db.delete(member._id);
            }
            await ctx.db.delete(workspace._id);
        }

        const comments = await ctx.db
            .query("comments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const comment of comments) {
            await ctx.db.delete(comment._id);
        }

        const assignments = await ctx.db
            .query("cardAssignments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const assignment of assignments) {
            await ctx.db.delete(assignment._id);
        }

        const attachments = await ctx.db
            .query("attachments")
            .withIndex("by_uploader", (q) => q.eq("uploadedBy", args.userId))
            .collect();
        for (const attachment of attachments) {
            try {
                await ctx.storage.delete(attachment.storageId);
            } catch {
                // file may already be gone
            }
            await ctx.db.delete(attachment._id);
        }

        const notes = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const note of notes) {
            await ctx.db.delete(note._id);
        }

        const invitesByUser = await ctx.db
            .query("boardInvites")
            .filter((q) => q.eq(q.field("invitedByUserId"), args.userId))
            .collect();
        for (const invite of invitesByUser) {
            await ctx.db.delete(invite._id);
        }

        const roleRow = await ctx.db
            .query("userRoles")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        if (roleRow) {
            await ctx.db.delete(roleRow._id);
        }

        return { success: true };
    },
});

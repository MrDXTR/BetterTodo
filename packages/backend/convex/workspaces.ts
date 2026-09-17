import { ConvexError, v } from "convex/values";

import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { ensureWorkspaceAccess, requireAuth } from "./permissions";

export const getMyWorkspaces = query({
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        const memberships = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const workspaces = await Promise.all(
            memberships.map(async (membership) => {
                const workspace = await ctx.db.get(membership.workspaceId);
                if (!workspace) return null;

                const boardsCount = await ctx.db
                    .query("boards")
                    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
                    .filter((q) => q.eq(q.field("archived"), false))
                    .collect();

                return {
                    ...workspace,
                    role: membership.role,
                    boardsCount: boardsCount.length,
                };
            }),
        );

        return workspaces.filter((workspace) => workspace !== null);
    },
});

export const getById = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "member");

        const workspace = await ctx.db.get(args.workspaceId);
        if (!workspace) {
            throw new ConvexError("Workspace not found");
        }

        const members = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const membersWithUsers = await Promise.all(
            members.map(async (member) => {
                const user = await authComponent.getAnyUserById(ctx, member.userId);
                return {
                    ...member,
                    user: user
                        ? {
                              _id: user._id,
                              name: user.name,
                              email: user.email,
                              image: user.image,
                          }
                        : null,
                };
            }),
        );

        return {
            ...workspace,
            members: membersWithUsers,
        };
    },
});

export const getBoards = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "member");

        const boards = await ctx.db
            .query("boards")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .filter((q) => q.eq(q.field("archived"), false))
            .collect();

        return boards;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireAuth(ctx);
        const now = Date.now();

        const workspaceId = await ctx.db.insert("workspaces", {
            name: args.name,
            description: args.description,
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("workspaceMembers", {
            workspaceId,
            userId: user._id,
            role: "owner",
            addedAt: now,
        });

        return await ctx.db.get(workspaceId);
    },
});

export const update = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "admin");

        const updates: any = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;

        await ctx.db.patch(args.workspaceId, updates);

        return await ctx.db.get(args.workspaceId);
    },
});

export const deleteWorkspace = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "owner");

        const boards = await ctx.db
            .query("boards")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        for (const board of boards) {
            await ctx.db.patch(board._id, { workspaceId: undefined });
        }

        const members = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        for (const member of members) {
            await ctx.db.delete(member._id);
        }

        await ctx.db.delete(args.workspaceId);

        return { success: true };
    },
});

export const removeMember = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const { user, role } = await ensureWorkspaceAccess(ctx, args.workspaceId, "admin");

        if (args.userId === user._id) {
            throw new ConvexError("Cannot remove yourself from workspace");
        }

        const member = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", args.userId),
            )
            .first();

        if (!member) {
            throw new ConvexError("Member not found");
        }

        if (member.role === "owner") {
            throw new ConvexError("Cannot remove the workspace owner");
        }

        if (member.role === "admin" && role !== "owner") {
            throw new ConvexError("Only owners can remove admins");
        }

        await ctx.db.delete(member._id);

        return { success: true };
    },
});

export const updateMemberRole = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("member")),
    },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "owner");

        const member = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", args.userId),
            )
            .first();

        if (!member) {
            throw new ConvexError("Member not found");
        }

        if (member.role === "owner") {
            throw new ConvexError("Cannot change owner role");
        }

        await ctx.db.patch(member._id, { role: args.role });

        return { success: true };
    },
});

export const addMemberByEmail = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        email: v.string(),
        role: v.union(v.literal("admin"), v.literal("member")),
    },
    handler: async (ctx, args) => {
        const { user } = await ensureWorkspaceAccess(ctx, args.workspaceId, "admin");

        const workspace = await ctx.db.get(args.workspaceId);
        const normalizedEmail = args.email.trim().toLowerCase();
        const now = Date.now();

        const targetUser = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
            model: "user",
            where: [{ field: "email", value: normalizedEmail }],
        })) as { _id: string; name?: string; email?: string } | null;

        if (!targetUser) {
            throw new ConvexError("No account found with that email. Ask them to sign up first.");
        }

        const existing = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", targetUser._id),
            )
            .first();

        if (existing) {
            throw new ConvexError("This user is already a member of this workspace");
        }

        await ctx.db.insert("workspaceMembers", {
            workspaceId: args.workspaceId,
            userId: targetUser._id,
            role: args.role,
            addedAt: now,
        });

        await ctx.db.insert("notifications", {
            userId: targetUser._id,
            type: "workspace_invite",
            title: "Workspace Invitation",
            message: `You've been added to the workspace "${workspace?.name ?? "a workspace"}"`,
            linkUrl: `/workspaces/${args.workspaceId}`,
            read: false,
            createdAt: now,
        });

        return { success: true, userName: targetUser.name };
    },
});

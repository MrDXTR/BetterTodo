import { ConvexError, v } from "convex/values";

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

        const membersWithUser = await Promise.all(
            members.map(async (member) => {
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
            }),
        );

        return {
            ...workspace,
            members: membersWithUser,
        };
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
            name: args.name.trim(),
            description: args.description?.trim() || undefined,
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

        const updates: { name?: string; description?: string; updatedAt: number } = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) updates.name = args.name.trim();
        if (args.description !== undefined) updates.description = args.description.trim() || "";

        await ctx.db.patch(args.workspaceId, updates);

        return await ctx.db.get(args.workspaceId);
    },
});

export const addMember = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("member")),
    },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "admin");

        const existing = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", args.userId),
            )
            .first();

        if (existing) {
            throw new ConvexError("User is already a workspace member");
        }

        await ctx.db.insert("workspaceMembers", {
            workspaceId: args.workspaceId,
            userId: args.userId,
            role: args.role,
            addedAt: Date.now(),
        });

        return { success: true };
    },
});

export const removeMember = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        await ensureWorkspaceAccess(ctx, args.workspaceId, "admin");

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
            throw new ConvexError("Cannot remove workspace owner");
        }

        await ctx.db.delete(member._id);

        return { success: true };
    },
});

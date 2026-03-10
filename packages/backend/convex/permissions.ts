import { ConvexError } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

type Ctx = QueryCtx | MutationCtx;

export type BoardRole = "owner" | "admin" | "member" | "viewer";

export async function requireAuth(ctx: Ctx) {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
        throw new ConvexError("Unauthorized");
    }
    return user;
}

export async function ensureBoardReadAccess(ctx: Ctx, boardId: Id<"boards">) {
    const user = await requireAuth(ctx);
    const board = await ctx.db.get(boardId);
    if (!board) {
        throw new ConvexError("Board not found");
    }

    const membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_board_user", (q) => q.eq("boardId", boardId).eq("userId", user._id))
        .first();

    if (membership) {
        return { user, board, role: membership.role as BoardRole, isDirectMember: true };
    }

    if (board.visibility === "public") {
        return { user, board, role: "viewer" as BoardRole, isDirectMember: false };
    }

    if (board.visibility === "team" && board.workspaceId) {
        const workspaceMember = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", board.workspaceId!).eq("userId", user._id),
            )
            .first();

        if (workspaceMember) {
            return { user, board, role: "viewer" as BoardRole, isDirectMember: false };
        }
    }

    throw new ConvexError("Access denied");
}

export async function ensureBoardWriteAccess(ctx: Ctx, boardId: Id<"boards">) {
    const user = await requireAuth(ctx);

    const membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_board_user", (q) => q.eq("boardId", boardId).eq("userId", user._id))
        .first();

    if (!membership || membership.role === "viewer") {
        throw new ConvexError("Insufficient permissions");
    }

    const board = await ctx.db.get(boardId);
    if (!board) {
        throw new ConvexError("Board not found");
    }

    return { user, board, role: membership.role as BoardRole };
}

export async function ensureWorkspaceAccess(
    ctx: Ctx,
    workspaceId: Id<"workspaces">,
    minimumRole: "member" | "admin" | "owner" = "member",
) {
    const user = await requireAuth(ctx);

    const member = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) =>
            q.eq("workspaceId", workspaceId).eq("userId", user._id),
        )
        .first();

    if (!member) {
        throw new ConvexError("Workspace access denied");
    }

    if (minimumRole === "owner" && member.role !== "owner") {
        throw new ConvexError("Owner permissions required");
    }

    if (minimumRole === "admin" && !["owner", "admin"].includes(member.role)) {
        throw new ConvexError("Admin permissions required");
    }

    return { user, role: member.role };
}

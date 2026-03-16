import { ConvexError } from "convex/values";

import type { DataModel, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

type Ctx = QueryCtx | MutationCtx;
type DbCtx = MutationCtx["db"];

export type BoardRole = "owner" | "admin" | "member" | "viewer";

const BOARD_ROLE_WEIGHT: Record<BoardRole, number> = {
    viewer: 0,
    member: 1,
    admin: 2,
    owner: 3,
};

type BoardReadAccessResult = {
    user: NonNullable<Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>>;
    board: DataModel["boards"]["document"];
    role: BoardRole;
    isDirectMember: boolean;
};

type BoardReadAccessForQueryResult = {
    user: Awaited<ReturnType<typeof authComponent.safeGetAuthUser>> | null;
    board: DataModel["boards"]["document"];
    role: BoardRole;
    isDirectMember: boolean;
    isAnonymous: boolean;
};

type BoardWriteAccessResult = {
    user: NonNullable<Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>>;
    board: DataModel["boards"]["document"];
    role: BoardRole;
};

export async function requireAuth(ctx: Ctx) {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
        throw new ConvexError("Unauthorized");
    }
    return user;
}

export async function getBoardForCard(ctx: Ctx, cardId: Id<"cards">) {
    const card = await ctx.db.get(cardId);
    if (!card) {
        throw new ConvexError("Card not found");
    }

    const board = await ctx.db.get(card.boardId);
    if (!board) {
        throw new ConvexError("Board not found");
    }

    return { card, board };
}

export async function getBoardForList(ctx: Ctx, listId: Id<"lists">) {
    const list = await ctx.db.get(listId);
    if (!list) {
        throw new ConvexError("List not found");
    }

    const board = await ctx.db.get(list.boardId);
    if (!board) {
        throw new ConvexError("Board not found");
    }

    return { list, board };
}

export async function ensureBoardReadAccess(
    ctx: Ctx,
    boardId: Id<"boards">,
): Promise<BoardReadAccessResult> {
    const user = await authComponent.safeGetAuthUser(ctx);
    const board = await ctx.db.get(boardId);
    if (!board) {
        throw new ConvexError("Board not found");
    }

    if (board.visibility === "public") {
        if (!user) throw new ConvexError("Unauthorized");
        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", boardId).eq("userId", user._id))
            .first();
        return {
            user,
            board,
            role: (membership?.role ?? "viewer") as BoardRole,
            isDirectMember: !!membership,
        };
    }

    if (!user) throw new ConvexError("Unauthorized");

    const membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_board_user", (q) => q.eq("boardId", boardId).eq("userId", user._id))
        .first();

    if (membership) {
        return { user, board, role: membership.role as BoardRole, isDirectMember: true };
    }

    if (board.visibility === "team" && board.workspaceId) {
        const workspaceMember = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", board.workspaceId!).eq("userId", user._id),
            )
            .first();

        if (workspaceMember) {
            return { user, board, role: "viewer", isDirectMember: false };
        }
    }

    throw new ConvexError("Access denied");
}

export async function ensureBoardReadAccessForQuery(
    ctx: Ctx,
    boardId: Id<"boards">,
): Promise<BoardReadAccessForQueryResult> {
    const user = await authComponent.safeGetAuthUser(ctx);
    const board = await ctx.db.get(boardId);
    if (!board) {
        throw new ConvexError("Board not found");
    }

    if (board.visibility === "public") {
        if (!user) {
            return {
                user: null,
                board,
                role: "viewer",
                isDirectMember: false,
                isAnonymous: true,
            };
        }

        const membership = await ctx.db
            .query("boardMembers")
            .withIndex("by_board_user", (q) => q.eq("boardId", boardId).eq("userId", user._id))
            .first();

        return {
            user,
            board,
            role: (membership?.role ?? "viewer") as BoardRole,
            isDirectMember: !!membership,
            isAnonymous: false,
        };
    }

    const authUser = await requireAuth(ctx);

    const membership = await ctx.db
        .query("boardMembers")
        .withIndex("by_board_user", (q) => q.eq("boardId", boardId).eq("userId", authUser._id))
        .first();

    if (membership) {
        return {
            user: authUser,
            board,
            role: membership.role as BoardRole,
            isDirectMember: true,
            isAnonymous: false,
        };
    }

    if (board.visibility === "team" && board.workspaceId) {
        const workspaceMember = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) =>
                q.eq("workspaceId", board.workspaceId!).eq("userId", authUser._id),
            )
            .first();

        if (workspaceMember) {
            return {
                user: authUser,
                board,
                role: "viewer",
                isDirectMember: false,
                isAnonymous: false,
            };
        }
    }

    throw new ConvexError("Access denied");
}

export async function ensureBoardWriteAccess(
    ctx: Ctx,
    boardId: Id<"boards">,
): Promise<BoardWriteAccessResult> {
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

export async function ensureBoardRole(
    ctx: Ctx,
    boardId: Id<"boards">,
    minimumRole: "member" | "admin" | "owner" = "member",
): Promise<BoardWriteAccessResult> {
    const access = await ensureBoardWriteAccess(ctx, boardId);

    if (BOARD_ROLE_WEIGHT[access.role] < BOARD_ROLE_WEIGHT[minimumRole]) {
        throw new ConvexError("Insufficient permissions");
    }

    return access;
}

export async function ensureCardReadAccess(ctx: Ctx, cardId: Id<"cards">) {
    const { card, board } = await getBoardForCard(ctx, cardId);
    const boardAccess = await ensureBoardReadAccess(ctx, board._id);

    return {
        ...boardAccess,
        card,
    };
}

export async function ensureCardWriteAccess(
    ctx: Ctx,
    cardId: Id<"cards">,
    minimumRole: "member" | "admin" | "owner" = "member",
) {
    const { card, board } = await getBoardForCard(ctx, cardId);
    const boardAccess = await ensureBoardRole(ctx, board._id, minimumRole);

    return {
        ...boardAccess,
        card,
    };
}

export async function ensureListWriteAccess(
    ctx: Ctx,
    listId: Id<"lists">,
    minimumRole: "member" | "admin" | "owner" = "member",
) {
    const { list, board } = await getBoardForList(ctx, listId);
    const boardAccess = await ensureBoardRole(ctx, board._id, minimumRole);

    return {
        ...boardAccess,
        list,
    };
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

export async function assertNotRateLimited(
    ctx: MutationCtx,
    args: {
        key: string;
        windowMs: number;
        max: number;
        now?: number;
    },
) {
    const now = args.now ?? Date.now();

    if (!Number.isFinite(args.windowMs) || args.windowMs <= 0) {
        throw new ConvexError("Invalid rate limit window");
    }
    if (!Number.isFinite(args.max) || args.max <= 0) {
        throw new ConvexError("Invalid rate limit max");
    }

    const rows = await ctx.db
        .query("rateLimit")
        .filter((q) => q.eq(q.field("key"), args.key))
        .collect();

    const existing = rows[0] ?? null;
    if (!existing) {
        await ctx.db.insert("rateLimit", {
            key: args.key,
            count: 1,
            lastRequest: now,
        });
        return { allowed: true, remaining: args.max - 1, resetAt: now + args.windowMs };
    }

    const resetAt = existing.lastRequest + args.windowMs;
    if (now >= resetAt) {
        await ctx.db.patch(existing._id, {
            count: 1,
            lastRequest: now,
        });
        return { allowed: true, remaining: args.max - 1, resetAt: now + args.windowMs };
    }

    if (existing.count >= args.max) {
        throw new ConvexError("Rate limit exceeded");
    }

    const newCount = existing.count + 1;
    await ctx.db.patch(existing._id, {
        count: newCount,
        lastRequest: now,
    });

    return { allowed: true, remaining: Math.max(0, args.max - newCount), resetAt };
}

export async function purgeExpiredRateLimitEntries(
    db: DbCtx,
    olderThanMs: number,
    now: number = Date.now(),
) {
    if (!Number.isFinite(olderThanMs) || olderThanMs <= 0) {
        throw new ConvexError("Invalid expiry window");
    }

    const cutoff = now - olderThanMs;
    const rows = await db.query("rateLimit").collect();

    let deleted = 0;
    for (const row of rows) {
        if (row.lastRequest < cutoff) {
            await db.delete(row._id);
            deleted += 1;
        }
    }

    return { deleted };
}

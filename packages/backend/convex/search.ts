import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Global search across boards and cards the user has access to
 */
export const globalSearch = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const searchQuery = args.query.toLowerCase().trim();
        if (!searchQuery) return { boards: [], cards: [] };

        const limit = args.limit ?? 10;

        // Get all boards the user has access to
        const memberships = await ctx.db
            .query("boardMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const boardIds = memberships.map((m) => m.boardId);

        // Search boards
        const allBoards = await Promise.all(boardIds.map((id) => ctx.db.get(id)));

        const matchingBoards = allBoards
            .filter(
                (b) =>
                    b &&
                    !b.archived &&
                    (b.title.toLowerCase().includes(searchQuery) ||
                        b.description?.toLowerCase().includes(searchQuery)),
            )
            .slice(0, limit)
            .map((b) => ({
                _id: b!._id,
                title: b!.title,
                description: b!.description,
                color: b!.color,
                type: "board" as const,
            }));

        // Search cards across all accessible boards
        const allCards = await Promise.all(
            boardIds.map(async (boardId) => {
                const cards = await ctx.db
                    .query("cards")
                    .withIndex("by_board", (q) => q.eq("boardId", boardId))
                    .filter((q) => q.eq(q.field("archived"), false))
                    .collect();
                return cards;
            }),
        );

        const flatCards = allCards.flat();
        const matchingCards = flatCards
            .filter(
                (c) =>
                    c.title.toLowerCase().includes(searchQuery) ||
                    c.description?.toLowerCase().includes(searchQuery),
            )
            .slice(0, limit);

        // Enrich cards with board info
        const enrichedCards = await Promise.all(
            matchingCards.map(async (card) => {
                const board = await ctx.db.get(card.boardId);
                const list = await ctx.db.get(card.listId);
                return {
                    _id: card._id,
                    title: card.title,
                    description: card.description,
                    boardId: card.boardId,
                    boardTitle: board?.title ?? "Unknown Board",
                    boardColor: board?.color,
                    listTitle: list?.title ?? "Unknown List",
                    priority: card.priority,
                    completed: card.completed,
                    type: "card" as const,
                };
            }),
        );

        return {
            boards: matchingBoards,
            cards: enrichedCards,
        };
    },
});

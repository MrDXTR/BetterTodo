import { describe, expect, it } from "bun:test";

import { parseBoardTransferPayload } from "../../packages/backend/convex/lib/boardTransfer";

describe("boardTransfer payload validation", () => {
    it("rejects missing board data", () => {
        expect(() => parseBoardTransferPayload(JSON.stringify({ lists: [], cards: [] }))).toThrow();
    });

    it("rejects missing lists", () => {
        expect(() =>
            parseBoardTransferPayload(JSON.stringify({ board: { title: "A" }, cards: [] })),
        ).toThrow();
    });

    it("accepts a minimal board payload", () => {
        const parsed = parseBoardTransferPayload(
            JSON.stringify({
                board: { title: "Minimal" },
                lists: [{ _id: "l1", title: "Todo", position: 0 }],
                cards: [{ _id: "c1", listId: "l1", title: "Task", position: 0 }],
            }),
        );

        expect(parsed.lists.length).toBe(1);
        expect(parsed.cards.length).toBe(1);
    });
});

import { describe, expect, it } from "bun:test";

import {
    createImportedBoardTitle,
    normalizeExportFileName,
    parseBoardTransferPayload,
} from "../../packages/backend/convex/lib/boardTransfer";

describe("boardTransfer helpers", () => {
    it("normalizes export file names", () => {
        expect(normalizeExportFileName("Marketing Sprint 2026!!")).toBe(
            "marketing-sprint-2026-export.json",
        );
    });

    it("prefers custom import title", () => {
        expect(createImportedBoardTitle("Roadmap", "Q2 Plan")).toBe("Q2 Plan");
    });

    it("parses valid payload", () => {
        const payload = JSON.stringify({
            board: { title: "Sample" },
            lists: [],
            cards: [],
        });

        const parsed = parseBoardTransferPayload(payload);
        expect(parsed.board.title).toBe("Sample");
    });
});

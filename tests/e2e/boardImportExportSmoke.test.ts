import { describe, expect, it } from "bun:test";

import {
    createImportedBoardTitle,
    normalizeExportFileName,
    parseBoardTransferPayload,
} from "../../packages/backend/convex/lib/boardTransfer";

describe("board transfer smoke", () => {
    it("simulates export->import metadata flow", () => {
        const exportName = normalizeExportFileName("My Team Board");
        const payload = JSON.stringify({
            board: { title: "My Team Board" },
            lists: [{ _id: "l1", title: "Backlog", position: 0 }],
            cards: [{ _id: "c1", listId: "l1", title: "Ship feature", position: 0 }],
        });

        const parsed = parseBoardTransferPayload(payload);
        const importedTitle = createImportedBoardTitle(parsed.board.title);

        expect(exportName).toBe("my-team-board-export.json");
        expect(importedTitle).toBe("My Team Board (Imported)");
    });
});

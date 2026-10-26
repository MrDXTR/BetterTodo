import { describe, expect, it } from "bun:test";

import {
    createImportedBoardTitle,
    formatCopyTitle,
    generateCopyBoardTitle,
    getBaseBoardTitle,
    getCopyNumber,
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

    describe("copy board title generation", () => {
        it("identifies base title correctly", () => {
            expect(getBaseBoardTitle("Product Roadmap")).toBe("Product Roadmap");
            expect(getBaseBoardTitle("Product Roadmap copy")).toBe("Product Roadmap");
            expect(getBaseBoardTitle("Product Roadmap copy 1")).toBe("Product Roadmap");
            expect(getBaseBoardTitle("Product Roadmap copy 2")).toBe("Product Roadmap");
            expect(getBaseBoardTitle("Product Roadmap (copy)")).toBe("Product Roadmap");
            expect(getBaseBoardTitle("Product Roadmap (copy 1)")).toBe("Product Roadmap");
        });

        it("identifies copy numbers correctly", () => {
            expect(getCopyNumber("Product Roadmap")).toBeNull();
            expect(getCopyNumber("Product Roadmap copy")).toBe(0);
            expect(getCopyNumber("Product Roadmap copy 1")).toBe(1);
            expect(getCopyNumber("Product Roadmap copy 2")).toBe(2);
            expect(getCopyNumber("Product Roadmap (copy)")).toBe(0);
            expect(getCopyNumber("Product Roadmap (copy 3)")).toBe(3);
        });

        it("formats copy title according to specification (copy, copy 1, copy 2)", () => {
            expect(formatCopyTitle("My Board", 0)).toBe("My Board copy");
            expect(formatCopyTitle("My Board", 1)).toBe("My Board copy 1");
            expect(formatCopyTitle("My Board", 2)).toBe("My Board copy 2");
            expect(formatCopyTitle("My Board", 3)).toBe("My Board copy 3");
        });

        it("generates sequence: copy, copy 1, copy 2", () => {
            const first = generateCopyBoardTitle("Launch Plan", ["Launch Plan"]);
            expect(first).toBe("Launch Plan copy");

            const second = generateCopyBoardTitle("Launch Plan", [
                "Launch Plan",
                "Launch Plan copy",
            ]);
            expect(second).toBe("Launch Plan copy 1");

            const third = generateCopyBoardTitle("Launch Plan", [
                "Launch Plan",
                "Launch Plan copy",
                "Launch Plan copy 1",
            ]);
            expect(third).toBe("Launch Plan copy 2");

            const fourth = generateCopyBoardTitle("Launch Plan", [
                "Launch Plan",
                "Launch Plan copy",
                "Launch Plan copy 1",
                "Launch Plan copy 2",
            ]);
            expect(fourth).toBe("Launch Plan copy 3");
        });

        it("advances when copying an existing copy board directly", () => {
            // Copying "Launch Plan copy" should create "Launch Plan copy 1"
            expect(
                generateCopyBoardTitle("Launch Plan copy", ["Launch Plan", "Launch Plan copy"]),
            ).toBe("Launch Plan copy 1");

            // Copying "Launch Plan copy 1" should create "Launch Plan copy 2"
            expect(
                generateCopyBoardTitle("Launch Plan copy 1", [
                    "Launch Plan",
                    "Launch Plan copy",
                    "Launch Plan copy 1",
                ]),
            ).toBe("Launch Plan copy 2");
        });

        it("handles case-insensitive title checks", () => {
            expect(generateCopyBoardTitle("Sprint", ["sprint", "sprint copy"])).toBe(
                "Sprint copy 1",
            );
        });
    });
});

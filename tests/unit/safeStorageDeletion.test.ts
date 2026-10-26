import { describe, expect, it, mock } from "bun:test";
import { deleteStorageIfUnreferenced } from "../../packages/backend/convex/files";

describe("deleteStorageIfUnreferenced", () => {
    it("deletes storage file when no cards or attachments reference it", async () => {
        const deletedStorageIds: string[] = [];

        const mockCtx = {
            db: {
                query: (table: string) => ({
                    withIndex: (_index: string, _filter: any) => ({
                        first: async () => null,
                    }),
                }),
            },
            storage: {
                delete: async (id: string) => {
                    deletedStorageIds.push(id);
                },
            },
        } as any;

        await deleteStorageIfUnreferenced(mockCtx, "storage_123" as any);

        expect(deletedStorageIds).toEqual(["storage_123"]);
    });

    it("preserves storage file when another card references it as cover", async () => {
        const deletedStorageIds: string[] = [];

        const mockCtx = {
            db: {
                query: (table: string) => ({
                    withIndex: (_index: string, _filter: any) => ({
                        first: async () => {
                            if (table === "cards") {
                                return { _id: "card_copied", coverStorageId: "storage_123" };
                            }
                            return null;
                        },
                    }),
                }),
            },
            storage: {
                delete: async (id: string) => {
                    deletedStorageIds.push(id);
                },
            },
        } as any;

        await deleteStorageIfUnreferenced(mockCtx, "storage_123" as any);

        expect(deletedStorageIds).toHaveLength(0);
    });

    it("preserves storage file when an attachment references it", async () => {
        const deletedStorageIds: string[] = [];

        const mockCtx = {
            db: {
                query: (table: string) => ({
                    withIndex: (_index: string, _filter: any) => ({
                        first: async () => {
                            if (table === "attachments") {
                                return { _id: "attachment_1", storageId: "storage_123" };
                            }
                            return null;
                        },
                    }),
                }),
            },
            storage: {
                delete: async (id: string) => {
                    deletedStorageIds.push(id);
                },
            },
        } as any;

        await deleteStorageIfUnreferenced(mockCtx, "storage_123" as any);

        expect(deletedStorageIds).toHaveLength(0);
    });

    it("gracefully catches and suppresses storage deletion errors", async () => {
        const mockCtx = {
            db: {
                query: () => ({
                    withIndex: () => ({
                        first: async () => null,
                    }),
                }),
            },
            storage: {
                delete: async () => {
                    throw new Error("Storage file already missing");
                },
            },
        } as any;

        // Should not throw
        await expect(
            deleteStorageIfUnreferenced(mockCtx, "storage_already_gone" as any),
        ).resolves.toBeUndefined();
    });
});

import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Generate a short-lived upload URL for file storage.
 * The URL expires in 1 hour.
 */
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Safely delete a file from Convex storage only if no card or attachment
 * in the database is currently referencing it.
 */
export async function deleteStorageIfUnreferenced(ctx: MutationCtx, storageId: Id<"_storage">) {
    const [referencingCard, referencingAttachment] = await Promise.all([
        ctx.db
            .query("cards")
            .withIndex("by_cover_storage", (q) => q.eq("coverStorageId", storageId))
            .first(),
        ctx.db
            .query("attachments")
            .withIndex("by_storage", (q) => q.eq("storageId", storageId))
            .first(),
    ]);

    if (!referencingCard && !referencingAttachment) {
        try {
            await ctx.storage.delete(storageId);
        } catch {
            // Storage file may already be deleted or not found
        }
    }
}

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

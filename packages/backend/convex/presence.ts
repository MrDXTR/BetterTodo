// =============================================================
// PRESENCE SYSTEM — DISABLED
// The heartbeat and presence queries have been commented out
// because the frequent mutations were blocking other API calls.
// =============================================================

// import { v } from "convex/values";
// import { mutation, query } from "./_generated/server";
// import { authComponent } from "./auth";

// const PRESENCE_TIMEOUT = 30 * 1000; // 30 seconds

// /**
//  * Update user presence (heartbeat)
//  */
// export const heartbeat = mutation({
//     args: {
//         boardId: v.id("boards"),
//         cursor: v.optional(
//             v.object({
//                 x: v.number(),
//                 y: v.number(),
//                 cardId: v.optional(v.id("cards")),
//             })
//         ),
//     },
//     handler: async (ctx, args) => {
//         const user = await authComponent.safeGetAuthUser(ctx);
//         if (!user) return null; // Silent fail if not auth
//
//         const now = Date.now();
//
//         // Check if existing presence record exists
//         const existing = await ctx.db
//             .query("presence")
//             .withIndex("by_board_user", (q) =>
//                 q.eq("boardId", args.boardId).eq("userId", user._id)
//             )
//             .first();
//
//         if (existing) {
//             await ctx.db.patch(existing._id, {
//                 updatedAt: now,
//                 cursor: args.cursor,
//             });
//         } else {
//             await ctx.db.insert("presence", {
//                 boardId: args.boardId,
//                 userId: user._id,
//                 updatedAt: now,
//                 cursor: args.cursor,
//             });
//         }
//     },
// });

// /**
//  * Get active users on a board
//  */
// export const getPresence = query({
//     args: { boardId: v.id("boards") },
//     handler: async (ctx, args) => {
//         const user = await authComponent.safeGetAuthUser(ctx);
//         if (!user) return [];
//
//         const now = Date.now();
//         const activeThreshold = now - PRESENCE_TIMEOUT;
//
//         // Get all presence records for this board
//         const presenceRecords = await ctx.db
//             .query("presence")
//             .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
//             .filter((q) => q.gte(q.field("updatedAt"), activeThreshold))
//             .collect();
//
//         // Join with user data
//         const activeUsers = await Promise.all(
//             presenceRecords.map(async (p) => {
//                 // Skip if it's the current user (optional, but usually we want to see others)
//                 if (p.userId === user._id) return null;
//
//                 const authUser = await authComponent.getAnyUserById(ctx, p.userId);
//                 if (!authUser) return null;
//
//                 return {
//                     _id: p._id,
//                     userId: p.userId,
//                     boardId: p.boardId,
//                     updatedAt: p.updatedAt,
//                     cursor: p.cursor,
//                     user: {
//                         name: authUser.name,
//                         email: authUser.email,
//                         image: authUser.image,
//                     },
//                 };
//             })
//         );
//
//         return activeUsers.filter((u) => u !== null);
//     },
// });

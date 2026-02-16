// =============================================================
// PRESENCE HOOK — DISABLED
// The heartbeat and cursor tracking have been disabled because
// the frequent mutations were blocking other API calls.
// =============================================================

// import { useEffect, useState } from "react";
// import { useQuery, useMutation } from "convex/react";
// import { api } from "@BetterTodo/backend/convex/_generated/api";
// import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";

// const HEARTBEAT_INTERVAL = 5000; // 5 seconds

// export function usePresence(boardId: Id<"boards">) {
//     const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
//
//     // Fetch active users (exclude self)
//     const activeUsers = useQuery(api.presence.getPresence, { boardId });
//     const heartbeat = useMutation(api.presence.heartbeat);
//
//     // Heartbeat loop
//     useEffect(() => {
//         const interval = setInterval(() => {
//             heartbeat({
//                 boardId,
//                 cursor: cursor
//                     ? { x: cursor.x, y: cursor.y }
//                     : undefined,
//             }).catch(console.error);
//         }, HEARTBEAT_INTERVAL);
//
//         // Initial heartbeat
//         heartbeat({ boardId, cursor: cursor ? { x: cursor.x, y: cursor.y } : undefined });
//
//         return () => clearInterval(interval);
//     }, [boardId, heartbeat, cursor]);
//
//     // Track mouse movement
//     useEffect(() => {
//         const handleMouseMove = (e: MouseEvent) => {
//             // Only update local state, don't spam the server
//             // The heartbeat loop picks up the latest position
//             setCursor({
//                 x: e.clientX / window.innerWidth, // Normalize coordinates (0-1)
//                 y: e.clientY / window.innerHeight,
//             });
//         };
//
//         window.addEventListener("mousemove", handleMouseMove);
//         return () => window.removeEventListener("mousemove", handleMouseMove);
//     }, []);
//
//     return activeUsers;
// }

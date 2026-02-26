import { MousePointer2 } from "lucide-react";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";

interface CursorOverlayProps {
    users: Array<{
        _id: Id<"presence">;
        userId: string;
        user: {
            name: string | null;
            image?: string | null;
        };
        cursor?: {
            x: number;
            y: number;
        };
    }>;
}

const CURSOR_COLORS = [
    "#EF4444", // red-500
    "#F59E0B", // amber-500
    "#10B981", // emerald-500
    "#3B82F6", // blue-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#14B8A6", // teal-500
];

export function CursorOverlay({ users }: CursorOverlayProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {users.map((user) => {
                if (!user.cursor) return null;

                // Generate a consistent color based on user ID
                const colorIndex =
                    user.userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                    CURSOR_COLORS.length;
                const color = CURSOR_COLORS[colorIndex];

                return (
                    <div
                        key={user._id}
                        className="absolute transition-all duration-200 ease-out will-change-transform flex flex-col items-start gap-1"
                        style={{
                            left: `${user.cursor.x * 100}%`,
                            top: `${user.cursor.y * 100}%`,
                            transform: `translate(0px, 0px)`, // Ensure smooth movement
                        }}
                    >
                        <MousePointer2
                            className="h-4 w-4 fill-current text-current"
                            style={{ color }}
                        />
                        <div
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
                            style={{ backgroundColor: color }}
                        >
                            {user.user.name || "Anonymous"}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

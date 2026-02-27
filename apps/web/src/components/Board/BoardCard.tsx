import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

import type { Board } from "@/types/board";

interface BoardCardProps {
    board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
    const backgroundColor = board.color || "#0079BF";

    return (
        <Link to="/boards/$boardId" params={{ boardId: board._id }} className="group block">
            <div className="overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg">
                {/* Board Color Header */}
                <div
                    className="h-24 w-full transition-opacity group-hover:opacity-90"
                    style={{ backgroundColor }}
                />

                {/* Board Info */}
                <div className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2">{board.title}</h3>

                    {board.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {board.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="capitalize">{board.role || "member"}</span>
                        </div>
                        <span className="capitalize">{board.visibility}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { BoardView } from "@/components/Board/BoardView";
import { BoardSkeleton } from "@/components/Board/BoardSkeleton";

export const Route = createFileRoute("/boards/$boardId")({
    component: BoardRoute,
});

function BoardRoute() {
    const { boardId } = Route.useParams();
    const board = useQuery(api.boards.getById, { boardId: boardId as Id<"boards"> });

    if (board === undefined) {
        return (
            <div className="flex h-full flex-col overflow-hidden bg-background">
                <div className="h-12 shrink-0 border-b bg-muted/30" />
                <BoardSkeleton />
            </div>
        );
    }

    if (board === null) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Board not found</h2>
                    <p className="mt-2 text-muted-foreground">
                        This board doesn't exist or you don't have access to it.
                    </p>
                </div>
            </div>
        );
    }

    return <BoardView board={board} />;
}

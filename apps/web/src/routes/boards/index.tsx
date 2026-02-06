import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import { BoardCard } from "@/components/Board/BoardCard";
import { CreateBoardModal } from "@/components/Board/CreateBoardModal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/boards/")({
    component: BoardsRoute,
});

function BoardsRoute() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const boards = useQuery(api.boards.getAll);

    if (boards === undefined) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">Loading boards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Boards</h1>
                    <p className="mt-2 text-muted-foreground">
                        {boards.length === 0
                            ? "Create your first board to get started"
                            : `${boards.length} board${boards.length === 1 ? "" : "s"}`}
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Board
                </Button>
            </div>

            {boards.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">No boards yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Get started by creating your first board
                        </p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4"
                            size="lg"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Create Your First Board
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {boards.map((board) => (
                        <BoardCard key={board._id} board={board} />
                    ))}
                </div>
            )}

            <CreateBoardModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    );
}

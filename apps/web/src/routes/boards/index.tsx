import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Archive, Loader2, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BoardCard } from "@/components/Board/BoardCard";
import { CreateBoardModal } from "@/components/Board/CreateBoardModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/boards/")({
    component: BoardsRoute,
});

function BoardsRoute() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [restoringBoardId, setRestoringBoardId] = useState<Id<"boards"> | null>(null);

    const boards = useQuery(api.boards.getAll);
    const archived = useQuery(api.boards.getArchived, {});
    const restoreBoard = useMutation(api.boards.restore);

    const isLoading = boards === undefined || archived === undefined;
    const archivedBoards = archived?.boards ?? [];

    const handleRestoreBoard = async (boardId: Id<"boards">) => {
        setRestoringBoardId(boardId);
        try {
            await restoreBoard({ boardId });
            toast.success("Board restored");
        } catch (error: any) {
            toast.error(error?.message || "Failed to restore board");
        } finally {
            setRestoringBoardId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-36" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-56 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">My Boards</h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
                        Browse active boards and restore archived ones.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Board
                </Button>
            </div>

            <Tabs defaultValue="active" className="space-y-5">
                <TabsList>
                    <TabsTrigger value="active" className="gap-2">
                        Active
                        <Badge variant="secondary">{boards?.length ?? 0}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="gap-2">
                        Archived
                        <Badge variant="secondary">{archivedBoards.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    {!boards || boards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">No active boards</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Create your first board to get started.
                                </p>
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="mt-4"
                                    size="lg"
                                >
                                    <Plus className="mr-2 h-5 w-5" />
                                    Create Board
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
                </TabsContent>

                <TabsContent value="archived">
                    {archivedBoards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border py-16">
                            <Archive className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <h3 className="text-lg font-semibold">No archived boards</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Archived boards will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {archivedBoards.map((board: any) => (
                                <div key={board._id} className="rounded-lg border bg-card p-4">
                                    <div
                                        className="mb-3 h-16 rounded-md"
                                        style={{ backgroundColor: board.color ?? "#0079BF" }}
                                    />
                                    <h3 className="line-clamp-2 text-base font-semibold">
                                        {board.title}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {board.description || "No description"}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <Badge variant="outline" className="capitalize">
                                            {board.visibility}
                                        </Badge>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => handleRestoreBoard(board._id)}
                                            disabled={restoringBoardId === board._id}
                                        >
                                            {restoringBoardId === board._id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4" />
                                            )}
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <CreateBoardModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        </div>
    );
}

import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Archive, Loader2, Plus, RotateCcw, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { BoardCard } from "@/components/Board/BoardCard";
import { CreateBoardModal } from "@/components/Board/CreateBoardModal";
import { WorkspaceMobileStrip, WorkspaceSidebar } from "@/components/Board/WorkspacePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/boards/")({
    component: BoardsRoute,
});

function BoardsRoute() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [restoringBoardId, setRestoringBoardId] = useState<Id<"boards"> | null>(null);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"workspaces"> | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const boards = useQuery(api.boards.getAll);
    const archived = useQuery(api.boards.getArchived, {});
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);
    const restoreBoard = useMutation(api.boards.restore);

    const isLoading = boards === undefined || archived === undefined;
    const archivedBoards = archived?.boards ?? [];

    const workspaceFilteredBoards = useMemo(() => {
        return (boards ?? []).filter(
            (b) => selectedWorkspaceId === null || b.workspaceId === selectedWorkspaceId,
        );
    }, [boards, selectedWorkspaceId]);

    const filteredBoards = useMemo(() => {
        if (!searchQuery.trim()) return workspaceFilteredBoards;
        const q = searchQuery.toLowerCase().trim();
        return workspaceFilteredBoards.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                (b.description && b.description.toLowerCase().includes(q)),
        );
    }, [workspaceFilteredBoards, searchQuery]);

    const selectedWorkspaceName =
        selectedWorkspaceId === null
            ? "All Boards"
            : (workspaces?.find((w) => w._id === selectedWorkspaceId)?.name ?? "Workspace");

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
            <div className="flex h-full overflow-hidden">
                <div className="hidden md:flex w-56 shrink-0 flex-col gap-2 border-r p-4">
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-7 w-4/5" />
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden bg-background">
            <aside className="hidden md:block w-56 shrink-0 border-r border-border/70 overflow-y-auto bg-card/30">
                <div className="p-3 pt-4">
                    <WorkspaceSidebar
                        selectedId={selectedWorkspaceId}
                        onSelect={setSelectedWorkspaceId}
                    />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="px-5 py-6 sm:px-8">
                    <div className="mb-5 md:hidden">
                        <WorkspaceMobileStrip
                            selectedId={selectedWorkspaceId}
                            onSelect={setSelectedWorkspaceId}
                        />
                    </div>

                    {/* Page Header */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                {selectedWorkspaceName}
                            </h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {selectedWorkspaceId === null
                                    ? "All boards across your workspaces."
                                    : `${workspaceFilteredBoards.length} board${workspaceFilteredBoards.length === 1 ? "" : "s"} in this workspace.`}
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            size="sm"
                            className="w-full sm:w-auto shrink-0 h-9 gap-1.5 text-xs"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Board</span>
                        </Button>
                    </div>

                    {/* Tabs & Search Row */}
                    <Tabs defaultValue="active" className="space-y-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                            <TabsList className="h-8">
                                <TabsTrigger value="active" className="gap-1.5 text-xs">
                                    <span>Active</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                        {workspaceFilteredBoards.length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="archived" className="gap-1.5 text-xs">
                                    <span>Archived</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                        {archivedBoards.length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            {/* Search Filter */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter boards..."
                                    className="h-8 text-xs pl-8 pr-7 bg-card/60"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active boards */}
                        <TabsContent value="active">
                            {workspaceFilteredBoards.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 py-16 px-4 text-center bg-muted/10">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 mb-3 text-muted-foreground">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">No active boards</h3>
                                    <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                                        {selectedWorkspaceId
                                            ? "No boards in this workspace yet. Create one or choose a template to get started."
                                            : "Create your first board to organize your tasks, workflows, and ideas."}
                                    </p>
                                    <Button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="mt-4 h-8 text-xs gap-1.5"
                                        size="sm"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Create Board</span>
                                    </Button>
                                </div>
                            ) : filteredBoards.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-xs text-muted-foreground">
                                        No boards match "{searchQuery}".
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 text-xs h-7"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        Clear filter
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {/* Quick Create Board Tile */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="group relative flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 border-dashed border-border/80 bg-muted/15 p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-[border-color,background-color,transform] duration-150 cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/70 shadow-2xs group-hover:scale-105 group-hover:border-primary/40 transition-transform duration-150">
                                            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <p className="mt-3 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                            Create new board
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            Start fresh or pick a template
                                        </p>
                                    </button>

                                    {filteredBoards.map((board) => (
                                        <BoardCard key={board._id} board={board} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Archived boards */}
                        <TabsContent value="archived">
                            {archivedBoards.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 py-16 px-4 bg-muted/10 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 mb-3 text-muted-foreground/60">
                                        <Archive className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">No archived boards</h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Boards you archive will appear here for safe keeping.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {archivedBoards.map((board: any) => (
                                        <div
                                            key={board._id}
                                            className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs space-y-3"
                                        >
                                            <div
                                                className="h-16 w-full rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"
                                                style={{
                                                    backgroundColor: board.color ?? "#0079BF",
                                                }}
                                            />
                                            <div>
                                                <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                                                    {board.title}
                                                </h3>
                                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                    {board.description || "No description"}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                <Badge variant="outline" className="capitalize text-[10px] h-5">
                                                    {board.visibility}
                                                </Badge>
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    className="gap-1.5 h-7 text-xs px-2.5"
                                                    onClick={() => handleRestoreBoard(board._id)}
                                                    disabled={restoringBoardId === board._id}
                                                >
                                                    {restoringBoardId === board._id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-3 w-3" />
                                                    )}
                                                    <span>Restore</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <CreateBoardModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        </div>
    );
}

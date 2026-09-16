import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Archive, Loader2, Plus, RotateCcw, Search, Settings, X } from "lucide-react";
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
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    {selectedWorkspaceName}
                                </h1>
                                {selectedWorkspaceId !== null && (
                                    <Link
                                        to="/workspaces/$workspaceId"
                                        params={{ workspaceId: selectedWorkspaceId }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/70 bg-card hover:bg-muted text-foreground transition-colors active:scale-[0.97]"
                                        title="Workspace settings"
                                    >
                                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Settings</span>
                                    </Link>
                                )}
                            </div>
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
                                    <p className="text-sm font-medium text-foreground">
                                        No boards in this workspace
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Get started by creating your first board.
                                    </p>
                                    <Button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        size="sm"
                                        className="mt-4 gap-1.5 text-xs"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Create Board</span>
                                    </Button>
                                </div>
                            ) : filteredBoards.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-12 px-4 text-center bg-muted/10">
                                    <p className="text-sm text-muted-foreground">
                                        No boards matching "{searchQuery}"
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery("")}
                                        className="mt-2 text-xs"
                                    >
                                        Clear filter
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {/* Create New Board Quick Tile */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="group relative flex min-h-[170px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/30 cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-200" />
                                        </div>
                                        <span className="mt-3 text-xs font-semibold text-foreground">
                                            Create new board
                                        </span>
                                        <span className="mt-0.5 text-[11px] text-muted-foreground">
                                            Start with an empty board
                                        </span>
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
                                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 py-16 px-4 text-center bg-muted/10">
                                    <Archive className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                    <p className="text-sm font-medium text-foreground">No archived boards</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Boards you archive will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {archivedBoards.map((board) => (
                                        <div
                                            key={board._id}
                                            className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-4 shadow-2xs hover:shadow-xs transition-shadow"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: board.color || "#0079BF" }}
                                                    />
                                                    <h3 className="font-semibold text-sm text-foreground truncate">
                                                        {board.title}
                                                    </h3>
                                                </div>
                                                {board.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {board.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                                <span className="text-[11px] text-muted-foreground">
                                                    Archived
                                                </span>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    disabled={restoringBoardId === board._id}
                                                    onClick={() => handleRestoreBoard(board._id)}
                                                    className="gap-1.5 text-xs h-7"
                                                >
                                                    {restoringBoardId === board._id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-3.5 w-3.5" />
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

            <CreateBoardModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                defaultWorkspaceId={selectedWorkspaceId ?? undefined}
            />
        </div>
    );
}

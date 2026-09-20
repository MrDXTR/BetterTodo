import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import {
    ArrowLeft,
    Archive,
    Check,
    CheckSquare,
    Layers3,
    ListTodo,
    Settings,
    SlidersHorizontal,
    Users,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Board, CardPriority } from "@/types/board";
import { BoardAvatars } from "@/components/Board/BoardAvatars";
import { BoardMembersPanel } from "@/components/Board/BoardMembersPanel";
import { ArchivedItemsPanel } from "@/components/Board/ArchivedItemsPanel";
import { BoardSettingsModal } from "@/components/Board/BoardSettingsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface BoardHeaderProps {
    board: Board;
    members?: any[];
    stats?: {
        lists: number;
        cards: number;
        checklistItemsCompleted: number;
        checklistItemsTotal: number;
    };
    // Filter props
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    activeLabelIds: string[];
    activePriorities: CardPriority[];
    toggleLabelFilter: (labelId: string) => void;
    togglePriorityFilter: (priority: CardPriority) => void;
    clearFilters: () => void;
    boardLabels?: { _id: string; name: string; color: string }[];
    hasActiveFilters: boolean;
}

const PRIORITY_COLORS: Record<CardPriority, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
};

export function BoardHeader({
    board,
    members = [],
    stats,
    showFilters,
    setShowFilters,
    activeLabelIds,
    activePriorities,
    toggleLabelFilter,
    togglePriorityFilter,
    clearFilters,
    boardLabels,
    hasActiveFilters,
}: BoardHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(board.title);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);

    useEffect(() => {
        setTitle(board.title);
    }, [board.title]);

    const updateBoard = useMutation(api.boards.update);

    const handleSaveTitle = async () => {
        if (!title.trim() || title === board.title) {
            setTitle(board.title);
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateBoard({
                boardId: board._id,
                title: title.trim(),
            });
            setIsEditingTitle(false);
            toast.success("Board title updated");
        } catch (error) {
            console.error("Error updating board title:", error);
            toast.error("Failed to update board title");
            setTitle(board.title);
        }
    };

    const boardColor = board.color || "#0079BF";
    const controlButtonClass =
        "h-8 px-2.5 text-xs text-foreground/75 hover:text-foreground hover:bg-accent transition-[background-color,color,transform] active:scale-[0.97]";

    return (
        <header className="relative border-b border-border/60 bg-background/85 backdrop-blur-md">
            <div className="px-4 sm:px-6 py-3">
                {/* Row 1: Back button, title, controls */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Link to="/boards" className="shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground hover:bg-accent transition-[background-color,color,transform] active:scale-[0.97]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                            className="h-3 w-3 rounded-full shrink-0 ring-2 ring-background ring-offset-1 ring-offset-border/30"
                            style={{ background: boardColor }}
                        />

                        {isEditingTitle ? (
                            <Input
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTitle();
                                    if (e.key === "Escape") {
                                        setTitle(board.title);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                className="h-8 max-w-sm font-semibold text-sm bg-background border-border/80 shadow-2xs"
                                maxLength={100}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsEditingTitle(true)}
                                className="truncate rounded-md px-2 py-1 text-left text-sm font-semibold text-foreground hover:bg-muted/60 transition-[background-color] max-w-full cursor-pointer"
                            >
                                {board.title}
                            </button>
                        )}
                    </div>

                    <div className="ml-auto shrink-0 flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 p-0.5">
                        <BoardAvatars users={members} />

                        <Button
                            variant="ghost"
                            size="sm"
                            className={controlButtonClass}
                            onClick={() => setMembersOpen(true)}
                        >
                            <Users className="h-3.5 w-3.5" />
                            <span className="hidden md:inline ml-1.5">Members</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={controlButtonClass}
                            onClick={() => setArchivedOpen(true)}
                        >
                            <Archive className="h-3.5 w-3.5" />
                            <span className="hidden md:inline ml-1.5">Archived</span>
                        </Button>

                        {/* Filter Popover */}
                        <Popover open={showFilters} onOpenChange={setShowFilters}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        controlButtonClass,
                                        "relative",
                                        showFilters && "bg-accent text-foreground",
                                    )}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    <span className="hidden md:inline ml-1.5">Filter</span>
                                    {hasActiveFilters && (
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                sideOffset={8}
                                className="w-72 p-0 overflow-hidden"
                            >
                                {/* Popover header */}
                                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60">
                                    <span className="text-xs font-semibold">Filters</span>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-80 overflow-y-auto p-1">
                                    {/* Priority section */}
                                    <div className="px-2.5 pt-2 pb-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                            Priority
                                        </p>
                                        <div className="space-y-0.5">
                                            {(
                                                [
                                                    "urgent",
                                                    "high",
                                                    "medium",
                                                    "low",
                                                ] as CardPriority[]
                                            ).map((priority) => {
                                                const isActive =
                                                    activePriorities.includes(priority);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={priority}
                                                        onClick={() =>
                                                            togglePriorityFilter(priority)
                                                        }
                                                        className={cn(
                                                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                                                            isActive
                                                                ? "bg-accent text-accent-foreground font-medium"
                                                                : "text-foreground/80 hover:bg-muted/60",
                                                        )}
                                                    >
                                                        <span
                                                            className="h-2 w-2 rounded-full shrink-0"
                                                            style={{
                                                                background:
                                                                    PRIORITY_COLORS[priority],
                                                            }}
                                                        />
                                                        <span className="capitalize flex-1 text-left">
                                                            {priority}
                                                        </span>
                                                        {isActive && (
                                                            <Check className="h-3 w-3 text-primary shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Labels section */}
                                    {boardLabels && boardLabels.length > 0 && (
                                        <div className="px-2.5 pt-2 pb-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                Labels
                                            </p>
                                            <div className="space-y-0.5">
                                                {boardLabels.map((label) => {
                                                    const isActive = activeLabelIds.includes(
                                                        label._id,
                                                    );
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={label._id}
                                                            onClick={() =>
                                                                toggleLabelFilter(label._id)
                                                            }
                                                            className={cn(
                                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                                                                isActive
                                                                    ? "bg-accent text-accent-foreground font-medium"
                                                                    : "text-foreground/80 hover:bg-muted/60",
                                                            )}
                                                        >
                                                            <span
                                                                className="h-2 w-2 rounded-full shrink-0"
                                                                style={{ background: label.color }}
                                                            />
                                                            <span className="flex-1 text-left truncate">
                                                                {label.name}
                                                            </span>
                                                            {isActive && (
                                                                <Check className="h-3 w-3 text-primary shrink-0" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {(!boardLabels || boardLabels.length === 0) && (
                                        <div className="px-3 pt-1 pb-2">
                                            <p className="text-xs text-muted-foreground">
                                                No labels on this board yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-foreground/75 hover:text-foreground hover:bg-accent transition-[background-color,color,transform] active:scale-[0.97]"
                            onClick={() => setSettingsOpen(true)}
                            aria-label="Board settings"
                        >
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Row 2: stats + active filter chips */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex shrink-0 items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {board.visibility}
                    </span>

                    {stats && (
                        <>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                                <Layers3 className="h-3 w-3 shrink-0" />
                                {stats.lists} {stats.lists === 1 ? "list" : "lists"}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                                <ListTodo className="h-3 w-3 shrink-0" />
                                {stats.cards} {stats.cards === 1 ? "card" : "cards"}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                                <CheckSquare className="h-3 w-3 shrink-0" />
                                {stats.checklistItemsCompleted}/{stats.checklistItemsTotal} tasks
                            </span>
                        </>
                    )}

                    {/* Active filter chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-1 border-l border-border/60">
                            {activePriorities.map((p) => (
                                <button
                                    type="button"
                                    key={p}
                                    onClick={() => togglePriorityFilter(p)}
                                    className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-2xs hover:opacity-85 transition-opacity cursor-pointer"
                                    style={{ background: PRIORITY_COLORS[p] }}
                                >
                                    <span className="capitalize">{p}</span>
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            ))}
                            {activeLabelIds.map((id) => {
                                const label = boardLabels?.find((l) => l._id === id);
                                if (!label) return null;
                                return (
                                    <button
                                        type="button"
                                        key={id}
                                        onClick={() => toggleLabelFilter(id)}
                                        className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-2xs hover:opacity-85 transition-opacity cursor-pointer max-w-[160px]"
                                        style={{ background: label.color }}
                                        title={label.name}
                                    >
                                        <span className="truncate">{label.name}</span>
                                        <X className="h-2.5 w-2.5 shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Panels & Modals */}
            <BoardMembersPanel
                open={membersOpen}
                onOpenChange={setMembersOpen}
                boardId={board._id}
                currentUserRole={board.role}
            />

            <ArchivedItemsPanel
                open={archivedOpen}
                onOpenChange={setArchivedOpen}
                boardId={board._id}
            />

            <BoardSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} board={board} />
        </header>
    );
}

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";

import type { Board, CardPriority } from "@/types/board";
import { ListColumn } from "@/components/List/ListColumn";
import { BoardHeader } from "@/components/Board/BoardHeader";
import { BoardBackgroundGraphic, BoardEmptyStateGraphic } from "@/components/Board/BoardBackgroundGraphic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardViewProps {
    board: Board;
    isReadOnly?: boolean;
}

export function BoardView({ board, isReadOnly = false }: BoardViewProps) {
    const [optimisticBoard, setOptimisticBoard] = useState(board);
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState("");
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [freshListId, setFreshListId] = useState<string | null>(null);

    // Filtering states
    const [showFilters, setShowFilters] = useState(false);
    const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);
    const [activePriorities, setActivePriorities] = useState<CardPriority[]>([]);

    const createList = useMutation(api.lists.create);
    const updateListPosition = useMutation(api.lists.updatePosition);
    const moveCard = useMutation(api.cards.move);

    const boardLabels = useQuery(api.labels.getByBoard, {
        boardId: board._id,
    });
    const boardMembers = useQuery(api.boards.getMembers, {
        boardId: board._id,
    });

    useEffect(() => {
        setOptimisticBoard(board);
    }, [board]);

    const toggleLabelFilter = (labelId: string) => {
        setActiveLabelIds((prev) =>
            prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
        );
    };

    const togglePriorityFilter = (priority: CardPriority) => {
        setActivePriorities((prev) =>
            prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority],
        );
    };

    const clearFilters = () => {
        setActiveLabelIds([]);
        setActivePriorities([]);
    };

    const hasActiveFilters = activeLabelIds.length > 0 || activePriorities.length > 0;

    const filteredBoard = useMemo(() => {
        if (!hasActiveFilters) return optimisticBoard;

        return {
            ...optimisticBoard,
            lists: optimisticBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.filter((card) => {
                    const matchesPriority =
                        activePriorities.length === 0 ||
                        (card.priority && activePriorities.includes(card.priority));

                    const matchesLabels =
                        activeLabelIds.length === 0 ||
                        (card.labels &&
                            card.labels.some((l: any) => activeLabelIds.includes(l._id)));

                    return matchesPriority && matchesLabels;
                }),
            })),
        };
    }, [optimisticBoard, activeLabelIds, activePriorities, hasActiveFilters]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListTitle.trim() || isCreatingList) return;

        setIsCreatingList(true);
        try {
            const listId = await createList({
                boardId: board._id,
                title: newListTitle.trim(),
            });
            setNewListTitle("");
            setIsAddingList(false);
            if (listId) {
                setFreshListId(listId);
                setTimeout(() => setFreshListId(null), 1200);
            }
            toast.success("List created!");
        } catch (error) {
            console.error("Error creating list:", error);
            toast.error("Failed to create list");
        } finally {
            setIsCreatingList(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (isReadOnly) return;
        const { destination, source, draggableId, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        if (type === "list") {
            const newLists = Array.from(optimisticBoard.lists);
            const [movedList] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, movedList);

            setOptimisticBoard({
                ...optimisticBoard,
                lists: newLists,
            });

            try {
                await updateListPosition({
                    listId: draggableId as Id<"lists">,
                    newPosition: destination.index,
                });
            } catch (error) {
                console.error("Error updating list position:", error);
                toast.error("Failed to reorder list");
                setOptimisticBoard(board);
            }
            return;
        }

        if (type === "card") {
            const sourceList = optimisticBoard.lists.find((l) => l._id === source.droppableId);
            const destList = optimisticBoard.lists.find((l) => l._id === destination.droppableId);

            if (!sourceList || !destList) return;

            const sourceCards = Array.from(sourceList.cards);
            const destCards =
                source.droppableId === destination.droppableId
                    ? sourceCards
                    : Array.from(destList.cards);

            const [movedCard] = sourceCards.splice(source.index, 1);

            if (source.droppableId === destination.droppableId) {
                sourceCards.splice(destination.index, 0, movedCard);
                setOptimisticBoard({
                    ...optimisticBoard,
                    lists: optimisticBoard.lists.map((l) =>
                        l._id === sourceList._id ? { ...l, cards: sourceCards } : l,
                    ),
                });
            } else {
                destCards.splice(destination.index, 0, movedCard);
                setOptimisticBoard({
                    ...optimisticBoard,
                    lists: optimisticBoard.lists.map((l) => {
                        if (l._id === sourceList._id) return { ...l, cards: sourceCards };
                        if (l._id === destList._id) return { ...l, cards: destCards };
                        return l;
                    }),
                });
            }

            try {
                await moveCard({
                    cardId: draggableId as Id<"cards">,
                    targetListId: destination.droppableId as any,
                    newPosition: destination.index,
                });
            } catch (error) {
                console.error("Error moving card:", error);
                toast.error("Failed to move card");
                setOptimisticBoard(board);
            }
        }
    };

    const boardStats = useMemo(() => {
        let cards = 0;
        let checklistItemsTotal = 0;
        let checklistItemsCompleted = 0;

        for (const list of optimisticBoard.lists) {
            cards += list.cards.length;
            for (const card of list.cards) {
                checklistItemsTotal += card.checklistItemsTotal ?? 0;
                checklistItemsCompleted += card.checklistItemsCompleted ?? 0;
            }
        }

        return {
            cards,
            lists: optimisticBoard.lists.length,
            checklistItemsTotal,
            checklistItemsCompleted,
        };
    }, [optimisticBoard.lists]);

    return (
        <div className="flex h-full flex-col overflow-hidden relative bg-muted/25 dark:bg-background/95">
            {/* Minimal Ambient SVG Graphic in Board Color & Gradient (Light & Dark Mode) */}
            <BoardBackgroundGraphic color={board.color} />

            {/* Subtle neutral dot-grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                }}
            />

            <BoardHeader
                board={board}
                members={boardMembers || []}
                stats={boardStats}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                activeLabelIds={activeLabelIds}
                activePriorities={activePriorities}
                toggleLabelFilter={toggleLabelFilter}
                togglePriorityFilter={togglePriorityFilter}
                clearFilters={clearFilters}
                boardLabels={boardLabels ?? undefined}
                hasActiveFilters={hasActiveFilters}
            />

            {/* Custom scrollbars */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 7px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }\
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.2);
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.35);
                }
            `}</style>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 custom-scrollbar h-full relative z-10">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable
                        droppableId="board"
                        direction="horizontal"
                        type="list"
                        isDropDisabled={isReadOnly}
                    >
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex gap-4 h-full items-start"
                            >
                                {filteredBoard.lists.map((list, index) => (
                                    <ListColumn
                                        key={list._id}
                                        list={list}
                                        index={index}
                                        boardColor={board.color}
                                        isFresh={list._id === freshListId}
                                        isFiltered={hasActiveFilters}
                                        isReadOnly={isReadOnly}
                                    />
                                ))}
                                {provided.placeholder}
                                {optimisticBoard.lists.length === 0 && (
                                    <div className="w-80 rounded-2xl border border-dashed border-border/80 bg-background/70 backdrop-blur-sm p-6 text-center shadow-xs flex flex-col items-center">
                                        <BoardEmptyStateGraphic color={board.color} />
                                        <p className="text-xs font-semibold text-foreground">
                                            No lists on this board
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            Create your first list to start organizing cards and tasks.
                                        </p>
                                    </div>
                                )}

                                {/* Add List Button / Form */}
                                {!isReadOnly && (
                                    <div className="flex-shrink-0 w-72">
                                        {isAddingList ? (
                                            <form
                                                onSubmit={handleCreateList}
                                                className="rounded-xl p-3 bg-card/90 backdrop-blur-sm border border-border/70 shadow-sm space-y-2.5"
                                            >
                                                <Input
                                                    autoFocus
                                                    placeholder="Enter list title..."
                                                    value={newListTitle}
                                                    onChange={(e) =>
                                                        setNewListTitle(e.target.value)
                                                    }
                                                    onBlur={() => {
                                                        if (
                                                            !newListTitle.trim() &&
                                                            !isCreatingList
                                                        ) {
                                                            setIsAddingList(false);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            setIsAddingList(false);
                                                            setNewListTitle("");
                                                        }
                                                    }}
                                                    className="text-xs bg-background/80"
                                                />
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={
                                                            !newListTitle.trim() || isCreatingList
                                                        }
                                                        className="gap-1 text-xs h-7"
                                                    >
                                                        {isCreatingList ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Plus className="h-3.5 w-3.5" />
                                                        )}
                                                        <span>Add list</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setIsAddingList(false);
                                                            setNewListTitle("");
                                                        }}
                                                        className="h-7 w-7"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingList(true)}
                                                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/40 hover:bg-background/80 p-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150 hover:border-primary/50 shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer"
                                            >
                                                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                    <Plus className="h-3.5 w-3.5" />
                                                </div>
                                                <span>Add another list</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
}

export default BoardView;

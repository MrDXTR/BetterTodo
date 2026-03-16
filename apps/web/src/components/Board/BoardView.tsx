import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";

import type { BoardWithLists, CardPriority } from "@/types/board";
import { BoardHeader } from "./BoardHeader";
import { ListColumn } from "../List/ListColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardViewProps {
    board: BoardWithLists;
}

// IDs of lists that should play the "just born" entrance animation
type NewListId = string;

export function BoardView({ board }: BoardViewProps) {
    const isReadOnly = board.role === "viewer";

    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState("");
    const [isCreatingList, setIsCreatingList] = useState(false);

    // Track which list was just created so ListColumn can animate it
    const [freshListId, setFreshListId] = useState<NewListId | null>(null);

    // Used to detect the newly-added list after the board updates
    const prevListIdsRef = useRef<Set<string>>(new Set(board.lists.map((l) => l._id)));

    // Optimistic state for drag-and-drop
    const [optimisticBoard, setOptimisticBoard] = useState<BoardWithLists>(board);

    // -- Filters --
    const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);
    const [activePriorities, setActivePriorities] = useState<CardPriority[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const boardLabels = useQuery(api.labels.getByBoard, { boardId: board._id });

    // Sync optimistic state with actual board data when it changes
    useEffect(() => {
        const prevIds = prevListIdsRef.current;
        const newList = board.lists.find((l) => !prevIds.has(l._id));

        if (newList) {
            setFreshListId(newList._id);
            // Clear the "fresh" flag after the animation finishes (~700ms)
            const timer = setTimeout(() => setFreshListId(null), 700);
            prevListIdsRef.current = new Set(board.lists.map((l) => l._id));
            setOptimisticBoard(board);
            return () => clearTimeout(timer);
        }

        prevListIdsRef.current = new Set(board.lists.map((l) => l._id));
        setOptimisticBoard(board);
    }, [board]);

    // Fetch board members (replaces the old presence/heartbeat system)
    const boardMembers = useQuery(api.boards.getMembers, { boardId: board._id });

    const createList = useMutation(api.lists.create);
    const moveCard = useMutation(api.cards.move);
    const updateListPosition = useMutation(api.lists.updatePosition);

    // Filtered board derived from active label / priority filters
    const hasActiveFilters = activeLabelIds.length > 0 || activePriorities.length > 0;
    const filteredBoard = useMemo(() => {
        if (!hasActiveFilters) return optimisticBoard;

        return {
            ...optimisticBoard,
            lists: optimisticBoard.lists.map((list) => ({
                ...list,
                cards: list.cards.filter((card) => {
                    const labelMatch =
                        activeLabelIds.length === 0 ||
                        activeLabelIds.some((id) => card.labelIds?.includes(id));
                    const priorityMatch =
                        activePriorities.length === 0 ||
                        (card.priority && activePriorities.includes(card.priority));
                    return labelMatch && priorityMatch;
                }),
            })),
        };
    }, [optimisticBoard, activeLabelIds, activePriorities, hasActiveFilters]);

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

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (!newListTitle.trim()) return;

        setIsCreatingList(true);
        try {
            await createList({
                boardId: board._id,
                title: newListTitle.trim(),
            });
            setNewListTitle("");
            setIsAddingList(false);
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
        const { destination, source, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index)
            return;

        if (type === "list") {
            const newLists = Array.from(optimisticBoard.lists);
            const [movedList] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, movedList);
            setOptimisticBoard({ ...optimisticBoard, lists: newLists });

            try {
                await updateListPosition({
                    listId: result.draggableId as any,
                    newPosition: destination.index,
                });
            } catch (error) {
                console.error("Error moving list:", error);
                toast.error("Failed to move list");
                setOptimisticBoard(board);
            }
            return;
        }

        if (type === "card") {
            const sourceListIndex = optimisticBoard.lists.findIndex(
                (l) => l._id === source.droppableId,
            );
            const destListIndex = optimisticBoard.lists.findIndex(
                (l) => l._id === destination.droppableId,
            );
            if (sourceListIndex === -1 || destListIndex === -1) return;

            const newLists = optimisticBoard.lists.map((list) => ({
                ...list,
                cards: [...list.cards],
            }));
            const [movedCard] = newLists[sourceListIndex].cards.splice(source.index, 1);
            newLists[destListIndex].cards.splice(destination.index, 0, {
                ...movedCard,
                listId: destination.droppableId as any,
            });
            setOptimisticBoard({ ...optimisticBoard, lists: newLists });

            try {
                await moveCard({
                    cardId: result.draggableId as any,
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

    const backgroundColor = optimisticBoard.color || "#0079BF";
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
        <div
            className="flex h-full flex-col overflow-hidden relative"
            style={{
                background: `
                    radial-gradient(circle at 10% 20%, ${backgroundColor}12 0%, transparent 50%),
                    radial-gradient(circle at 90% 80%, ${backgroundColor}10 0%, transparent 50%),
                    linear-gradient(180deg, ${backgroundColor}08 0%, transparent 100%),
                    hsl(var(--background))
                `,
            }}
        >
            {/* Subtle dot-grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${backgroundColor} 1px, transparent 0)`,
                    backgroundSize: "40px 40px",
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

            {/* CSS for the "border-expand" animation on newly created lists */}
            <style>{`
                @keyframes listBorderExpand {
                    0% {
                        box-shadow: 0 0 0 0px ${backgroundColor}00, 0 4px 12px ${backgroundColor}20;
                        border-color: ${backgroundColor}90;
                        transform: scaleX(0.92) scaleY(0.96);
                        opacity: 0;
                    }
                    40% {
                        box-shadow: 0 0 0 3px ${backgroundColor}50, 0 8px 24px ${backgroundColor}30;
                        border-color: ${backgroundColor};
                        transform: scaleX(1.01) scaleY(1.01);
                        opacity: 1;
                    }
                    70% {
                        box-shadow: 0 0 0 1px ${backgroundColor}30, 0 4px 12px ${backgroundColor}20;
                        border-color: ${backgroundColor}60;
                        transform: scaleX(1) scaleY(1);
                    }
                    100% {
                        box-shadow: 0 4px 12px ${backgroundColor}20;
                        border-color: ${backgroundColor}30;
                        transform: scaleX(1) scaleY(1);
                        opacity: 1;
                    }
                }

                .list-fresh-enter {
                    animation: listBorderExpand 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    transform-origin: left center;
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${backgroundColor}40;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${backgroundColor}60;
                }
            `}</style>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-8 custom-scrollbar h-full">
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
                                        boardColor={backgroundColor}
                                        isFresh={list._id === freshListId}
                                        isFiltered={hasActiveFilters}
                                        isReadOnly={isReadOnly}
                                    />
                                ))}
                                {provided.placeholder}
                                {optimisticBoard.lists.length === 0 && (
                                    <div
                                        className="w-72 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
                                        style={{
                                            borderColor: `${backgroundColor}50`,
                                            background: `${backgroundColor}08`,
                                        }}
                                    >
                                        Create your first list to start adding cards and checklist
                                        tasks.
                                    </div>
                                )}

                                {/* Add List Button / Form */}
                                {!isReadOnly && (
                                    <div className="flex-shrink-0 w-72">
                                        {isAddingList ? (
                                            <form
                                                onSubmit={handleCreateList}
                                                className="rounded-xl p-3 backdrop-blur-sm border shadow-lg"
                                                style={{
                                                    background: `linear-gradient(135deg, hsl(var(--background)) 0%, ${backgroundColor}08 100%)`,
                                                    borderColor: `${backgroundColor}30`,
                                                }}
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
                                                    className="mb-3 border-0 bg-background/60 backdrop-blur-sm focus-visible:ring-1"
                                                    style={{
                                                        boxShadow: `0 0 0 1px ${backgroundColor}20`,
                                                    }}
                                                    maxLength={100}
                                                    disabled={isCreatingList}
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={
                                                            !newListTitle.trim() || isCreatingList
                                                        }
                                                        className="transition-all gap-2"
                                                        style={{
                                                            background: newListTitle.trim()
                                                                ? `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`
                                                                : undefined,
                                                            color: newListTitle.trim()
                                                                ? "white"
                                                                : undefined,
                                                        }}
                                                    >
                                                        {isCreatingList && (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        )}
                                                        Add List
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsAddingList(false);
                                                            setNewListTitle("");
                                                        }}
                                                        className="hover:bg-background/80"
                                                        disabled={isCreatingList}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-auto py-3 px-4 border-2 border-dashed rounded-xl transition-all hover:scale-[1.02] hover:shadow-md group"
                                                onClick={() => setIsAddingList(true)}
                                                style={{
                                                    borderColor: `${backgroundColor}40`,
                                                    background: `${backgroundColor}05`,
                                                }}
                                            >
                                                <Plus
                                                    className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90"
                                                    style={{ color: backgroundColor }}
                                                />
                                                <span
                                                    style={{ color: backgroundColor }}
                                                    className="font-medium"
                                                >
                                                    Add List
                                                </span>
                                            </Button>
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

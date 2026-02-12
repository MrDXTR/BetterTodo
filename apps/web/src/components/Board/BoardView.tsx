import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import type { BoardWithLists } from "@/types/board";
import { BoardHeader } from "./BoardHeader";
import { ListColumn } from "../List/ListColumn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardViewProps {
    board: BoardWithLists;
}

export function BoardView({ board }: BoardViewProps) {
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState("");

    // Optimistic state for drag-and-drop
    const [optimisticBoard, setOptimisticBoard] = useState<BoardWithLists>(board);

    // Sync optimistic state with actual board data when it changes
    useEffect(() => {
        setOptimisticBoard(board);
    }, [board]);

    const createList = useMutation(api.lists.create);
    const moveCard = useMutation(api.cards.move);
    const updateListPosition = useMutation(api.lists.updatePosition);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newListTitle.trim()) return;

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
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, type } = result;

        // Dropped outside the list
        if (!destination) return;

        // No movement
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Handle list reordering
        if (type === "list") {
            // Optimistically update the UI
            const newLists = Array.from(optimisticBoard.lists);
            const [movedList] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, movedList);

            setOptimisticBoard({
                ...optimisticBoard,
                lists: newLists
            });

            // Then update the server
            try {
                const listId = result.draggableId;
                await updateListPosition({
                    listId: listId as any,
                    newPosition: destination.index,
                });
            } catch (error) {
                console.error("Error moving list:", error);
                toast.error("Failed to move list");
                // Revert on error
                setOptimisticBoard(board);
            }
            return;
        }

        // Handle card movement
        if (type === "card") {
            // Optimistically update the UI
            const sourceListIndex = optimisticBoard.lists.findIndex(
                list => list._id === source.droppableId
            );
            const destListIndex = optimisticBoard.lists.findIndex(
                list => list._id === destination.droppableId
            );

            if (sourceListIndex === -1 || destListIndex === -1) return;

            const newLists = optimisticBoard.lists.map(list => ({
                ...list,
                cards: [...list.cards]
            }));

            // Remove card from source list
            const [movedCard] = newLists[sourceListIndex].cards.splice(source.index, 1);

            // Add card to destination list
            newLists[destListIndex].cards.splice(destination.index, 0, {
                ...movedCard,
                listId: destination.droppableId as any
            });

            setOptimisticBoard({
                ...optimisticBoard,
                lists: newLists
            });

            // Then update the server
            try {
                const cardId = result.draggableId;
                const targetListId = destination.droppableId;

                await moveCard({
                    cardId: cardId as any,
                    targetListId: targetListId as any,
                    newPosition: destination.index,
                });
            } catch (error) {
                console.error("Error moving card:", error);
                toast.error("Failed to move card");
                // Revert on error
                setOptimisticBoard(board);
            }
        }
    };

    const backgroundColor = optimisticBoard.color || "#0079BF";

    return (
        <div
            className="flex h-full flex-col overflow-hidden relative"
            style={{
                background: `
                    radial-gradient(circle at 10% 20%, ${backgroundColor}12 0%, transparent 50%),
                    radial-gradient(circle at 90% 80%, ${backgroundColor}10 0%, transparent 50%),
                    linear-gradient(180deg, ${backgroundColor}08 0%, transparent 100%),
                    hsl(var(--background))
                `
            }}
        >
            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${backgroundColor} 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <BoardHeader board={board} />

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 custom-scrollbar">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        height: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: ${backgroundColor}40;
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: ${backgroundColor}60;
                    }
                `}} />

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="board" direction="horizontal" type="list">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex gap-4 h-full items-start"
                            >
                                {optimisticBoard.lists.map((list, index) => (
                                    <ListColumn key={list._id} list={list} index={index} boardColor={backgroundColor} />
                                ))}
                                {provided.placeholder}

                                {/* Add List Button/Form */}
                                <div className="flex-shrink-0 w-72">
                                    {isAddingList ? (
                                        <form
                                            onSubmit={handleCreateList}
                                            className="rounded-xl p-3 backdrop-blur-sm border shadow-lg transition-all"
                                            style={{
                                                background: `linear-gradient(135deg, hsl(var(--background)) 0%, ${backgroundColor}08 100%)`,
                                                borderColor: `${backgroundColor}30`
                                            }}
                                        >
                                            <Input
                                                autoFocus
                                                placeholder="Enter list title..."
                                                value={newListTitle}
                                                onChange={(e) => setNewListTitle(e.target.value)}
                                                onBlur={() => {
                                                    if (!newListTitle.trim()) {
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
                                                    boxShadow: `0 0 0 1px ${backgroundColor}20`
                                                }}
                                                maxLength={100}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    disabled={!newListTitle.trim()}
                                                    className="transition-all"
                                                    style={{
                                                        background: !newListTitle.trim() ? undefined : `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`,
                                                        color: !newListTitle.trim() ? undefined : 'white'
                                                    }}
                                                >
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
                                                background: `${backgroundColor}05`
                                            }}
                                        >
                                            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" style={{ color: backgroundColor }} />
                                            <span style={{ color: backgroundColor }} className="font-medium">Add List</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
}

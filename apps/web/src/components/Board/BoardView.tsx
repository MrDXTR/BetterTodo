import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
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
            try {
                const listId = result.draggableId;
                await updateListPosition({
                    listId: listId as any,
                    newPosition: destination.index,
                });
            } catch (error) {
                console.error("Error moving list:", error);
                toast.error("Failed to move list");
            }
            return;
        }

        // Handle card movement
        if (type === "card") {
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
            }
        }
    };

    const backgroundColor = board.color || "#0079BF";

    return (
        <div
            className="flex h-full flex-col overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${backgroundColor}dd 0%, ${backgroundColor}99 100%)`,
            }}
        >
            <BoardHeader board={board} />

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="board" direction="horizontal" type="list">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex gap-3 h-full items-start"
                            >
                                {board.lists.map((list, index) => (
                                    <ListColumn key={list._id} list={list} index={index} />
                                ))}
                                {provided.placeholder}

                                {/* Add List Button/Form */}
                                <div className="flex-shrink-0 w-72">
                                    {isAddingList ? (
                                        <form onSubmit={handleCreateList} className="rounded-lg bg-background p-2 shadow-sm">
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
                                                className="mb-2"
                                                maxLength={100}
                                            />
                                            <div className="flex gap-2">
                                                <Button type="submit" size="sm" disabled={!newListTitle.trim()}>
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
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            className="w-full justify-start bg-background/50 hover:bg-background/70"
                                            onClick={() => setIsAddingList(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add List
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

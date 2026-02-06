import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";

import type { ListWithCards } from "@/types/board";
import { ListHeader } from "./ListHeader";
import { CardItem } from "../Card/CardItem";
import { AddCardButton } from "../Card/AddCardButton";

interface ListColumnProps {
    list: ListWithCards;
    index: number;
}

export function ListColumn({ list, index }: ListColumnProps) {
    return (
        <Draggable draggableId={list._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex-shrink-0 w-72"
                >
                    <div
                        className={`flex h-full max-h-full flex-col rounded-lg bg-background shadow-sm ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                            }`}
                    >
                        {/* List Header */}
                        <div {...provided.dragHandleProps}>
                            <ListHeader list={list} />
                        </div>

                        {/* Cards */}
                        <Droppable droppableId={list._id} type="card">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto p-2 space-y-2 ${snapshot.isDraggingOver ? "bg-muted/50" : ""
                                        }`}
                                    style={{ minHeight: "100px" }}
                                >
                                    {list.cards.map((card, cardIndex) => (
                                        <CardItem key={card._id} card={card} index={cardIndex} />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* Add Card Button */}
                        <div className="p-2 pt-0">
                            <AddCardButton listId={list._id} />
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

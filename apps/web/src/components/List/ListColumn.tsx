import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";

import type { ListWithCards } from "@/types/board";
import { ListHeader } from "./ListHeader";
import { CardItem } from "../Card/CardItem";
import { AddCardButton } from "../Card/AddCardButton";

interface ListColumnProps {
    list: ListWithCards;
    index: number;
    boardColor: string;
}

export function ListColumn({ list, index, boardColor }: ListColumnProps) {
    return (
        <Draggable draggableId={list._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex-shrink-0 w-72"
                >
                    <div
                        className={`flex h-full max-h-full flex-col rounded-xl backdrop-blur-md border transition-all ${snapshot.isDragging
                                ? "shadow-2xl scale-105 rotate-2"
                                : "shadow-lg hover:shadow-xl hover:-translate-y-1"
                            }`}
                        style={{
                            background: snapshot.isDragging
                                ? `linear-gradient(135deg, hsl(var(--background)) 0%, ${boardColor}15 100%)`
                                : `linear-gradient(135deg, hsl(var(--background)) 0%, ${boardColor}08 100%)`,
                            borderColor: snapshot.isDragging ? `${boardColor}60` : `${boardColor}30`,
                            boxShadow: snapshot.isDragging
                                ? `0 20px 40px ${boardColor}40, 0 0 0 2px ${boardColor}60`
                                : `0 4px 12px ${boardColor}20`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {/* List Header */}
                        <div {...provided.dragHandleProps}>
                            <ListHeader list={list} boardColor={boardColor} />
                        </div>

                        {/* Cards */}
                        <Droppable droppableId={list._id} type="card">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto p-3 space-y-2.5 transition-colors ${snapshot.isDraggingOver ? "bg-muted/30" : ""
                                        }`}
                                    style={{
                                        minHeight: "100px",
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: `${boardColor}40 transparent`
                                    }}
                                >
                                    {list.cards.map((card, cardIndex) => (
                                        <CardItem key={card._id} card={card} index={cardIndex} boardColor={boardColor} />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* Add Card Button */}
                        <div className="p-3 pt-0">
                            <AddCardButton listId={list._id} boardColor={boardColor} />
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

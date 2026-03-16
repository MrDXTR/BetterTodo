import { Draggable, Droppable } from "@hello-pangea/dnd";

import type { ListWithCards } from "@/types/board";
import { ListHeader } from "./ListHeader";
import { CardItem } from "../Card/CardItem";
import { AddCardButton } from "../Card/AddCardButton";

interface ListColumnProps {
    list: ListWithCards;
    index: number;
    boardColor: string;
    /** True for the very first render cycle after this list was created */
    isFresh?: boolean;
    /** True when board-level filters are active */
    isFiltered?: boolean;
    isReadOnly?: boolean;
}

export function ListColumn({
    list,
    index,
    boardColor,
    isFresh = false,
    isFiltered = false,
    isReadOnly = false,
}: ListColumnProps) {
    return (
        <Draggable draggableId={list._id} index={index} isDragDisabled={isReadOnly}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex-shrink-0 w-72"
                >
                    <div
                        className={`flex flex-col max-h-[calc(100vh-40vh)] md:max-h-[calc(100vh-25vh)] rounded-xl border overflow-hidden transition-all ${
                            snapshot.isDragging ? "shadow-2xl" : "shadow-lg hover:shadow-xl"
                        } ${isFresh ? "list-fresh-enter" : ""}`}
                        style={{
                            background: snapshot.isDragging
                                ? `linear-gradient(135deg, hsl(var(--background)) 0%, ${boardColor}15 100%)`
                                : `linear-gradient(135deg, hsl(var(--background)) 0%, ${boardColor}08 100%)`,
                            borderColor: snapshot.isDragging
                                ? `${boardColor}60`
                                : `${boardColor}30`,
                            boxShadow: snapshot.isDragging
                                ? `0 20px 40px ${boardColor}40, 0 0 0 2px ${boardColor}60`
                                : `0 4px 12px ${boardColor}20`,
                            // Don't override transition when the fresh animation is running
                            transition: isFresh
                                ? undefined
                                : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    >
                        {/* Drag handle wraps only the header */}
                        <div {...provided.dragHandleProps}>
                            <ListHeader
                                list={list}
                                boardColor={boardColor}
                                isReadOnly={isReadOnly}
                            />
                        </div>

                        {/* Cards */}
                        <Droppable droppableId={list._id} type="card" isDropDisabled={isReadOnly}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto min-h-0 p-3 space-y-2.5 transition-colors ${
                                        snapshot.isDraggingOver ? "bg-muted/30" : ""
                                    }`}
                                    style={{
                                        minHeight: "100px",
                                        scrollbarWidth: "thin",
                                        scrollbarColor: `${boardColor}40 transparent`,
                                    }}
                                >
                                    {list.cards.map((card, cardIndex) => (
                                        <CardItem
                                            key={card._id}
                                            card={card}
                                            index={cardIndex}
                                            isReadOnly={isReadOnly}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* Add Card */}
                        {!isReadOnly && (
                            <div className="p-3 pt-0">
                                <AddCardButton listId={list._id} boardColor={boardColor} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}

import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { List } from "@/types/board";
import { ListHeader } from "@/components/List/ListHeader";
import { CardItem } from "@/components/Card/CardItem";
import { AddCardButton } from "@/components/Card/AddCardButton";
import { cn } from "@/lib/utils";

interface ListColumnProps {
    list: List;
    index: number;
    boardColor?: string;
    isFresh?: boolean;
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
                        className={cn(
                            "flex flex-col max-h-[calc(100vh-36vh)] md:max-h-[calc(100vh-24vh)] rounded-xl border border-border/70 bg-card/95 dark:bg-card/85 overflow-hidden transition-[box-shadow,border-color] duration-150",
                            snapshot.isDragging
                                ? "shadow-2xl border-primary/40 ring-2 ring-primary/20 z-40"
                                : "shadow-2xs hover:shadow-xs",
                            isFresh && "list-fresh-enter",
                        )}
                    >
                        {/* Drag handle wraps only the header */}
                        <div {...provided.dragHandleProps}>
                            <ListHeader
                                list={list}
                                boardColor={boardColor}
                                isReadOnly={isReadOnly}
                            />
                        </div>

                        {/* Cards droppable container */}
                        <Droppable droppableId={list._id} type="card" isDropDisabled={isReadOnly}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "flex-1 overflow-y-auto min-h-[80px] p-2.5 space-y-2 transition-colors duration-150",
                                        snapshot.isDraggingOver && "bg-muted/30 rounded-lg",
                                    )}
                                    style={{
                                        scrollbarWidth: "thin",
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
                            <div className="p-2.5 pt-0">
                                <AddCardButton listId={list._id} boardColor={boardColor} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}

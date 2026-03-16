import { Draggable } from "@hello-pangea/dnd";
import { Calendar, CheckSquare, MessageSquare } from "lucide-react";
import { useState } from "react";

import type { Card } from "@/types/board";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { CardModal } from "./CardModal";

interface CardItemProps {
    card: Card;
    index: number;
    isReadOnly?: boolean;
}

export function CardItem({ card, index, isReadOnly = false }: CardItemProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasDueDate = !!card.dueDate;
    const isPastDue = hasDueDate && !card.completed && card.dueDate! < Date.now();
    const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null;
    const checklistItemsTotal = card.checklistItemsTotal ?? 0;
    const checklistItemsCompleted = card.checklistItemsCompleted ?? 0;

    return (
        <>
            <Draggable draggableId={card._id} index={index} isDragDisabled={isReadOnly}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => {
                            // Don't open modal if we're dragging
                            if (!snapshot.isDragging) {
                                setIsModalOpen(true);
                            }
                        }}
                        className={`cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                        }`}
                    >
                        {/* Cover Image */}
                        {card.coverImage && (
                            <div className="mb-2 -mx-3 -mt-3 overflow-hidden rounded-t-md">
                                <img
                                    src={card.coverImage}
                                    alt=""
                                    className="block h-32 w-full object-cover"
                                />
                            </div>
                        )}

                        {/* Priority Badge */}
                        {priorityConfig && (
                            <div className="mb-2">
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityConfig.color} text-white`}
                                >
                                    {priorityConfig.label}
                                </span>
                            </div>
                        )}

                        {/* Card Title */}
                        <h4 className="mb-2 text-sm font-medium leading-snug">{card.title}</h4>

                        {/* Card Metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {/* Due Date */}
                            {hasDueDate && (
                                <div
                                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${
                                        isPastDue
                                            ? "bg-destructive/10 text-destructive"
                                            : "bg-muted"
                                    }`}
                                >
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        {new Date(card.dueDate!).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            )}

                            {/* Description Indicator */}
                            {card.description && (
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                </div>
                            )}

                            {/* Checklist task progress */}
                            {checklistItemsTotal > 0 && (
                                <div
                                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${
                                        checklistItemsCompleted === checklistItemsTotal
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                            : "bg-muted"
                                    }`}
                                >
                                    <CheckSquare className="h-3 w-3" />
                                    <span>
                                        {checklistItemsCompleted}/{checklistItemsTotal}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Draggable>

            {isModalOpen && (
                <CardModal
                    cardId={card._id}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    isReadOnly={isReadOnly}
                />
            )}
        </>
    );
}

import { Draggable } from "@hello-pangea/dnd";
import { Calendar, CheckSquare, Paperclip, MessageSquare } from "lucide-react";
import { useState } from "react";

import type { Card } from "@/types/board";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { CardModal } from "./CardModal";

interface CardItemProps {
    card: Card;
    index: number;
}

export function CardItem({ card, index }: CardItemProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasDueDate = !!card.dueDate;
    const isPastDue = hasDueDate && card.dueDate! < Date.now();
    const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority] : null;

    return (
        <>
            <Draggable draggableId={card._id} index={index}>
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
                        className={`cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                            }`}
                    >
                        {/* Cover Image */}
                        {card.coverImage && (
                            <img
                                src={card.coverImage}
                                alt=""
                                className="mb-2 -mx-3 -mt-3 h-32 w-[calc(100%+1.5rem)] rounded-t-md object-cover"
                            />
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
                        <h4 className="mb-2 text-sm font-medium leading-snug">
                            {card.title}
                        </h4>

                        {/* Card Metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {/* Due Date */}
                            {hasDueDate && (
                                <div
                                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${isPastDue
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
                        </div>
                    </div>
                )}
            </Draggable>

            <CardModal
                cardId={card._id}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

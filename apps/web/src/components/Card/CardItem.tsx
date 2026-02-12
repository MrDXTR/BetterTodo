import { Draggable } from "@hello-pangea/dnd";
import { Calendar, CheckSquare, Paperclip, MessageSquare } from "lucide-react";
import { useState } from "react";

import type { Card } from "@/types/board";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { CardModal } from "./CardModal";

interface CardItemProps {
    card: Card;
    index: number;
    boardColor?: string;
}

export function CardItem({ card, index, boardColor = "#0079BF" }: CardItemProps) {
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
                        onClick={() => setIsModalOpen(true)}
                        className={`group cursor-pointer rounded-xl border backdrop-blur-sm transition-all ${snapshot.isDragging
                                ? "shadow-2xl scale-105 rotate-1"
                                : "shadow-sm hover:shadow-lg hover:scale-[1.02]"
                            }`}
                        style={{
                            background: snapshot.isDragging
                                ? `linear-gradient(135deg, hsl(var(--card)) 0%, ${boardColor}10 100%)`
                                : 'hsl(var(--card))',
                            borderColor: snapshot.isDragging ? `${boardColor}60` : `${boardColor}20`,
                            boxShadow: snapshot.isDragging
                                ? `0 12px 24px ${boardColor}30, 0 0 0 1px ${boardColor}40`
                                : undefined,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {/* Cover Image */}
                        {card.coverImage && (
                            <div className="relative overflow-hidden rounded-t-xl">
                                <img
                                    src={card.coverImage}
                                    alt=""
                                    className="h-32 w-full object-cover"
                                />
                                {/* Gradient overlay on cover */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{
                                        background: `linear-gradient(180deg, transparent 0%, ${boardColor}40 100%)`
                                    }}
                                />
                            </div>
                        )}

                        <div className="p-3">
                            {/* Priority Badge */}
                            {priorityConfig && (
                                <div className="mb-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm`}
                                        style={{
                                            background: `linear-gradient(135deg, ${priorityConfig.color} 0%, ${priorityConfig.color}dd 100%)`
                                        }}
                                    >
                                        {priorityConfig.label}
                                    </span>
                                </div>
                            )}

                            {/* Card Title */}
                            <h4 className="mb-2.5 text-sm font-semibold leading-snug group-hover:text-foreground/90 transition-colors">
                                {card.title}
                            </h4>

                            {/* Card Metadata */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {/* Due Date */}
                                {hasDueDate && (
                                    <div
                                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium transition-all ${isPastDue
                                                ? "bg-destructive/15 text-destructive"
                                                : "bg-muted/80 hover:bg-muted"
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
                                    <div
                                        className="flex items-center gap-1 rounded-lg px-2 py-1 bg-muted/60 hover:bg-muted transition-all"
                                    >
                                        <MessageSquare className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hover glow effect */}
                        <div
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                                boxShadow: `inset 0 0 20px ${boardColor}10`
                            }}
                        />
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

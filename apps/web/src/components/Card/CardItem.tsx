import { Draggable } from "@hello-pangea/dnd";
import { AlignLeft, Calendar, CheckSquare, MessageSquare, Paperclip } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import type { Card } from "@/types/board";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { CardModal } from "./CardModal";
import { cn } from "@/lib/utils";

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
    const labels = (card as any).labels || [];
    const attachmentsCount = (card as any).attachments?.length || 0;
    const commentsCount = (card as any).commentsCount || 0;

    const renderCardContent = () => (
        <>
            {/* Cover Image with concentric radius and 1px media ring */}
            {card.coverImage && (
                <div className="relative mb-2.5 -mx-3 -mt-3 overflow-hidden rounded-t-[11px]">
                    <img src={card.coverImage} alt="" className="block h-32 w-full object-cover" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none rounded-t-[11px]" />
                </div>
            )}

            {/* Labels & Priority Row */}
            {(labels.length > 0 || priorityConfig) && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    {labels.slice(0, 3).map((label: any) => (
                        <span
                            key={label._id}
                            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white shadow-2xs"
                            style={{ backgroundColor: label.color }}
                        >
                            {label.name}
                        </span>
                    ))}
                    {labels.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                            +{labels.length - 3}
                        </span>
                    )}
                    {priorityConfig && (
                        <span
                            className={cn(
                                "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white shadow-2xs",
                                priorityConfig.color,
                            )}
                        >
                            {priorityConfig.label}
                        </span>
                    )}
                </div>
            )}

            {/* Card Title */}
            <h4 className="mb-2 text-xs font-medium leading-snug text-foreground">{card.title}</h4>

            {/* Card Metadata Bar */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {/* Due Date */}
                {hasDueDate && (
                    <div
                        className={cn(
                            "flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium",
                            isPastDue
                                ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                                : "bg-muted text-muted-foreground",
                        )}
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

                {/* Checklist Progress */}
                {checklistItemsTotal > 0 && (
                    <div
                        className={cn(
                            "flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium",
                            checklistItemsCompleted === checklistItemsTotal
                                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        <CheckSquare className="h-3 w-3" />
                        <span>
                            {checklistItemsCompleted}/{checklistItemsTotal}
                        </span>
                    </div>
                )}

                {/* Description Indicator */}
                {card.description && (
                    <div className="flex items-center gap-0.5" title="Has description">
                        <AlignLeft className="h-3 w-3" />
                    </div>
                )}

                {/* Comments Count */}
                {commentsCount > 0 && (
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{commentsCount}</span>
                    </div>
                )}

                {/* Attachments Count */}
                {attachmentsCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        <span>{attachmentsCount}</span>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            <Draggable draggableId={card._id} index={index} isDragDisabled={isReadOnly}>
                {(provided, snapshot) => {
                    const cardElement = (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                                ...provided.draggableProps.style,
                                ...(snapshot.isDragging ? { width: 268 } : {}),
                            }}
                            onClick={() => {
                                if (!snapshot.isDragging) {
                                    setIsModalOpen(true);
                                }
                            }}
                            className={cn(
                                "cursor-pointer select-none rounded-xl border border-border/70 bg-card p-3 shadow-2xs hover:shadow-xs hover:border-border transition-[box-shadow,border-color] duration-150 ease-out",
                                snapshot.isDragging &&
                                    "shadow-2xl border-primary/50 ring-2 ring-primary/30 z-[9999] opacity-95",
                            )}
                        >
                            {renderCardContent()}
                        </div>
                    );

                    // Use portal while dragging so the card is never clipped by list overflow
                    if (snapshot.isDragging && typeof document !== "undefined") {
                        return createPortal(cardElement, document.body);
                    }

                    return cardElement;
                }}
            </Draggable>

            {/* Card Modal */}
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

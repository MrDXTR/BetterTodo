import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { X } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CardModalProps {
    cardId: Id<"cards">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CardModal({ cardId, open, onOpenChange }: CardModalProps) {
    const card = useQuery(api.cards.getById, { cardId });

    if (!card) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <DialogTitle className="text-xl">{card.title}</DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Card Details */}
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Description</h3>
                        {card.description ? (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {card.description}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No description yet. Click to add one...
                            </p>
                        )}
                    </div>

                    {/* Priority */}
                    {card.priority && (
                        <div>
                            <h3 className="mb-2 text-sm font-semibold">Priority</h3>
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize">
                                {card.priority}
                            </span>
                        </div>
                    )}

                    {/* Due Date */}
                    {card.dueDate && (
                        <div>
                            <h3 className="mb-2 text-sm font-semibold">Due Date</h3>
                            <p className="text-sm">
                                {new Date(card.dueDate).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    )}

                    {/* TODO: Add more sections */}
                    {/* - Labels */}
                    {/* - Assigned Members */}
                    {/* - Checklists */}
                    {/* - Comments */}
                    {/* - Activity Log */}

                    <div className="text-xs text-muted-foreground">
                        <p>Created: {new Date(card.createdAt).toLocaleString()}</p>
                        {card.updatedAt !== card.createdAt && (
                            <p>Updated: {new Date(card.updatedAt).toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

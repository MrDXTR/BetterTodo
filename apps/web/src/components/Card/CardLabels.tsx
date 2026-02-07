import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { Tag, X, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { LABEL_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CardLabelsProps {
    cardId: Id<"cards">;
    boardId: Id<"boards">;
}

export function CardLabels({ cardId, boardId }: CardLabelsProps) {
    const card = useQuery(api.cards.getById, { cardId });
    const boardLabels = useQuery(api.labels.getByBoard, { boardId });
    const addLabel = useMutation(api.labels.addToCard);
    const removeLabel = useMutation(api.labels.removeFromCard);
    const createLabel = useMutation(api.labels.create);

    const [isCreating, setIsCreating] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);

    if (!card || !boardLabels) return null;

    const cardLabelIds = card.labels?.map((l: any) => l._id) || [];

    const handleToggleLabel = async (labelId: Id<"labels">) => {
        if (cardLabelIds.includes(labelId)) {
            await removeLabel({ cardId, labelId });
        } else {
            await addLabel({ cardId, labelId });
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) return;

        await createLabel({
            boardId,
            name: newLabelName.trim(),
            color: selectedColor,
        });

        setNewLabelName("");
        setIsCreating(false);
    };

    return (
        <div className="flex items-center gap-2">
            {/* Display assigned labels */}
            {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {card.labels.map((label: any) => (
                        <Badge
                            key={label._id}
                            style={{ backgroundColor: label.color }}
                            className="text-white text-xs"
                        >
                            {label.name}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Add label button */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Plus className="w-3 h-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Labels</h4>
                        </div>

                        {/* Search */}
                        <Input
                            placeholder="Search labels..."
                            className="h-8 text-sm"
                        />

                        {/* Label list */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {boardLabels.map((label) => (
                                <button
                                    key={label._id}
                                    onClick={() => handleToggleLabel(label._id)}
                                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                                >
                                    <div
                                        className="w-8 h-4 rounded"
                                        style={{ backgroundColor: label.color }}
                                    />
                                    <span className="flex-1 text-left text-sm">{label.name}</span>
                                    {cardLabelIds.includes(label._id) && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Create new label */}
                        {isCreating ? (
                            <div className="space-y-2 pt-2 border-t">
                                <Input
                                    placeholder="Label name"
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateLabel();
                                        if (e.key === "Escape") setIsCreating(false);
                                    }}
                                    className="h-8 text-sm"
                                    autoFocus
                                />
                                <div className="grid grid-cols-5 gap-1">
                                    {LABEL_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
                                            className={cn(
                                                "w-full h-6 rounded transition-all",
                                                selectedColor === color.value && "ring-2 ring-primary ring-offset-2"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleCreateLabel} className="flex-1">
                                        Create
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsCreating(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => setIsCreating(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Label
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

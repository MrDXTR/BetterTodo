import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].value);
    const [searchTerm, setSearchTerm] = useState("");
    const [localLabelIds, setLocalLabelIds] = useState<Id<"labels">[]>([]);
    const [pendingLabelIds, setPendingLabelIds] = useState<Record<string, boolean>>({});

    const serverCardLabelIds = useMemo(
        () => card?.labels?.map((l: any) => l._id) ?? [],
        [card?.labels],
    );

    useEffect(() => {
        setLocalLabelIds(serverCardLabelIds);
    }, [serverCardLabelIds.join("|")]);

    if (!card || !boardLabels) return null;

    const filteredLabels = boardLabels.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    );

    const selectedLabels = boardLabels.filter((label) => localLabelIds.includes(label._id));

    const handleToggleLabel = async (labelId: Id<"labels">) => {
        const isSelected = localLabelIds.includes(labelId);
        const previousIds = localLabelIds;

        setPendingLabelIds((prev) => ({ ...prev, [labelId]: true }));
        setLocalLabelIds((prev) =>
            isSelected ? prev.filter((id) => id !== labelId) : [...prev, labelId],
        );

        try {
            if (isSelected) {
                await removeLabel({ cardId, labelId });
            } else {
                await addLabel({ cardId, labelId });
            }
        } catch (error) {
            setLocalLabelIds(previousIds);
            toast.error("Failed to update label");
            console.error("Error toggling label:", error);
        } finally {
            setPendingLabelIds((prev) => {
                const { [labelId]: _removed, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim() || isCreatingLabel) return;

        setIsCreatingLabel(true);
        try {
            const created = await createLabel({
                boardId,
                name: newLabelName.trim(),
                color: selectedColor,
            });

            if (created?._id) {
                setLocalLabelIds((prev) =>
                    prev.includes(created._id) ? prev : [...prev, created._id],
                );
                await addLabel({ cardId, labelId: created._id });
            }

            setNewLabelName("");
            setSearchTerm("");
            setIsCreating(false);
            toast.success("Label created");
        } catch (error) {
            toast.error("Failed to create label");
            console.error("Error creating label:", error);
        } finally {
            setIsCreatingLabel(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedLabels.map((label) => (
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

                        <Input
                            placeholder="Search labels..."
                            className="h-8 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div
                            className="space-y-1 max-h-48 overflow-y-auto overscroll-contain pr-1"
                            onWheel={(e) => e.stopPropagation()}
                            onWheelCapture={(e) => e.stopPropagation()}
                        >
                            {filteredLabels.map((label) => {
                                const isPending = !!pendingLabelIds[label._id];
                                const isSelected = localLabelIds.includes(label._id);

                                return (
                                    <button
                                        key={label._id}
                                        onClick={() => handleToggleLabel(label._id)}
                                        disabled={isPending}
                                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors disabled:opacity-60"
                                    >
                                        <div
                                            className="w-8 h-4 rounded"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="flex-1 text-left text-sm">
                                            {label.name}
                                        </span>
                                        {isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        ) : (
                                            isSelected && <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                );
                            })}
                            {filteredLabels.length === 0 && (
                                <p className="text-xs text-muted-foreground px-2 py-1">
                                    No labels found.
                                </p>
                            )}
                        </div>

                        {isCreating ? (
                            <div className="space-y-2 pt-2 border-t">
                                <Input
                                    placeholder="Label name"
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateLabel();
                                        if (e.key === "Escape" && !isCreatingLabel)
                                            setIsCreating(false);
                                    }}
                                    className="h-8 text-sm"
                                    autoFocus
                                    disabled={isCreatingLabel}
                                />
                                <div className="grid grid-cols-5 gap-1">
                                    {LABEL_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
                                            disabled={isCreatingLabel}
                                            className={cn(
                                                "w-full h-6 rounded transition-all disabled:opacity-50",
                                                selectedColor === color.value &&
                                                    "ring-2 ring-primary ring-offset-2",
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleCreateLabel}
                                        className="flex-1"
                                        disabled={!newLabelName.trim() || isCreatingLabel}
                                    >
                                        {isCreatingLabel && (
                                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        )}
                                        Create & Add
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsCreating(false)}
                                        disabled={isCreatingLabel}
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

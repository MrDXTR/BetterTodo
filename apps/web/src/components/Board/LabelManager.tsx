import { useMemo, useState } from "react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LABEL_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LabelManagerProps {
    boardId: Id<"boards">;
}

export function LabelManager({ boardId }: LabelManagerProps) {
    const labels = useQuery(api.labels.getByBoard, { boardId });
    const createLabel = useMutation(api.labels.create);
    const updateLabel = useMutation(api.labels.update);
    const deleteLabel = useMutation(api.labels.deleteLabel);

    const [newLabelName, setNewLabelName] = useState("");
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value);
    const [isCreating, setIsCreating] = useState(false);

    const [editingLabelId, setEditingLabelId] = useState<Id<"labels"> | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingColor, setEditingColor] = useState(LABEL_COLORS[0].value);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingLabelId, setDeletingLabelId] = useState<Id<"labels"> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const deletingLabelName = useMemo(
        () => labels?.find((label) => label._id === deletingLabelId)?.name ?? "this label",
        [labels, deletingLabelId],
    );

    const startEdit = (labelId: Id<"labels">, name: string, color: string) => {
        setEditingLabelId(labelId);
        setEditingName(name);
        setEditingColor(color);
    };

    const cancelEdit = () => {
        setEditingLabelId(null);
        setEditingName("");
        setEditingColor(LABEL_COLORS[0].value);
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim() || isCreating) return;
        setIsCreating(true);
        try {
            await createLabel({
                boardId,
                name: newLabelName.trim(),
                color: newLabelColor,
            });
            setNewLabelName("");
            toast.success("Label created");
        } catch (error) {
            console.error("Error creating label:", error);
            toast.error("Failed to create label");
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingLabelId || !editingName.trim() || isSavingEdit) return;
        setIsSavingEdit(true);
        try {
            await updateLabel({
                labelId: editingLabelId,
                name: editingName.trim(),
                color: editingColor,
            });
            toast.success("Label updated");
            cancelEdit();
        } catch (error) {
            console.error("Error updating label:", error);
            toast.error("Failed to update label");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingLabelId || isDeleting) return;
        setIsDeleting(true);
        try {
            await deleteLabel({ labelId: deletingLabelId });
            toast.success("Label deleted");
            setDeletingLabelId(null);
        } catch (error) {
            console.error("Error deleting label:", error);
            toast.error("Failed to delete label");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="space-y-3 rounded-xl border border-border/70 bg-card/40 p-3.5 shadow-2xs">
                <p className="text-xs font-semibold text-foreground">Board labels</p>

                <div className="space-y-2.5">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New label name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            maxLength={40}
                            disabled={isCreating}
                            className="h-8 text-xs bg-background"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCreateLabel();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateLabel}
                            disabled={!newLabelName.trim() || isCreating}
                            className="h-8 px-3 text-xs gap-1 shrink-0"
                        >
                            {isCreating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Plus className="h-3.5 w-3.5" />
                            )}
                            <span>Add</span>
                        </Button>
                    </div>
                    <div className="grid grid-cols-10 gap-1.5">
                        {LABEL_COLORS.map((color) => {
                            const isSelected = newLabelColor === color.value;
                            return (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setNewLabelColor(color.value)}
                                    className={cn(
                                        "h-5 rounded-md transition-transform duration-150 hover:scale-110 cursor-pointer flex items-center justify-center",
                                        isSelected
                                            ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                            : "ring-1 ring-inset ring-black/10 dark:ring-white/15",
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                >
                                    {isSelected && (
                                        <Check className="h-3 w-3 text-white drop-shadow-xs" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {labels === undefined && (
                        <p className="text-xs text-muted-foreground py-2">Loading labels...</p>
                    )}

                    {labels && labels.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                            No labels yet. Create one above.
                        </p>
                    )}

                    {labels?.map((label) => {
                        const isEditing = editingLabelId === label._id;
                        return (
                            <div
                                key={label._id}
                                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2 shadow-2xs text-xs"
                            >
                                {isEditing ? (
                                    <>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-7 text-xs flex-1"
                                            maxLength={40}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveEdit();
                                                if (e.key === "Escape") cancelEdit();
                                            }}
                                        />
                                        <div className="flex items-center gap-1">
                                            {LABEL_COLORS.slice(0, 8).map((color) => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setEditingColor(color.value)}
                                                    className={cn(
                                                        "h-4.5 w-4.5 rounded-sm cursor-pointer",
                                                        editingColor === color.value &&
                                                            "ring-2 ring-primary ring-offset-1",
                                                    )}
                                                    style={{ backgroundColor: color.value }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon-xs"
                                            className="h-7 w-7"
                                            onClick={handleSaveEdit}
                                            disabled={isSavingEdit || !editingName.trim()}
                                        >
                                            {isSavingEdit ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="h-7 w-7"
                                            onClick={cancelEdit}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className="h-3 w-3 rounded-full shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="flex-1 truncate font-medium text-foreground">
                                            {label.name}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                startEdit(label._id, label.name, label.color)
                                            }
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => setDeletingLabelId(label._id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DeleteConfirmationDialog
                open={deletingLabelId !== null}
                onOpenChange={(open) => !open && setDeletingLabelId(null)}
                onConfirm={handleDelete}
                title="Delete Label?"
                description={`Are you sure you want to delete "${deletingLabelName}"? It will be removed from all cards.`}
                confirmText="Delete label"
            />
        </>
    );
}

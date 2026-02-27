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
            <div className="grid gap-2 rounded-lg border p-3">
                <p className="text-sm font-medium">Board labels</p>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New label name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            maxLength={40}
                            disabled={isCreating}
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
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                        {LABEL_COLORS.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => setNewLabelColor(color.value)}
                                className={cn(
                                    "h-5 rounded transition-all",
                                    newLabelColor === color.value &&
                                        "ring-2 ring-primary ring-offset-2",
                                )}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-1 space-y-2 max-h-[15vh] overflow-y-auto">
                    {labels === undefined && (
                        <p className="text-xs text-muted-foreground">Loading labels...</p>
                    )}

                    {labels && labels.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No labels yet. Create one above.
                        </p>
                    )}

                    {labels?.map((label) => {
                        const isEditing = editingLabelId === label._id;
                        return (
                            <div
                                key={label._id}
                                className="flex items-center gap-2 rounded-md border p-2"
                            >
                                {isEditing ? (
                                    <>
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-8"
                                            maxLength={40}
                                        />
                                        <div className="flex items-center gap-1">
                                            {LABEL_COLORS.slice(0, 8).map((color) => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setEditingColor(color.value)}
                                                    className={cn(
                                                        "h-5 w-5 rounded",
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
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={handleSaveEdit}
                                            disabled={!editingName.trim() || isSavingEdit}
                                        >
                                            {isSavingEdit ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={cancelEdit}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className="h-4 w-6 rounded"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="flex-1 text-sm">{label.name}</span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() =>
                                                startEdit(label._id, label.name, label.color)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setDeletingLabelId(label._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
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
                title="Delete label?"
                description={`This will remove "${deletingLabelName}" from all cards on this board.`}
                confirmText="Delete label"
            />
        </>
    );
}

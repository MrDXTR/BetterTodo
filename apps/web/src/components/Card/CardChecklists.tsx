import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { CheckSquare, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TextWithLinkPreviews } from "@/components/ui/text-with-link-previews";

interface CardChecklistsProps {
    cardId: Id<"cards">;
    isReadOnly?: boolean;
}

interface ChecklistItemUI {
    _id: string;
    title: string;
    completed: boolean;
    position: number;
    isOptimistic?: boolean;
}

interface ChecklistUI {
    _id: string;
    title: string;
    position: number;
    items: ChecklistItemUI[];
    isOptimistic?: boolean;
}

const toUI = (checklist: any): ChecklistUI => ({
    _id: String(checklist._id),
    title: checklist.title,
    position: checklist.position,
    items: (checklist.items || []).map((item: any) => ({
        _id: String(item._id),
        title: item.title,
        completed: item.completed,
        position: item.position,
    })),
});

export function CardChecklists({ cardId, isReadOnly = false }: CardChecklistsProps) {
    const checklists = useQuery(api.checklists.getByCard, { cardId });
    const createChecklist = useMutation(api.checklists.create);
    const deleteChecklist = useMutation(api.checklists.deleteChecklist);
    const createItem = useMutation(api.checklists.createItem);
    const updateItem = useMutation(api.checklists.updateItem);
    const deleteItem = useMutation(api.checklists.deleteItem);

    const [localChecklists, setLocalChecklists] = useState<ChecklistUI[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState("");
    const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
    const [creatingItemFor, setCreatingItemFor] = useState<Record<string, boolean>>({});
    const [deletingChecklistIds, setDeletingChecklistIds] = useState<Record<string, boolean>>({});
    const [deletingItemIds, setDeletingItemIds] = useState<Record<string, boolean>>({});
    const [togglingItemIds, setTogglingItemIds] = useState<Record<string, boolean>>({});

    const serverSignature = useMemo(() => {
        if (!checklists) return "";
        return checklists
            .map((checklist: any) => {
                const items = (checklist.items || [])
                    .map((item: any) => `${item._id}:${item.title}:${item.completed}`)
                    .join("|");
                return `${checklist._id}:${checklist.title}:${items}`;
            })
            .join("||");
    }, [checklists]);

    useEffect(() => {
        if (!checklists) return;
        setLocalChecklists((checklists as any[]).map(toUI));
    }, [serverSignature]);

    if (!checklists) return null;

    const handleCreateChecklist = async () => {
        if (isReadOnly) return;
        if (!newChecklistTitle.trim() || isCreatingChecklist) return;

        const tempId = `temp-checklist-${Date.now()}`;
        const title = newChecklistTitle.trim();

        setIsCreatingChecklist(true);
        setLocalChecklists((prev) => [
            ...prev,
            {
                _id: tempId,
                title,
                position: prev.length + 1,
                items: [],
                isOptimistic: true,
            },
        ]);
        setNewChecklistTitle("");
        setIsCreating(false);

        try {
            const created = await createChecklist({ cardId, title });
            setLocalChecklists((prev) =>
                prev.map((checklist) =>
                    checklist._id === tempId
                        ? {
                              _id: String(created?._id),
                              title: created?.title ?? title,
                              position: created?.position ?? checklist.position,
                              items: [],
                          }
                        : checklist,
                ),
            );
        } catch (error) {
            setLocalChecklists((prev) => prev.filter((checklist) => checklist._id !== tempId));
            toast.error("Failed to create checklist");
            console.error("Error creating checklist:", error);
        } finally {
            setIsCreatingChecklist(false);
        }
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        if (isReadOnly) return;
        if (checklistId.startsWith("temp-")) {
            setLocalChecklists((prev) => prev.filter((checklist) => checklist._id !== checklistId));
            return;
        }

        const previous = localChecklists;
        setDeletingChecklistIds((prev) => ({ ...prev, [checklistId]: true }));
        setLocalChecklists((prev) => prev.filter((checklist) => checklist._id !== checklistId));

        try {
            await deleteChecklist({ checklistId: checklistId as Id<"checklists"> });
        } catch (error) {
            setLocalChecklists(previous);
            toast.error("Failed to delete checklist");
            console.error("Error deleting checklist:", error);
        } finally {
            setDeletingChecklistIds((prev) => {
                const { [checklistId]: _removed, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleCreateItem = async (checklistId: string) => {
        if (isReadOnly) return;
        if (checklistId.startsWith("temp-")) return;

        const title = (newItemTitles[checklistId] || "").trim();
        if (!title || creatingItemFor[checklistId]) return;

        const tempId = `temp-item-${Date.now()}`;

        setCreatingItemFor((prev) => ({ ...prev, [checklistId]: true }));
        setNewItemTitles((prev) => ({ ...prev, [checklistId]: "" }));
        setLocalChecklists((prev) =>
            prev.map((checklist) => {
                if (checklist._id !== checklistId) return checklist;
                return {
                    ...checklist,
                    items: [
                        ...checklist.items,
                        {
                            _id: tempId,
                            title,
                            completed: false,
                            position: checklist.items.length + 1,
                            isOptimistic: true,
                        },
                    ],
                };
            }),
        );

        try {
            const created = await createItem({
                checklistId: checklistId as Id<"checklists">,
                title,
            });

            setLocalChecklists((prev) =>
                prev.map((checklist) => {
                    if (checklist._id !== checklistId) return checklist;
                    return {
                        ...checklist,
                        items: checklist.items.map((item) =>
                            item._id === tempId
                                ? {
                                      _id: String(created?._id),
                                      title: created?.title ?? title,
                                      completed: created?.completed ?? false,
                                      position: created?.position ?? item.position,
                                  }
                                : item,
                        ),
                    };
                }),
            );
        } catch (error) {
            setLocalChecklists((prev) =>
                prev.map((checklist) => {
                    if (checklist._id !== checklistId) return checklist;
                    return {
                        ...checklist,
                        items: checklist.items.filter((item) => item._id !== tempId),
                    };
                }),
            );
            setNewItemTitles((prev) => ({ ...prev, [checklistId]: title }));
            toast.error("Failed to add checklist item");
            console.error("Error creating item:", error);
        } finally {
            setCreatingItemFor((prev) => {
                const { [checklistId]: _removed, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleToggleItem = async (checklistId: string, itemId: string, completed: boolean) => {
        if (isReadOnly) return;
        if (itemId.startsWith("temp-")) return;

        setTogglingItemIds((prev) => ({ ...prev, [itemId]: true }));
        setLocalChecklists((prev) =>
            prev.map((checklist) => {
                if (checklist._id !== checklistId) return checklist;
                return {
                    ...checklist,
                    items: checklist.items.map((item) =>
                        item._id === itemId ? { ...item, completed: !completed } : item,
                    ),
                };
            }),
        );

        try {
            await updateItem({
                itemId: itemId as Id<"checklistItems">,
                completed: !completed,
            });
        } catch (error) {
            setLocalChecklists((prev) =>
                prev.map((checklist) => {
                    if (checklist._id !== checklistId) return checklist;
                    return {
                        ...checklist,
                        items: checklist.items.map((item) =>
                            item._id === itemId ? { ...item, completed } : item,
                        ),
                    };
                }),
            );
            toast.error("Failed to update checklist item");
            console.error("Error toggling item:", error);
        } finally {
            setTogglingItemIds((prev) => {
                const { [itemId]: _removed, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleDeleteItem = async (checklistId: string, itemId: string) => {
        if (isReadOnly) return;
        const previous = localChecklists;

        setDeletingItemIds((prev) => ({ ...prev, [itemId]: true }));
        setLocalChecklists((prev) =>
            prev.map((checklist) => {
                if (checklist._id !== checklistId) return checklist;
                return {
                    ...checklist,
                    items: checklist.items.filter((item) => item._id !== itemId),
                };
            }),
        );

        try {
            if (!itemId.startsWith("temp-")) {
                await deleteItem({ itemId: itemId as Id<"checklistItems"> });
            }
        } catch (error) {
            setLocalChecklists(previous);
            toast.error("Failed to delete checklist item");
            console.error("Error deleting item:", error);
        } finally {
            setDeletingItemIds((prev) => {
                const { [itemId]: _removed, ...rest } = prev;
                return rest;
            });
        }
    };

    const calculateProgress = (items: ChecklistItemUI[]) => {
        if (items.length === 0) return 0;
        const completed = items.filter((item) => item.completed).length;
        return Math.round((completed / items.length) * 100);
    };

    return (
        <div className="space-y-4">
            {localChecklists.map((checklist) => {
                const progress = calculateProgress(checklist.items || []);
                const isDeletingChecklist = !!deletingChecklistIds[checklist._id];
                const isAddingItem = !!creatingItemFor[checklist._id];

                return (
                    <div key={checklist._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <CheckSquare className="w-4 h-4" />
                                <h4 className="font-semibold text-sm [word-break:break-word]">
                                    {checklist.title}
                                </h4>
                                {checklist.isOptimistic && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteChecklist(checklist._id)}
                                disabled={
                                    isDeletingChecklist || checklist.isOptimistic || isReadOnly
                                }
                            >
                                {isDeletingChecklist ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                            <Progress value={progress} className="flex-1" />
                        </div>

                        <div className="space-y-1 ml-6">
                            {checklist.items?.map((item) => {
                                const isDeleting = !!deletingItemIds[item._id];
                                const isToggling = !!togglingItemIds[item._id];

                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center gap-2 group p-1 [word-break:break-word] rounded hover:bg-muted"
                                    >
                                        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                        <Checkbox
                                            checked={item.completed}
                                            onCheckedChange={() =>
                                                handleToggleItem(
                                                    checklist._id,
                                                    item._id,
                                                    item.completed,
                                                )
                                            }
                                            disabled={
                                                isToggling ||
                                                isDeleting ||
                                                item.isOptimistic ||
                                                isReadOnly
                                            }
                                        />
                                        <span
                                            className={`flex-1 text-sm ${
                                                item.completed
                                                    ? "line-through text-muted-foreground"
                                                    : ""
                                            }`}
                                        >
                                            <TextWithLinkPreviews text={item.title} />
                                        </span>
                                        {(isToggling || item.isOptimistic) && (
                                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                            onClick={() =>
                                                handleDeleteItem(checklist._id, item._id)
                                            }
                                            disabled={isDeleting || isToggling || isReadOnly}
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3 h-3" />
                                            )}
                                        </Button>
                                    </div>
                                );
                            })}

                            <div className="flex items-center gap-2 mt-2">
                                <Input
                                    placeholder="Add an item..."
                                    value={newItemTitles[checklist._id] || ""}
                                    onChange={(e) =>
                                        setNewItemTitles({
                                            ...newItemTitles,
                                            [checklist._id]: e.target.value,
                                        })
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateItem(checklist._id);
                                    }}
                                    className="h-8 text-sm"
                                    disabled={isAddingItem || checklist.isOptimistic || isReadOnly}
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCreateItem(checklist._id)}
                                    disabled={
                                        !newItemTitles[checklist._id]?.trim() ||
                                        isAddingItem ||
                                        checklist.isOptimistic ||
                                        isReadOnly
                                    }
                                >
                                    {isAddingItem && (
                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    )}
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {isCreating ? (
                <div className="space-y-2">
                    <Input
                        placeholder="Checklist title..."
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateChecklist();
                            if (e.key === "Escape" && !isCreatingChecklist) setIsCreating(false);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                        disabled={isCreatingChecklist}
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleCreateChecklist}
                            disabled={!newChecklistTitle.trim() || isCreatingChecklist}
                        >
                            {isCreatingChecklist && (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            )}
                            Add
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsCreating(false)}
                            disabled={isCreatingChecklist}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                !isReadOnly && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setIsCreating(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Checklist
                    </Button>
                )
            )}
        </div>
    );
}

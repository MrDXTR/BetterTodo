import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { CheckSquare, Plus, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TextWithLinkPreviews } from "@/components/ui/text-with-link-previews";
import { cn } from "@/lib/utils";

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
        const previous = localChecklists;

        setDeletingChecklistIds((prev) => ({ ...prev, [checklistId]: true }));
        setLocalChecklists((prev) => prev.filter((c) => c._id !== checklistId));

        try {
            if (!checklistId.startsWith("temp-")) {
                await deleteChecklist({ checklistId: checklistId as Id<"checklists"> });
            }
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
        const itemTitle = (newItemTitles[checklistId] || "").trim();
        if (!itemTitle || creatingItemFor[checklistId]) return;

        const tempId = `temp-item-${Date.now()}`;
        setCreatingItemFor((prev) => ({ ...prev, [checklistId]: true }));

        setLocalChecklists((prev) =>
            prev.map((checklist) => {
                if (checklist._id !== checklistId) return checklist;
                const nextPosition = (checklist.items?.length || 0) + 1;
                return {
                    ...checklist,
                    items: [
                        ...checklist.items,
                        {
                            _id: tempId,
                            title: itemTitle,
                            completed: false,
                            position: nextPosition,
                            isOptimistic: true,
                        },
                    ],
                };
            }),
        );

        setNewItemTitles((prev) => ({ ...prev, [checklistId]: "" }));

        try {
            const created = await createItem({
                checklistId: checklistId as Id<"checklists">,
                title: itemTitle,
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
                                      title: created?.title ?? itemTitle,
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
            toast.error("Failed to create checklist item");
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
                const isAllCompleted = checklist.items?.length > 0 && progress === 100;

                return (
                    <div
                        key={checklist._id}
                        className="space-y-2.5 rounded-lg border border-border/60 bg-card/40 p-3 shadow-2xs"
                    >
                        {/* Header: Title, Progress %, Delete */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                                <h4 className="font-semibold text-xs text-foreground truncate">
                                    {checklist.title}
                                </h4>
                                {checklist.isOptimistic && (
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span
                                    className={cn(
                                        "text-[11px] font-medium",
                                        isAllCompleted
                                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {progress}%
                                </span>
                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => handleDeleteChecklist(checklist._id)}
                                        disabled={
                                            isDeletingChecklist ||
                                            checklist.isOptimistic ||
                                            isReadOnly
                                        }
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        title="Delete checklist"
                                    >
                                        {isDeletingChecklist ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <Progress
                            value={progress}
                            className={cn(
                                "h-1.5 transition-all",
                                isAllCompleted && "[&>div]:bg-emerald-500",
                            )}
                        />

                        {/* Checklist Items */}
                        <div className="space-y-1 pt-1">
                            {checklist.items?.map((item) => {
                                const isDeleting = !!deletingItemIds[item._id];
                                const isToggling = !!togglingItemIds[item._id];

                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center gap-2 group px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                                    >
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
                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                        <span
                                            className={cn(
                                                "flex-1 text-xs leading-normal transition-[color,text-decoration-line]",
                                                item.completed
                                                    ? "line-through text-muted-foreground"
                                                    : "text-foreground",
                                            )}
                                        >
                                            <TextWithLinkPreviews text={item.title} />
                                        </span>
                                        {(isToggling || item.isOptimistic) && (
                                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />
                                        )}
                                        {!isReadOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="opacity-0 group-hover:opacity-100 max-sm:opacity-70 transition-opacity h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() =>
                                                    handleDeleteItem(checklist._id, item._id)
                                                }
                                                disabled={isDeleting || isToggling || isReadOnly}
                                                title="Delete item"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Add Item Input */}
                            {!isReadOnly && (
                                <div className="flex items-center gap-2 pt-1.5">
                                    <Input
                                        placeholder="Add an item..."
                                        value={newItemTitles[checklist._id] || ""}
                                        onChange={(e) =>
                                            setNewItemTitles((prev) => ({
                                                ...prev,
                                                [checklist._id]: e.target.value,
                                            }))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleCreateItem(checklist._id);
                                            }
                                        }}
                                        className="h-7 text-xs bg-background/70"
                                        disabled={creatingItemFor[checklist._id]}
                                    />
                                    <Button
                                        size="xs"
                                        onClick={() => handleCreateItem(checklist._id)}
                                        disabled={
                                            !(newItemTitles[checklist._id] || "").trim() ||
                                            creatingItemFor[checklist._id]
                                        }
                                        className="h-7 text-xs px-2.5 gap-1"
                                    >
                                        {creatingItemFor[checklist._id] ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Plus className="w-3 h-3" />
                                        )}
                                        <span>Add</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Create Checklist Action */}
            {!isReadOnly && (
                <div>
                    {isCreating ? (
                        <div className="flex items-center gap-2 rounded-lg border border-border/70 p-2 bg-card/40">
                            <Input
                                placeholder="Checklist title..."
                                value={newChecklistTitle}
                                onChange={(e) => setNewChecklistTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateChecklist();
                                    }
                                    if (e.key === "Escape" && !isCreatingChecklist) {
                                        setIsCreating(false);
                                    }
                                }}
                                className="h-7 text-xs"
                                autoFocus
                                disabled={isCreatingChecklist}
                            />
                            <Button
                                size="xs"
                                onClick={handleCreateChecklist}
                                disabled={!newChecklistTitle.trim() || isCreatingChecklist}
                                className="h-7 text-xs px-2.5 gap-1"
                            >
                                {isCreatingChecklist ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Plus className="w-3 h-3" />
                                )}
                                <span>Create</span>
                            </Button>
                            <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setIsCreating(false)}
                                disabled={isCreatingChecklist}
                                className="h-7 text-xs px-2"
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground font-normal"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add checklist</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

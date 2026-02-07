import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { CheckSquare, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface CardChecklistsProps {
    cardId: Id<"cards">;
}

export function CardChecklists({ cardId }: CardChecklistsProps) {
    const checklists = useQuery(api.checklists.getByCard, { cardId });
    const createChecklist = useMutation(api.checklists.create);
    const deleteChecklist = useMutation(api.checklists.deleteChecklist);
    const createItem = useMutation(api.checklists.createItem);
    const updateItem = useMutation(api.checklists.updateItem);
    const deleteItem = useMutation(api.checklists.deleteItem);

    const [isCreating, setIsCreating] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState("");
    const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});

    if (!checklists) return null;

    const handleCreateChecklist = async () => {
        if (!newChecklistTitle.trim()) return;

        await createChecklist({
            cardId,
            title: newChecklistTitle.trim(),
        });

        setNewChecklistTitle("");
        setIsCreating(false);
    };

    const handleCreateItem = async (checklistId: Id<"checklists">) => {
        const title = newItemTitles[checklistId];
        if (!title?.trim()) return;

        await createItem({
            checklistId,
            title: title.trim(),
        });

        setNewItemTitles({ ...newItemTitles, [checklistId]: "" });
    };

    const handleToggleItem = async (itemId: Id<"checklistItems">, completed: boolean) => {
        await updateItem({
            itemId,
            completed: !completed,
        });
    };

    const calculateProgress = (items: any[]) => {
        if (items.length === 0) return 0;
        const completed = items.filter((item) => item.completed).length;
        return Math.round((completed / items.length) * 100);
    };

    return (
        <div className="space-y-4">
            {checklists.map((checklist: any) => {
                const progress = calculateProgress(checklist.items || []);

                return (
                    <div key={checklist._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" />
                                <h4 className="font-semibold text-sm">{checklist.title}</h4>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteChecklist({ checklistId: checklist._id })}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                            <Progress value={progress} className="flex-1" />
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-1 ml-6">
                            {checklist.items?.map((item: any) => (
                                <div
                                    key={item._id}
                                    className="flex items-center gap-2 group p-1 rounded hover:bg-muted"
                                >
                                    <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                    <Checkbox
                                        checked={item.completed}
                                        onCheckedChange={() => handleToggleItem(item._id, item.completed)}
                                    />
                                    <span
                                        className={`flex-1 text-sm ${item.completed ? "line-through text-muted-foreground" : ""
                                            }`}
                                    >
                                        {item.title}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                        onClick={() => deleteItem({ itemId: item._id })}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}

                            {/* Add item input */}
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
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCreateItem(checklist._id)}
                                    disabled={!newItemTitles[checklist._id]?.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Create new checklist */}
            {isCreating ? (
                <div className="space-y-2">
                    <Input
                        placeholder="Checklist title..."
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateChecklist();
                            if (e.key === "Escape") setIsCreating(false);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateChecklist}>
                            Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setIsCreating(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Checklist
                </Button>
            )}
        </div>
    );
}

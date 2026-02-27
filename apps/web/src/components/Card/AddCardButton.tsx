import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCardButtonProps {
    listId: Id<"lists">;
    boardColor?: string;
}

export function AddCardButton({ listId, boardColor = "#0079BF" }: AddCardButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const createCard = useMutation(api.cards.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

        setIsCreating(true);
        try {
            await createCard({
                listId,
                title: title.trim(),
            });

            setTitle("");
            toast.success("Card created!");
        } catch (error) {
            console.error("Error creating card:", error);
            toast.error("Failed to create card");
        } finally {
            setIsCreating(false);
        }
    };

    if (isAdding) {
        return (
            <form
                onSubmit={handleSubmit}
                className="space-y-2 p-2 rounded-lg backdrop-blur-sm"
                style={{
                    background: `${boardColor}08`,
                }}
            >
                <Input
                    autoFocus
                    placeholder="Enter card title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                        if (!title.trim()) {
                            setIsAdding(false);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setIsAdding(false);
                            setTitle("");
                        }
                    }}
                    className="border-0 bg-background/80 backdrop-blur-sm focus-visible:ring-1 shadow-sm"
                    style={{
                        boxShadow: `0 0 0 1px ${boardColor}30`,
                    }}
                    maxLength={200}
                />
                <div className="flex gap-2">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!title.trim() || isCreating}
                        className="transition-all gap-2"
                        style={{
                            background: !title.trim()
                                ? undefined
                                : `linear-gradient(135deg, ${boardColor} 0%, ${boardColor}dd 100%)`,
                            color: !title.trim() ? undefined : "white",
                        }}
                    >
                        {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                        Add Card
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setIsAdding(false);
                            setTitle("");
                        }}
                        className="hover:bg-background/80"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground transition-all hover:scale-[1.02] group"
            onClick={() => setIsAdding(true)}
            style={{
                background: `${boardColor}05`,
            }}
        >
            <Plus
                className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90"
                style={{ color: boardColor }}
            />
            <span className="font-medium">Add a card</span>
        </Button>
    );
}

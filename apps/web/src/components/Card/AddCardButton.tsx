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

export function AddCardButton({ listId }: AddCardButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const createCard = useMutation(api.cards.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || isCreating) return;

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
                className="space-y-2 p-2 rounded-lg bg-background/70 border border-border/70 shadow-xs"
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
                    className="h-8 text-xs bg-background focus-visible:ring-1"
                    maxLength={200}
                    disabled={isCreating}
                />
                <div className="flex items-center gap-1.5">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!title.trim() || isCreating}
                        className="h-7 text-xs px-2.5 gap-1.5"
                    >
                        {isCreating && <Loader2 className="h-3 w-3 animate-spin" />}
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
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-1.5 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground px-2.5 py-1.5 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] cursor-pointer text-left select-none"
        >
            <Plus className="h-3.5 w-3.5" />
            <span>Add a card</span>
        </button>
    );
}

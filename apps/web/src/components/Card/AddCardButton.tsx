import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCardButtonProps {
    listId: Id<"lists">;
}

export function AddCardButton({ listId }: AddCardButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState("");

    const createCard = useMutation(api.cards.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

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
        }
    };

    if (isAdding) {
        return (
            <form onSubmit={handleSubmit} className="space-y-2">
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
                    maxLength={200}
                />
                <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={!title.trim()}>
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
            className="w-full justify-start text-muted-foreground hover:bg-muted"
            onClick={() => setIsAdding(true)}
        >
            <Plus className="mr-2 h-4 w-4" />
            Add a card
        </Button>
    );
}

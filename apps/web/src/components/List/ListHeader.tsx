import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { MoreHorizontal, Trash2, Archive } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { List } from "@/types/board";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListHeaderProps {
    list: List;
}

export function ListHeader({ list }: ListHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(list.title);

    const updateList = useMutation(api.lists.update);
    const archiveList = useMutation(api.lists.archive);
    const deleteList = useMutation(api.lists.deleteList);

    const handleSaveTitle = async () => {
        if (!title.trim() || title === list.title) {
            setTitle(list.title);
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateList({
                listId: list._id,
                title: title.trim(),
            });
            setIsEditingTitle(false);
            toast.success("List title updated!");
        } catch (error) {
            console.error("Error updating list title:", error);
            toast.error("Failed to update list title");
            setTitle(list.title);
        }
    };

    const handleArchive = async () => {
        try {
            await archiveList({ listId: list._id });
            toast.success("List archived!");
        } catch (error) {
            console.error("Error archiving list:", error);
            toast.error("Failed to archive list");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will delete all cards in this list.")) {
            return;
        }

        try {
            await deleteList({ listId: list._id });
            toast.success("List deleted!");
        } catch (error) {
            console.error("Error deleting list:", error);
            toast.error("Failed to delete list");
        }
    };

    const cardCount = (list as any).cards?.length || 0;

    return (
        <div className="flex items-center justify-between gap-2 p-3 pb-2">
            {isEditingTitle ? (
                <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") {
                            setTitle(list.title);
                            setIsEditingTitle(false);
                        }
                    }}
                    className="h-8 font-semibold"
                    maxLength={100}
                />
            ) : (
                <button
                    onClick={() => setIsEditingTitle(true)}
                    className="flex-1 text-left rounded px-2 py-1 font-semibold hover:bg-muted transition-colors"
                >
                    {list.title}
                    {cardCount > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                            {cardCount}
                        </span>
                    )}
                </button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleArchive}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete List
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

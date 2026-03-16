import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { MoreHorizontal, Trash2, Archive, Loader2 } from "lucide-react";
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
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

interface ListHeaderProps {
    list: List;
    boardColor?: string;
    isReadOnly?: boolean;
}

export function ListHeader({ list, boardColor = "#0079BF", isReadOnly = false }: ListHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

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
        setIsArchiving(true);
        try {
            await archiveList({ listId: list._id });
            setShowArchiveDialog(false);
            toast.success("List archived!");
        } catch (error) {
            console.error("Error archiving list:", error);
            toast.error("Failed to archive list");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDelete = async () => {
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
        <div
            className="flex items-center justify-between gap-2 p-4 pb-3 border-b"
            style={{ borderColor: `${boardColor}20` }}
        >
            {isEditingTitle && !isReadOnly ? (
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
                    className="h-9 font-semibold border-0 bg-background/60 backdrop-blur-sm focus-visible:ring-1"
                    style={{
                        boxShadow: `0 0 0 1px ${boardColor}40`,
                    }}
                    maxLength={100}
                />
            ) : (
                <button
                    onClick={() => {
                        if (!isReadOnly) setIsEditingTitle(true);
                    }}
                    className="flex-1 text-left rounded-lg px-3 py-2 font-semibold hover:bg-muted/50 transition-all group disabled:opacity-60"
                    disabled={isReadOnly}
                >
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {list.title}
                    </span>
                    {cardCount > 0 && (
                        <span
                            className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                                background: `${boardColor}15`,
                                color: boardColor,
                            }}
                        >
                            {cardCount}
                        </span>
                    )}
                </button>
            )}

            {!isReadOnly && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted/50 transition-all"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="backdrop-blur-md">
                        <DropdownMenuItem
                            onClick={() => setShowArchiveDialog(true)}
                            className="cursor-pointer"
                            disabled={isArchiving}
                        >
                            {isArchiving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Archive className="mr-2 h-4 w-4" />
                            )}
                            Archive List
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive cursor-pointer"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete List
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Delete List"
                description="Are you sure? This will delete all cards in this list. This action cannot be undone."
            />

            <ConfirmationDialog
                open={showArchiveDialog}
                onOpenChange={setShowArchiveDialog}
                onConfirm={handleArchive}
                title="Archive List"
                description="Are you sure you want to archive this list? You can restore it later from archived items."
                confirmText="Archive"
                isLoading={isArchiving}
            />
        </div>
    );
}

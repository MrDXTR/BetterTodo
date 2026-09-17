import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { MoreHorizontal, Archive, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { api } from "@BetterTodo/backend/convex/_generated/api";

import type { List } from "@/types/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface ListHeaderProps {
    list: List;
    boardColor?: string;
    isReadOnly?: boolean;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function ListHeader({
    list,
    boardColor,
    isReadOnly = false,
    dragHandleProps,
}: ListHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(list.title);
    const isMobile = useIsMobile();

    useEffect(() => {
        setTitle(list.title);
    }, [list.title]);

    const updateListTitle = useMutation(api.lists.updateTitle);
    const deleteList = useMutation(api.lists.deleteList);
    const duplicateList = useMutation(api.lists.duplicate);
    const archiveList = useMutation(api.lists.archive);

    const handleSaveTitle = async () => {
        if (!title.trim() || title === list.title) {
            setTitle(list.title);
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateListTitle({
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

    const handleDuplicate = async () => {
        try {
            await duplicateList({ listId: list._id });
            toast.success("List duplicated!");
        } catch (error) {
            console.error("Error duplicating list:", error);
            toast.error("Failed to duplicate list");
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
            {...(!isMobile && !isReadOnly && dragHandleProps ? dragHandleProps : {})}
            className={cn(
                "flex flex-col border-b border-border/50 select-none",
                !isMobile && !isReadOnly && "cursor-grab active:cursor-grabbing",
            )}
        >
            {/* Top Drag Handle for Mobile */}
            {!isReadOnly && isMobile && dragHandleProps && (
                <div
                    {...dragHandleProps}
                    className="touch-none w-full flex items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing group/listhandle hover:bg-muted/30 transition-colors"
                    aria-label="Drag list"
                    title="Drag to reorder list"
                >
                    <div className="w-8 h-1 rounded-full bg-muted-foreground/30 group-hover/listhandle:bg-muted-foreground/60 group-active/listhandle:bg-primary transition-colors" />
                </div>
            )}

            {/* Title & Actions Row */}
            <div
                className={cn(
                    "flex items-center justify-between gap-1.5 px-3 pb-2",
                    !isReadOnly && isMobile && dragHandleProps ? "pt-0.5" : "pt-2.5",
                )}
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
                        className="h-7 text-xs font-semibold bg-background border-border/80 focus-visible:ring-1"
                        maxLength={100}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            if (!isReadOnly) setIsEditingTitle(true);
                        }}
                        className="flex-1 flex items-center gap-1.5 text-left rounded-md px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/60 transition-[background-color] disabled:opacity-60 cursor-pointer min-w-0"
                        disabled={isReadOnly}
                    >
                        <span className="truncate">{list.title}</span>
                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-muted/70 text-muted-foreground">
                            {cardCount}
                        </span>
                    </button>
                )}

                {!isReadOnly && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                aria-label="List options"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                            <DropdownMenuItem
                                onClick={handleDuplicate}
                                className="cursor-pointer gap-2"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                <span>Duplicate list</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleArchive}
                                className="cursor-pointer gap-2"
                            >
                                <Archive className="h-3.5 w-3.5" />
                                <span>Archive list</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="cursor-pointer text-destructive focus:text-destructive gap-2"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete list</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}

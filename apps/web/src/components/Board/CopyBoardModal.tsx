import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { generateCopyBoardTitle } from "@BetterTodo/backend/convex/lib/boardTransfer";
import { useMutation, useQuery } from "convex/react";
import { Copy, Layers, Tag, Loader2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Board } from "@/types/board";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CopyBoardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    board: Board | null;
    onCopied?: (newBoardId: Id<"boards">) => void;
}

export function CopyBoardModal({ open, onOpenChange, board, onCopied }: CopyBoardModalProps) {
    const [title, setTitle] = useState("");
    const [copyAllData, setCopyAllData] = useState(true);
    const [copyCustomTags, setCopyCustomTags] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allBoards = useQuery(api.boards.getAll);
    const copyBoard = useMutation(api.boards.copyBoard);

    useEffect(() => {
        if (open && board) {
            const existingTitles = (allBoards ?? []).map((b) => b.title);
            const suggested = generateCopyBoardTitle(board.title, existingTitles);
            setTitle(suggested);
            setCopyAllData(true);
            setCopyCustomTags(true);
        }
    }, [open, board, allBoards]);

    if (!board) return null;

    const handleCopy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Please enter a board title");
            return;
        }

        setIsSubmitting(true);
        try {
            const newBoard = await copyBoard({
                boardId: board._id as Id<"boards">,
                title: title.trim(),
                copyCards: copyAllData,
                copyCustomTags: copyCustomTags,
            });

            toast.success(`Board copied as "${newBoard?.title ?? title.trim()}"`);
            onOpenChange(false);
            if (newBoard?._id && onCopied) {
                onCopied(newBoard._id);
            }
        } catch (error: any) {
            console.error("Error copying board:", error);
            toast.error(error?.message || "Failed to copy board");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-5 sm:p-6 rounded-2xl border border-border/70 shadow-2xl">
                <form onSubmit={handleCopy}>
                    <DialogHeader className="pb-2">
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <Copy className="h-4 w-4 text-primary" />
                            <span>Copy board</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Create a copy of{" "}
                            <span className="font-semibold text-foreground">"{board.title}"</span>.
                            Choose which data to duplicate.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        {/* Title input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="copy-board-title" className="text-xs font-medium">
                                Title
                            </Label>
                            <Input
                                id="copy-board-title"
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter copy title..."
                                className="h-9 text-xs"
                                maxLength={100}
                                required
                            />
                        </div>

                        {/* Options Section */}
                        <div className="space-y-2 pt-1">
                            <Label className="text-xs font-semibold text-foreground">
                                Data to include
                            </Label>

                            {/* Checkbox: Copy all data */}
                            <div
                                onClick={() => setCopyAllData((prev) => !prev)}
                                className="flex items-start space-x-3 rounded-xl border border-border/70 p-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none"
                            >
                                <Checkbox
                                    id="copy-all-data-check"
                                    checked={copyAllData}
                                    onCheckedChange={(checked) => setCopyAllData(checked === true)}
                                    className="mt-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="space-y-0.5">
                                    <label
                                        htmlFor="copy-all-data-check"
                                        className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Layers className="h-3.5 w-3.5 text-primary" />
                                        <span>Copy all data</span>
                                    </label>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Includes all cards, checklists, task items, and card details
                                        in all lists.
                                    </p>
                                </div>
                            </div>

                            {/* Checkbox: Copy lists and custom tags */}
                            <div
                                onClick={() => setCopyCustomTags((prev) => !prev)}
                                className="flex items-start space-x-3 rounded-xl border border-border/70 p-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none"
                            >
                                <Checkbox
                                    id="copy-custom-tags-check"
                                    checked={copyCustomTags}
                                    onCheckedChange={(checked) =>
                                        setCopyCustomTags(checked === true)
                                    }
                                    className="mt-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="space-y-0.5">
                                    <label
                                        htmlFor="copy-custom-tags-check"
                                        className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Tag className="h-3.5 w-3.5 text-primary" />
                                        <span>Copy lists and custom tags</span>
                                    </label>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Preserves board columns (lists), custom labels, and custom
                                        field structures.
                                    </p>
                                </div>
                            </div>

                            {/* Helpful Status Summary */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-foreground/80 mt-2">
                                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>
                                    {copyAllData
                                        ? "Full Copy: All lists, custom tags, and cards will be copied."
                                        : copyCustomTags
                                          ? "Template Copy: Lists and custom tags will be copied without cards."
                                          : "Minimal Copy: Board structure only."}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t border-border/60">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="text-xs h-9 px-3.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !title.trim()}
                            className="text-xs h-9 px-4 gap-1.5"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>Create Copy</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

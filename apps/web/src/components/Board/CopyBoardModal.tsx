import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { generateCopyBoardTitle } from "@BetterTodo/backend/convex/lib/boardTransfer";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import {
    Check,
    CheckSquare,
    Columns3,
    Copy,
    CornerDownRight,
    FileText,
    Layers,
    LayoutGrid,
    ListTodo,
    Loader2,
    Sparkles,
    Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Board } from "@/types/board";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

interface CopyBoardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    board: Board | null;
    onCopied?: (newBoardId: Id<"boards">) => void;
}

interface MiniBoardPreviewProps {
    boardTitle: string;
    boardColor?: string;
    includeLists: boolean;
    includeCards: boolean;
    includeCardData: boolean;
    includeCustomTags: boolean;
}

/**
 * Animated visual representation of the board copy configuration
 */
function MiniBoardPreview({
    boardTitle,
    boardColor = "#0079BF",
    includeLists,
    includeCards,
    includeCardData,
    includeCustomTags,
}: MiniBoardPreviewProps) {
    const statusLabel =
        includeLists && includeCards && includeCardData && includeCustomTags
            ? "All Data"
            : includeLists && includeCards && includeCardData
              ? "Lists + Cards + Tasks"
              : includeLists && includeCards
                ? "Lists + Cards"
                : includeLists && includeCustomTags
                  ? "Lists + Tags"
                  : includeLists
                    ? "Lists Only"
                    : includeCustomTags
                      ? "Tags Only"
                      : "Blank Board";

    return (
        <div className="flex flex-col h-full rounded-2xl border border-border/80 bg-card/80 dark:bg-card/40 p-3.5 shadow-xs overflow-hidden">
            {/* Visual Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/20 shadow-2xs"
                        style={{ backgroundColor: boardColor }}
                    />
                    <span className="text-[11px] font-semibold text-foreground truncate max-w-[130px]">
                        {boardTitle || "Board Preview"}
                    </span>
                </div>
                <Badge
                    variant="secondary"
                    className="text-[10px] font-medium px-2 py-0 h-4.5 bg-primary/10 text-primary border-primary/20 shrink-0"
                >
                    {statusLabel}
                </Badge>
            </div>

            {/* Canvas Area */}
            <div className="relative flex-1 min-h-[175px] max-h-[220px] rounded-xl bg-muted/30 dark:bg-muted/15 p-2 overflow-hidden flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {!includeLists ? (
                        <motion.div
                            key="no-lists"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col items-center justify-center py-6 px-3 border border-dashed border-border/70 rounded-lg text-center"
                        >
                            <div className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-1.5">
                                <Columns3 className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                                No Columns
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                Copying board structure without lists or cards.
                            </span>
                            {includeCustomTags && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mt-2 flex items-center gap-1.5"
                                >
                                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                                        <Tag className="h-2.5 w-2.5" /> Custom tags saved
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="has-lists"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 gap-2 h-full"
                        >
                            {/* Column 1: To Do */}
                            <div className="flex flex-col rounded-lg border border-border/70 bg-background/90 dark:bg-background/60 p-2 min-h-0 shadow-2xs">
                                <div className="flex items-center justify-between pb-1.5 border-b border-border/50 mb-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                                        <span className="text-[10px] font-semibold text-foreground truncate">
                                            To Do
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono px-1 rounded bg-muted text-muted-foreground">
                                        {includeCards ? "2" : "0"}
                                    </span>
                                </div>

                                <div className="space-y-1.5 overflow-hidden flex-1">
                                    <AnimatePresence>
                                        {includeCards ? (
                                            <>
                                                {/* Mini Card 1 */}
                                                <motion.div
                                                    key="card-1"
                                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.92 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="rounded-md border border-border/60 bg-card p-1.5 shadow-2xs space-y-1"
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-[10px] font-medium text-foreground truncate leading-tight">
                                                            Design system
                                                        </span>
                                                        {includeCustomTags && (
                                                            <motion.span
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                className="text-[8px] px-1 py-0.2 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold shrink-0"
                                                            >
                                                                UI
                                                            </motion.span>
                                                        )}
                                                    </div>

                                                    {includeCardData && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{
                                                                opacity: 1,
                                                                height: "auto",
                                                            }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="space-y-0.5 pt-0.5"
                                                        >
                                                            <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                                                                <span className="flex items-center gap-0.5 font-medium">
                                                                    <CheckSquare className="h-2.5 w-2.5 text-primary" />
                                                                    2/3
                                                                </span>
                                                                <span className="text-[8px] text-amber-500 font-semibold">
                                                                    High
                                                                </span>
                                                            </div>
                                                            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                                                <div className="h-full bg-primary rounded-full w-2/3" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </motion.div>

                                                {/* Mini Card 2 */}
                                                <motion.div
                                                    key="card-2"
                                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.92 }}
                                                    transition={{ duration: 0.15, delay: 0.04 }}
                                                    className="rounded-md border border-border/60 bg-card p-1.5 shadow-2xs space-y-1"
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-[10px] font-medium text-foreground truncate leading-tight">
                                                            Auth tokens
                                                        </span>
                                                        {includeCustomTags && (
                                                            <motion.span
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0"
                                                            >
                                                                API
                                                            </motion.span>
                                                        )}
                                                    </div>

                                                    {includeCardData && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{
                                                                opacity: 1,
                                                                height: "auto",
                                                            }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="flex items-center gap-1 text-[8px] text-muted-foreground pt-0.5"
                                                        >
                                                            <CheckSquare className="h-2.5 w-2.5 text-primary" />
                                                            <span>1/1 checklist</span>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            </>
                                        ) : (
                                            <motion.div
                                                key="empty-cards-col1"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="h-16 flex items-center justify-center border border-dashed border-border/50 rounded text-[9px] text-muted-foreground/60 italic"
                                            >
                                                No cards
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Column 2: In Progress */}
                            <div className="flex flex-col rounded-lg border border-border/70 bg-background/90 dark:bg-background/60 p-2 min-h-0 shadow-2xs">
                                <div className="flex items-center justify-between pb-1.5 border-b border-border/50 mb-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                        <span className="text-[10px] font-semibold text-foreground truncate">
                                            In Progress
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono px-1 rounded bg-muted text-muted-foreground">
                                        {includeCards ? "1" : "0"}
                                    </span>
                                </div>

                                <div className="space-y-1.5 overflow-hidden flex-1">
                                    <AnimatePresence>
                                        {includeCards ? (
                                            <motion.div
                                                key="card-3"
                                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.92 }}
                                                transition={{ duration: 0.15 }}
                                                className="rounded-md border border-border/60 bg-card p-1.5 shadow-2xs space-y-1"
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[10px] font-medium text-foreground truncate leading-tight">
                                                        Notifications
                                                    </span>
                                                    {includeCustomTags && (
                                                        <motion.span
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            className="text-[8px] px-1 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold shrink-0"
                                                        >
                                                            V1
                                                        </motion.span>
                                                    )}
                                                </div>

                                                {includeCardData && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="space-y-0.5 pt-0.5"
                                                    >
                                                        <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                                                            <span className="flex items-center gap-0.5 font-medium">
                                                                <CheckSquare className="h-2.5 w-2.5 text-primary" />
                                                                4/4
                                                            </span>
                                                            <span className="text-[8px] text-emerald-500 font-semibold">
                                                                Done
                                                            </span>
                                                        </div>
                                                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full w-full" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty-cards-col2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="h-16 flex items-center justify-center border border-dashed border-border/50 rounded text-[9px] text-muted-foreground/60 italic"
                                            >
                                                No cards
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export function CopyBoardModal({ open, onOpenChange, board, onCopied }: CopyBoardModalProps) {
    const [title, setTitle] = useState("");
    const [includeLists, setIncludeLists] = useState(true);
    const [includeCards, setIncludeCards] = useState(true);
    const [includeCardData, setIncludeCardData] = useState(true);
    const [includeCustomTags, setIncludeCustomTags] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allBoards = useQuery(api.boards.getAll);
    const copyBoard = useMutation(api.boards.copyBoard);

    useEffect(() => {
        if (open && board) {
            const existingTitles = (allBoards ?? []).map((b) => b.title);
            const suggested = generateCopyBoardTitle(board.title, existingTitles);
            setTitle(suggested);
            setIncludeLists(true);
            setIncludeCards(true);
            setIncludeCardData(true);
            setIncludeCustomTags(true);
        }
    }, [open, board, allBoards]);

    if (!board) return null;

    const isAllDataSelected = includeLists && includeCards && includeCardData && includeCustomTags;

    // Toggle All Data master switch
    const handleToggleAllData = (checked: boolean) => {
        if (checked) {
            setIncludeLists(true);
            setIncludeCards(true);
            setIncludeCardData(true);
            setIncludeCustomTags(true);
        } else {
            // Unchecking All Data clears down to template (lists and tags)
            setIncludeLists(true);
            setIncludeCards(false);
            setIncludeCardData(false);
            setIncludeCustomTags(true);
        }
    };

    // Toggle Lists (if unchecked, cards and card data cannot be copied)
    const handleToggleLists = (checked: boolean) => {
        setIncludeLists(checked);
        if (!checked) {
            setIncludeCards(false);
            setIncludeCardData(false);
        }
    };

    // Toggle Cards (only if lists is selected; if unchecked, card data is unchecked)
    const handleToggleCards = (checked: boolean) => {
        if (!includeLists) return;
        setIncludeCards(checked);
        if (!checked) {
            setIncludeCardData(false);
        }
    };

    // Toggle Data inside Card (only if cards is selected)
    const handleToggleCardData = (checked: boolean) => {
        if (!includeCards) return;
        setIncludeCardData(checked);
    };

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
                copyLists: includeLists,
                copyCards: includeCards,
                copyCardData: includeCardData,
                copyCustomTags: includeCustomTags,
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
            <DialogContent className="sm:max-w-[660px] w-[95vw] p-5 sm:p-6 rounded-2xl border border-border/70 shadow-2xl max-h-[92dvh] overflow-y-auto">
                <form onSubmit={handleCopy} className="space-y-4">
                    <DialogHeader className="pb-1">
                        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                            <Copy className="h-4 w-4 text-primary" />
                            <span>Copy board</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Create a duplicate of{" "}
                            <span className="font-semibold text-foreground">"{board.title}"</span>.
                            Choose what data to include.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Responsive Grid: Left options, Right / Top preview */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 pt-1">
                        {/* Right / Top Live Visual Representation */}
                        {/* On mobile: displayed at the top so user immediately sees live motion updates */}
                        <div className="md:col-span-5 order-first md:order-last flex flex-col justify-stretch">
                            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 hidden md:block">
                                Visual Preview
                            </Label>
                            <MiniBoardPreview
                                boardTitle={title || board.title}
                                boardColor={board.color}
                                includeLists={includeLists}
                                includeCards={includeCards}
                                includeCardData={includeCardData}
                                includeCustomTags={includeCustomTags}
                            />
                        </div>

                        {/* Left Column: Title and Options */}
                        <div className="md:col-span-7 space-y-3.5 order-last md:order-first">
                            {/* Title input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="copy-board-title" className="text-xs font-medium">
                                    Board Title
                                </Label>
                                <Input
                                    id="copy-board-title"
                                    autoFocus
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter copy title..."
                                    className="h-8.5 text-xs"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            {/* Options Hierarchy */}
                            <div className="space-y-2 pt-0.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>Data to copy</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                        Select individual data
                                    </span>
                                </Label>

                                {/* 1. Master Toggle: All Data */}
                                <div
                                    onClick={() => handleToggleAllData(!isAllDataSelected)}
                                    className={cn(
                                        "flex items-start space-x-2.5 rounded-xl border p-2.5 transition-all cursor-pointer select-none",
                                        isAllDataSelected
                                            ? "border-primary/40 bg-primary/8 shadow-2xs"
                                            : "border-border/70 bg-card hover:bg-muted/40",
                                    )}
                                >
                                    <Checkbox
                                        id="copy-option-all"
                                        checked={isAllDataSelected}
                                        onCheckedChange={(c) => handleToggleAllData(c === true)}
                                        className="mt-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-xs font-semibold text-foreground">
                                                All Data
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            Copy everything: lists, all cards, details, and custom
                                            tags.
                                        </p>
                                    </div>
                                </div>

                                {/* Granular Itemized Options with Visual Hierarchy */}
                                <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                                    {/* Option: Lists */}
                                    <div
                                        onClick={() => handleToggleLists(!includeLists)}
                                        className="flex items-start space-x-2.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer select-none"
                                    >
                                        <Checkbox
                                            id="copy-option-lists"
                                            checked={includeLists}
                                            onCheckedChange={(c) => handleToggleLists(c === true)}
                                            className="mt-0.5"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <Columns3 className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-foreground">
                                                    Lists
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Board columns and workflow stages
                                            </p>
                                        </div>
                                    </div>

                                    {/* Option: Cards (dependent on Lists) */}
                                    <div
                                        onClick={() =>
                                            includeLists && handleToggleCards(!includeCards)
                                        }
                                        className={cn(
                                            "flex items-start space-x-2.5 p-1.5 rounded-lg ml-3.5 border-l-2 transition-colors select-none",
                                            includeLists
                                                ? "border-primary/40 hover:bg-muted/50 cursor-pointer"
                                                : "border-border/30 opacity-50 cursor-not-allowed",
                                        )}
                                    >
                                        <Checkbox
                                            id="copy-option-cards"
                                            checked={includeCards}
                                            disabled={!includeLists}
                                            onCheckedChange={(c) => handleToggleCards(c === true)}
                                            className="mt-0.5"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <Layers className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-foreground">
                                                    Cards
                                                </span>
                                                {!includeLists && (
                                                    <span className="text-[9px] text-amber-500 font-medium">
                                                        (Requires Lists)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Individual cards inside the lists
                                            </p>
                                        </div>
                                    </div>

                                    {/* Option: Data inside Card (dependent on Cards) */}
                                    <div
                                        onClick={() =>
                                            includeCards && handleToggleCardData(!includeCardData)
                                        }
                                        className={cn(
                                            "flex items-start space-x-2.5 p-1.5 rounded-lg ml-7 border-l-2 transition-colors select-none",
                                            includeCards
                                                ? "border-primary/40 hover:bg-muted/50 cursor-pointer"
                                                : "border-border/30 opacity-50 cursor-not-allowed",
                                        )}
                                    >
                                        <Checkbox
                                            id="copy-option-card-data"
                                            checked={includeCardData}
                                            disabled={!includeCards}
                                            onCheckedChange={(c) =>
                                                handleToggleCardData(c === true)
                                            }
                                            className="mt-0.5"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-foreground">
                                                    Data inside Card
                                                </span>
                                                {!includeCards && (
                                                    <span className="text-[9px] text-amber-500 font-medium">
                                                        (Requires Cards)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Checklists, tasks, descriptions & field values
                                            </p>
                                        </div>
                                    </div>

                                    {/* Option: Custom Tags (independent) */}
                                    <div
                                        onClick={() => setIncludeCustomTags(!includeCustomTags)}
                                        className="flex items-start space-x-2.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer select-none border-t border-border/40 pt-2 mt-1"
                                    >
                                        <Checkbox
                                            id="copy-option-tags"
                                            checked={includeCustomTags}
                                            onCheckedChange={(c) =>
                                                setIncludeCustomTags(c === true)
                                            }
                                            className="mt-0.5"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <Tag className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs font-medium text-foreground">
                                                    Custom Tags
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                Board labels and custom field definitions
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
                            <span>Copy Board</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

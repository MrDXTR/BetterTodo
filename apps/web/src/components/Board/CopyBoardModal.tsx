import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { generateCopyBoardTitle } from "@BetterTodo/backend/convex/lib/boardTransfer";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
    CheckSquare,
    Columns3,
    Copy,
    Layers,
    Loader2,
    Sparkles,
    Tag,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

/* -------------------------------------------------------------------------- */
/* Preview sample data (purely illustrative, never read from the real board)  */
/* -------------------------------------------------------------------------- */

interface SampleCard {
    id: string;
    title: string;
    tag: string;
    tagClass: string;
    done: number;
    total: number;
    meta: string;
    metaClass: string;
}

interface SampleColumn {
    id: string;
    title: string;
    dotClass: string;
    cards: SampleCard[];
}

const SAMPLE_COLUMNS: SampleColumn[] = [
    {
        id: "todo",
        title: "To Do",
        dotClass: "bg-muted-foreground/60",
        cards: [
            {
                id: "design-system",
                title: "Design system",
                tag: "UI",
                tagClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                done: 2,
                total: 3,
                meta: "High",
                metaClass: "text-amber-500",
            },
            {
                id: "auth-tokens",
                title: "Auth tokens",
                tag: "API",
                tagClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                done: 1,
                total: 2,
                meta: "Medium",
                metaClass: "text-sky-500",
            },
        ],
    },
    {
        id: "progress",
        title: "In Progress",
        dotClass: "bg-amber-500",
        cards: [
            {
                id: "notifications",
                title: "Notifications",
                tag: "V1",
                tagClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                done: 4,
                total: 4,
                meta: "Done",
                metaClass: "text-emerald-500",
            },
        ],
    },
];

function getStatusLabel({
    includeLists,
    includeCards,
    includeCardData,
    includeCustomTags,
}: Pick<
    MiniBoardPreviewProps,
    "includeLists" | "includeCards" | "includeCardData" | "includeCustomTags"
>) {
    if (includeLists && includeCards && includeCardData && includeCustomTags) return "All Data";
    if (includeLists && includeCards && includeCardData) return "Lists + Cards + Tasks";
    if (includeLists && includeCards) return "Lists + Cards";
    if (includeLists && includeCustomTags) return "Lists + Tags";
    if (includeLists) return "Lists Only";
    if (includeCustomTags) return "Tags Only";
    return "Blank Board";
}

/* -------------------------------------------------------------------------- */
/* Small animated primitives                                                  */
/* -------------------------------------------------------------------------- */

function useSpring() {
    const reduce = useReducedMotion();
    return reduce
        ? ({ duration: 0 } as const)
        : ({ type: "spring", stiffness: 420, damping: 34, mass: 0.7 } as const);
}

function AnimatedCount({ value }: { value: number }) {
    const reduce = useReducedMotion();
    return (
        <span className="relative inline-flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-md bg-muted px-1 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    initial={reduce ? false : { y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? undefined : { y: 10, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

interface PreviewCardProps {
    card: SampleCard;
    index: number;
    includeCardData: boolean;
    includeCustomTags: boolean;
}

function PreviewCard({ card, index, includeCardData, includeCustomTags }: PreviewCardProps) {
    const spring = useSpring();
    const reduce = useReducedMotion();
    const pct = Math.round((card.done / card.total) * 100);
    const complete = card.done === card.total;

    return (
        <motion.div
            layout="position"
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.92, transition: { duration: 0.12 } }}
            transition={{ ...spring, delay: reduce ? 0 : index * 0.05 }}
            className="rounded-lg border border-border/70 bg-card p-2 shadow-xs"
        >
            <div className="flex items-center justify-between gap-1.5">
                <span className="truncate text-[11px] font-medium leading-tight text-foreground">
                    {card.title}
                </span>
                <AnimatePresence initial={false}>
                    {includeCustomTags && (
                        <motion.span
                            key="tag"
                            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={reduce ? undefined : { scale: 0.4, opacity: 0 }}
                            transition={spring}
                            className={cn(
                                "shrink-0 rounded px-1.5 py-px text-[9px] font-semibold",
                                card.tagClass,
                            )}
                        >
                            {card.tag}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
                {includeCardData && (
                    <motion.div
                        key="data"
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1.5 pt-1.5">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1 font-medium tabular-nums">
                                    <CheckSquare className="h-3 w-3 text-primary" />
                                    {card.done}/{card.total}
                                </span>
                                <span className={cn("font-semibold", card.metaClass)}>
                                    {card.meta}
                                </span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                                <motion.div
                                    initial={reduce ? false : { width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                        duration: reduce ? 0 : 0.5,
                                        ease: "easeOut",
                                        delay: reduce ? 0 : 0.08,
                                    }}
                                    className={cn(
                                        "h-full rounded-full",
                                        complete ? "bg-emerald-500" : "bg-primary",
                                    )}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
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
    const spring = useSpring();
    const reduce = useReducedMotion();
    const statusLabel = getStatusLabel({
        includeLists,
        includeCards,
        includeCardData,
        includeCustomTags,
    });

    return (
        <div className="h-full">
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm">
                {/* Soft glow tinted with the board color */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-[background-image] duration-500"
                    style={{
                        backgroundImage: `radial-gradient(110% 70% at 0% 0%, color-mix(in oklab, ${boardColor} 16%, transparent), transparent 65%)`,
                    }}
                />

                {/* Header */}
                <div className="relative mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-background"
                            style={{ backgroundColor: boardColor }}
                        />
                        <span className="truncate text-xs font-semibold text-foreground">
                            {boardTitle || "Board Preview"}
                        </span>
                    </div>
                    <Badge
                        variant="secondary"
                        className="relative h-5 shrink-0 overflow-hidden border-primary/20 bg-primary/10 px-2 py-0 text-[10px] font-medium text-primary"
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={statusLabel}
                                initial={reduce ? false : { y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={reduce ? undefined : { y: -12, opacity: 0 }}
                                transition={spring}
                                className="block whitespace-nowrap"
                            >
                                {statusLabel}
                            </motion.span>
                        </AnimatePresence>
                    </Badge>
                </div>

                {/* Canvas */}
                <div className="relative flex min-h-[170px] flex-1 flex-col overflow-hidden rounded-xl bg-muted/40 p-2 dark:bg-muted/20">
                    <AnimatePresence mode="wait" initial={false}>
                        {!includeLists ? (
                            <motion.div
                                key="no-lists"
                                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
                                transition={spring}
                                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 px-3 py-8 text-center"
                            >
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <Columns3 className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">
                                    No columns
                                </span>
                                <span className="mt-0.5 max-w-[190px] text-[11px] leading-snug text-muted-foreground">
                                    The copy starts as an empty board.
                                </span>
                                <AnimatePresence initial={false}>
                                    {includeCustomTags && (
                                        <motion.span
                                            key="tags-chip"
                                            initial={
                                                reduce ? false : { opacity: 0, y: 6, scale: 0.9 }
                                            }
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                                            transition={spring}
                                            className="mt-3 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                                        >
                                            <Tag className="h-3 w-3" />
                                            Custom tags kept
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="has-lists"
                                initial={reduce ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={reduce ? undefined : { opacity: 0 }}
                                transition={{ duration: reduce ? 0 : 0.15 }}
                                className="grid grid-cols-2 items-stretch gap-2 "
                            >
                                {SAMPLE_COLUMNS.map((column, colIndex) => (
                                    <motion.div
                                        key={column.id}
                                        initial={reduce ? false : { opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            ...spring,
                                            delay: reduce ? 0 : colIndex * 0.07,
                                        }}
                                        className="flex min-w-0 flex-col rounded-xl border border-border/70 bg-background/80 p-2 shadow-xs dark:bg-background/50"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-1 border-b border-border/50 pb-1.5">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                                <span
                                                    className={cn(
                                                        "h-1.5 w-1.5 shrink-0 rounded-full",
                                                        column.dotClass,
                                                    )}
                                                />
                                                <span className="truncate text-[11px] font-semibold text-foreground">
                                                    {column.title}
                                                </span>
                                            </div>
                                            <AnimatedCount
                                                value={includeCards ? column.cards.length : 0}
                                            />
                                        </div>

                                        <div className="flex flex-1 flex-col gap-1.5">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                {includeCards ? (
                                                    column.cards.map((card, cardIndex) => (
                                                        <PreviewCard
                                                            key={card.id}
                                                            card={card}
                                                            index={cardIndex}
                                                            includeCardData={includeCardData}
                                                            includeCustomTags={includeCustomTags}
                                                        />
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        key="empty"
                                                        layout="position"
                                                        initial={reduce ? false : { opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={reduce ? undefined : { opacity: 0 }}
                                                        className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/60 text-[10px] italic text-muted-foreground/70"
                                                    >
                                                        No cards
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Option row                                                                 */
/* -------------------------------------------------------------------------- */

interface OptionRowProps {
    id: string;
    icon: LucideIcon;
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    hint?: string;
    nested?: boolean;
    onCheckedChange: (checked: boolean) => void;
}

function OptionRow({
    id,
    icon: Icon,
    label,
    description,
    checked,
    disabled = false,
    hint,
    nested = false,
    onCheckedChange,
}: OptionRowProps) {
    return (
        <label
            htmlFor={id}
            className={cn(
                "relative flex select-none items-start gap-3 rounded-lg px-2.5 py-2 transition-colors",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/60",
                checked && !disabled && "bg-primary/[0.05]",
                // elbow connector to the parent rail
                nested &&
                    "before:absolute before:-left-3.5 before:top-[18px] before:h-px before:w-3 before:bg-border/70",
            )}
        >
            <Checkbox
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(c) => onCheckedChange(c === true)}
                className="mt-1"
            />
            <span
                className={cn(
                    "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                    checked && !disabled
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                )}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium leading-5 text-foreground">
                        {label}
                    </span>
                    {hint && (
                        <span className="rounded bg-amber-500/10 px-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            {hint}
                        </span>
                    )}
                </span>
                <span className="block text-[11px] leading-snug text-muted-foreground">
                    {description}
                </span>
            </span>
        </label>
    );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export function CopyBoardModal({ open, onOpenChange, board, onCopied }: CopyBoardModalProps) {
    const [title, setTitle] = useState("");
    const [includeLists, setIncludeLists] = useState(true);
    const [includeCards, setIncludeCards] = useState(true);
    const [includeCardData, setIncludeCardData] = useState(true);
    const [includeCustomTags, setIncludeCustomTags] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allBoards = useQuery(api.boards.getAll);
    const copyBoard = useMutation(api.boards.copyBoard);
    const allBoardsRef = useRef(allBoards);
    allBoardsRef.current = allBoards;

    useEffect(() => {
        if (open && board) {
            const existingTitles = (allBoardsRef.current ?? []).map((b) => b.title);
            const suggested = generateCopyBoardTitle(board.title, existingTitles);
            setTitle(suggested);
            setIncludeLists(true);
            setIncludeCards(true);
            setIncludeCardData(true);
            setIncludeCustomTags(true);
        }
    }, [open, board?._id]);

    if (!board) return null;

    const isAllDataSelected = includeLists && includeCards && includeCardData && includeCustomTags;
    const selectedCount = [includeLists, includeCards, includeCardData, includeCustomTags].filter(
        Boolean,
    ).length;

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
            <DialogContent className="max-h-[92dvh] w-[95vw] overflow-y-auto rounded-2xl border border-border/70 p-5 shadow-2xl sm:max-w-[780px] sm:p-6">
                <form onSubmit={handleCopy} className="space-y-4">
                    <DialogHeader className="space-y-0 text-left">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                                <Copy className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0 space-y-0.5 pr-6">
                                <DialogTitle className="text-base font-semibold leading-6">
                                    Copy board
                                </DialogTitle>
                                <DialogDescription className="text-xs leading-snug text-muted-foreground">
                                    Create a duplicate of{" "}
                                    <span className="font-semibold text-foreground">
                                        "{board.title}"
                                    </span>
                                    . Choose what data to include.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4.5 pb-2">
                        {/* Preview: on top for mobile so live updates stay visible */}
                        <div className="order-first flex flex-col md:order-last">
                            <Label className="mb-1.5 hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:block">
                                Visual Preview
                            </Label>
                            <div className="flex-1">
                                <MiniBoardPreview
                                    boardTitle={title || board.title}
                                    boardColor={board.color}
                                    includeLists={includeLists}
                                    includeCards={includeCards}
                                    includeCardData={includeCardData}
                                    includeCustomTags={includeCustomTags}
                                />
                            </div>
                        </div>

                        {/* Title and options */}
                        <div className="order-last space-y-3.5 md:order-first">
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
                                    className="h-10 text-base sm:h-9 sm:text-sm"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Data to copy
                                    </Label>
                                    <span className="text-[11px] tabular-nums text-muted-foreground">
                                        {selectedCount} of 4 selected
                                    </span>
                                </div>

                                {/* Master toggle */}
                                <label
                                    htmlFor="copy-option-all"
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-start gap-3 overflow-hidden rounded-xl border p-3 transition-all",
                                        isAllDataSelected
                                            ? "border-primary/40 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent shadow-xs"
                                            : "border-border/70 bg-card hover:bg-muted/40",
                                    )}
                                >
                                    <Checkbox
                                        id="copy-option-all"
                                        checked={isAllDataSelected}
                                        onCheckedChange={(c) => handleToggleAllData(c === true)}
                                        className="mt-1"
                                    />
                                    <span
                                        className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                                            isAllDataSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-semibold leading-5 text-foreground">
                                            All Data
                                        </span>
                                        <span className="block text-[11px] leading-snug text-muted-foreground">
                                            Copy everything: lists, all cards, details, and custom
                                            tags.
                                        </span>
                                    </span>
                                </label>

                                {/* Granular options */}
                                <div className="rounded-xl border border-border/60 bg-muted/20 p-2 space-y-1.5">
                                    <OptionRow
                                        id="copy-option-lists"
                                        icon={Columns3}
                                        label="Lists"
                                        description="Board columns and workflow stages"
                                        checked={includeLists}
                                        onCheckedChange={handleToggleLists}
                                    />

                                    <div className="ml-[21px] border-l border-border/70 pl-3.5 space-y-1.5">
                                        <OptionRow
                                            id="copy-option-cards"
                                            icon={Layers}
                                            label="Cards"
                                            description="Individual cards inside the lists"
                                            checked={includeCards}
                                            disabled={!includeLists}
                                            hint={!includeLists ? "Requires Lists" : undefined}
                                            nested
                                            onCheckedChange={handleToggleCards}
                                        />

                                        <div className="ml-[21px] border-l border-border/70 pl-3.5">
                                            <OptionRow
                                                id="copy-option-card-data"
                                                icon={CheckSquare}
                                                label="Data inside Card"
                                                description="Checklists, tasks, descriptions & field values"
                                                checked={includeCardData}
                                                disabled={!includeCards}
                                                hint={!includeCards ? "Requires Cards" : undefined}
                                                nested
                                                onCheckedChange={handleToggleCardData}
                                            />
                                        </div>
                                    </div>

                                    <div className="mx-2 my-1 h-px bg-border/60" />

                                    <OptionRow
                                        id="copy-option-tags"
                                        icon={Tag}
                                        label="Custom Tags"
                                        description="Board labels and custom field definitions"
                                        checked={includeCustomTags}
                                        onCheckedChange={setIncludeCustomTags}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-row items-center justify-end gap-2.5 border-t border-border/60 bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:-mb-6 sm:px-6">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="h-9 px-3.5 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !title.trim()}
                            className="h-9 gap-1.5 px-4 text-xs"
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

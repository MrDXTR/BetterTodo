import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    Archive,
    Calendar as CalendarIcon,
    CheckCircle2,
    Circle,
    Copy,
    Loader2,
    MessageSquare,
    Paperclip,
    Trash2,
    X,
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { CardCoverImage } from "./CardCoverImage";
import { CardLabels } from "./CardLabels";
import { CardMembers } from "./CardMembers";
import { CardChecklists } from "./CardChecklists";
import { CardAttachments } from "./CardAttachments";
import { CardComments } from "./CardComments";
import { CardCustomFields } from "./CardCustomFields";
import { CardDescription } from "./CardDescription";
import { toast } from "sonner";

interface CardModalProps {
    cardId: Id<"cards">;
    isOpen: boolean;
    onClose: () => void;
    isReadOnly?: boolean;
}

export function CardModal({ cardId, isOpen, onClose, isReadOnly = false }: CardModalProps) {
    const card = useQuery(api.cards.getById, { cardId });
    const updateCard = useMutation(api.cards.update);
    const deleteCard = useMutation(api.cards.deleteCard);
    const archiveCard = useMutation(api.cards.archive);
    const duplicateCard = useMutation(api.cards.duplicate);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    // Field mutation loading states
    const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
    const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);
    const [isTogglingComplete, setIsTogglingComplete] = useState(false);

    // Dialog states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // Sync card data to local state
    useEffect(() => {
        if (card) {
            setTitle(card.title || "");
            setDescription(card.description || "");
        }
    }, [card]);

    const isLoading = card === undefined;
    const notFound = card === null;

    // Check for unsaved changes
    const hasUnsavedChanges = () => {
        if (!card) return false;
        return (
            (isEditingTitle && title !== card.title) ||
            (isEditingDescription && description !== (card.description || ""))
        );
    };

    const handleClose = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedDialog(true);
        } else {
            onClose();
        }
    };

    const handleSaveTitle = async () => {
        if (!card || !title.trim() || title === card.title) {
            setIsEditingTitle(false);
            return;
        }
        try {
            await updateCard({ cardId: card._id, title: title.trim() });
            setIsEditingTitle(false);
        } catch (error) {
            console.error("Error updating title:", error);
            toast.error("Failed to update title");
        }
    };

    const handleSaveDescription = async () => {
        if (!card) return;
        try {
            await updateCard({ cardId: card._id, description: description.trim() });
            setIsEditingDescription(false);
            toast.success("Description updated");
        } catch (error) {
            console.error("Error updating description:", error);
            toast.error("Failed to update description");
            throw error;
        }
    };

    const handlePriorityChange = async (priority: string) => {
        if (!card || isUpdatingPriority) return;
        setIsUpdatingPriority(true);
        try {
            await updateCard({
                cardId: card._id,
                priority: priority === "none" ? undefined : (priority as any),
            });
            toast.success("Priority updated");
        } catch (error) {
            console.error("Error updating priority:", error);
            toast.error("Failed to update priority");
        } finally {
            setIsUpdatingPriority(false);
        }
    };

    const handleDueDateChange = async (date: Date | undefined) => {
        if (!card || isUpdatingDueDate) return;
        setIsUpdatingDueDate(true);
        try {
            await updateCard({
                cardId: card._id,
                dueDate: date ? date.getTime() : undefined,
            });
            toast.success("Due date updated");
        } catch (error) {
            console.error("Error updating due date:", error);
            toast.error("Failed to update due date");
        } finally {
            setIsUpdatingDueDate(false);
        }
    };

    const handleToggleComplete = async () => {
        if (!card || isTogglingComplete) return;
        setIsTogglingComplete(true);
        try {
            await updateCard({
                cardId: card._id,
                completed: !card.completed,
            });
        } catch (error) {
            console.error("Error toggling completed:", error);
            toast.error("Failed to update status");
        } finally {
            setIsTogglingComplete(false);
        }
    };

    const handleArchive = async () => {
        if (!card) return;
        setIsArchiving(true);
        try {
            await archiveCard({ cardId: card._id });
            setShowArchiveDialog(false);
            onClose();
            toast.success("Card archived");
        } catch (error) {
            console.error("Error archiving card:", error);
            toast.error("Failed to archive card");
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDuplicate = async () => {
        if (!card) return;
        setIsCopying(true);
        try {
            await duplicateCard({ cardId: card._id });
            setShowCopyDialog(false);
            toast.success("Card duplicated");
        } catch (error) {
            console.error("Error copying card:", error);
            toast.error("Failed to copy card");
        } finally {
            setIsCopying(false);
        }
    };

    const handleDelete = async () => {
        if (!card || isDeleting) return;
        setIsDeleting(true);
        try {
            await deleteCard({ cardId: card._id });
            setShowDeleteDialog(false);
            onClose();
            toast.success("Card deleted");
        } catch (error) {
            console.error("Error deleting card:", error);
            toast.error("Failed to delete card");
        } finally {
            setIsDeleting(false);
        }
    };

    const dueDate = card?.dueDate ? new Date(card.dueDate) : undefined;
    const isOverdue = dueDate && dueDate < new Date() && !card?.completed;
    const priorityConfig = card?.priority
        ? PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG]
        : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent
                    showCloseButton={false}
                    className="flex max-h-[86vh] w-[94vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl flex-col p-0 overflow-hidden rounded-2xl border border-border/70 shadow-2xl"
                >
                    {/* Fallback close button when loading or card not found */}
                    {(isLoading || notFound) && (
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute top-3.5 right-3.5 z-20 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {isLoading && <CardModalSkeleton />}

                    {notFound && (
                        <div className="py-16 text-center text-muted-foreground">
                            <p className="text-sm">Card not found or you do not have access.</p>
                        </div>
                    )}

                    {card && (
                        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                            {/* Edge-to-edge Cover Banner */}
                            {card.coverImage && (
                                <div className="relative shrink-0">
                                    <CardCoverImage
                                        cardId={card._id}
                                        coverImage={card.coverImage}
                                        variant="banner"
                                    />
                                    {/* Close button over banner */}
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="absolute top-3.5 right-3.5 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-md transition-all hover:bg-black/75 hover:text-white active:scale-95 cursor-pointer shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                        aria-label="Close modal"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            <div className="p-5 md:p-7 space-y-6 flex-1">
                                {/* Header: Title + Status Pill & Close */}
                                <DialogHeader className="space-y-2 text-left">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {isEditingTitle && !isReadOnly ? (
                                                <Input
                                                    autoFocus
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    onBlur={handleSaveTitle}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSaveTitle();
                                                        if (e.key === "Escape") {
                                                            setTitle(card.title);
                                                            setIsEditingTitle(false);
                                                        }
                                                    }}
                                                    className="h-9 text-lg md:text-xl font-semibold bg-background"
                                                    maxLength={200}
                                                />
                                            ) : (
                                                <DialogTitle
                                                    onClick={() => {
                                                        if (!isReadOnly) setIsEditingTitle(true);
                                                    }}
                                                    className={cn(
                                                        "text-lg md:text-xl font-semibold leading-snug text-foreground rounded-md transition-colors cursor-pointer",
                                                        !isReadOnly &&
                                                            "hover:bg-muted/50 px-1 -mx-1 py-0.5",
                                                    )}
                                                >
                                                    {card.title}
                                                </DialogTitle>
                                            )}
                                        </div>

                                        {/* Top-Right Action Controls: Status Pill + Close Button (when no cover image) */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleToggleComplete}
                                                disabled={isReadOnly || isTogglingComplete}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 cursor-pointer active:scale-[0.97] disabled:opacity-70",
                                                    card.completed
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                                                        : "bg-muted text-muted-foreground border-border/70 hover:bg-muted/80 hover:text-foreground",
                                                )}
                                            >
                                                {isTogglingComplete ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                ) : card.completed ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <Circle className="h-3.5 w-3.5" />
                                                )}
                                                <span>
                                                    {card.completed ? "Completed" : "Mark done"}
                                                </span>
                                            </button>

                                            {!card.coverImage && (
                                                <button
                                                    type="button"
                                                    onClick={handleClose}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    aria-label="Close modal"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </DialogHeader>

                                {/* Main Two-Column Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] lg:grid-cols-[1fr_310px] gap-6 items-start">
                                    {/* Left Column: Description, Checklists, Activity */}
                                    <div className="space-y-6 min-w-0">
                                        {/* Description Section with MD Editor and Streamdown Markdown View */}
                                        <CardDescription
                                            cardDescription={card.description || ""}
                                            description={description}
                                            setDescription={setDescription}
                                            isEditing={isEditingDescription}
                                            setIsEditing={setIsEditingDescription}
                                            onSave={handleSaveDescription}
                                            isReadOnly={isReadOnly}
                                        />

                                        {/* Checklists Section */}
                                        <section className="space-y-3">
                                            <CardChecklists
                                                cardId={card._id}
                                                isReadOnly={isReadOnly}
                                            />
                                        </section>

                                        {/* Comments Section */}
                                        <section className="space-y-3 pt-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>Activity & Comments</span>
                                            </div>
                                            <CardComments
                                                cardId={card._id}
                                                isReadOnly={isReadOnly}
                                            />
                                        </section>
                                    </div>

                                    {/* Right Column: Inspector Sidebar */}
                                    <aside className="space-y-4 w-full min-w-0">
                                        {/* Properties Card */}
                                        <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 space-y-3.5 shadow-2xs">
                                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Properties
                                            </h3>

                                            {/* Priority */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
                                                    Priority
                                                    {isUpdatingPriority && (
                                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                    )}
                                                </span>
                                                <Select
                                                    disabled={isReadOnly || isUpdatingPriority}
                                                    value={card.priority || "none"}
                                                    onValueChange={(val) => {
                                                        if (
                                                            val === "low" ||
                                                            val === "medium" ||
                                                            val === "high" ||
                                                            val === "urgent"
                                                        ) {
                                                            handlePriorityChange(val);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-7 text-xs w-32 bg-background/80">
                                                        <SelectValue placeholder="Set priority" />
                                                    </SelectTrigger>
                                                    <SelectContent className="text-xs">
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="medium">
                                                            Medium
                                                        </SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="urgent">
                                                            Urgent
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Due Date */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
                                                    Due date
                                                    {isUpdatingDueDate && (
                                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                    )}
                                                </span>
                                                <div className="w-36 max-w-[145px]">
                                                    <DatePicker
                                                        disabled={isReadOnly || isUpdatingDueDate}
                                                        date={dueDate}
                                                        onDateChange={handleDueDateChange}
                                                        placeholder="No date"
                                                        className="h-7 text-xs px-2 bg-background/80"
                                                    />
                                                </div>
                                            </div>

                                            {/* Assignees / Members */}
                                            <div className="space-y-1.5 pt-1 border-t border-border/50">
                                                <span className="text-[11px] text-muted-foreground">
                                                    Assignees
                                                </span>
                                                <CardMembers
                                                    cardId={card._id}
                                                    boardId={card.boardId}
                                                />
                                            </div>

                                            {/* Labels */}
                                            <div className="space-y-1.5 pt-1 border-t border-border/50">
                                                <span className="text-[11px] text-muted-foreground">
                                                    Labels
                                                </span>
                                                <CardLabels
                                                    cardId={card._id}
                                                    boardId={card.boardId}
                                                />
                                            </div>
                                        </div>

                                        {/* Custom Fields Card (Self-contained, renders null if none) */}
                                        <CardCustomFields
                                            cardId={card._id}
                                            isEditable={!isReadOnly}
                                        />

                                        {/* Attachments Card */}
                                        <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 space-y-2.5 shadow-2xs">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Paperclip className="h-3 w-3" />
                                                <span>Attachments</span>
                                            </div>
                                            <CardAttachments
                                                cardId={card._id}
                                                isReadOnly={isReadOnly}
                                            />
                                        </div>

                                        {/* Actions Card */}
                                        <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 space-y-2 shadow-2xs">
                                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                                Actions
                                            </h3>
                                            <div className="flex flex-col gap-1.5">
                                                {!isReadOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setShowCopyDialog(true)}
                                                        className="w-full justify-start text-xs h-7 gap-2 bg-background/60"
                                                    >
                                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>Duplicate Card</span>
                                                    </Button>
                                                )}

                                                {!isReadOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setShowArchiveDialog(true)}
                                                        className="w-full justify-start text-xs h-7 gap-2 bg-background/60 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Archive className="h-3.5 w-3.5" />
                                                        <span>Archive Card</span>
                                                    </Button>
                                                )}

                                                {!isReadOnly && (
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() => setShowDeleteDialog(true)}
                                                        className="w-full justify-start text-xs h-7 gap-2 bg-background/60 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>Delete Card</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </aside>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Delete Card"
                description="Are you sure you want to permanently delete this card? This action cannot be undone."
                isLoading={isDeleting}
            />

            <ConfirmationDialog
                open={showArchiveDialog}
                onOpenChange={setShowArchiveDialog}
                onConfirm={handleArchive}
                title="Archive Card"
                description="This card will be archived and hidden from the board. You can restore it anytime from board settings."
                confirmText="Archive"
                isLoading={isArchiving}
            />

            <ConfirmationDialog
                open={showCopyDialog}
                onOpenChange={setShowCopyDialog}
                onConfirm={handleDuplicate}
                title="Duplicate Card"
                description="A duplicate of this card with its checklists and labels will be created."
                confirmText="Duplicate"
                isLoading={isCopying}
            />

            <UnsavedChangesDialog
                open={showUnsavedDialog}
                onOpenChange={setShowUnsavedDialog}
                onDiscard={() => {
                    setShowUnsavedDialog(false);
                    onClose();
                }}
                onSave={async () => {
                    if (isEditingTitle) await handleSaveTitle();
                    if (isEditingDescription) await handleSaveDescription();
                    setShowUnsavedDialog(false);
                    onClose();
                }}
            />
        </>
    );
}

function CardModalSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-muted/60 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] lg:grid-cols-[1fr_310px] gap-6">
                <div className="space-y-4">
                    <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                    <div className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                </div>
                <div className="space-y-3">
                    <div className="h-44 rounded-xl bg-muted/50 animate-pulse" />
                    <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
                </div>
            </div>
        </div>
    );
}

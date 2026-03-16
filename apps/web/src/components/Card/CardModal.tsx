import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    AlertCircle,
    AlignLeft,
    Archive,
    Calendar as CalendarIcon,
    CheckSquare,
    Copy,
    Loader2,
    MessageSquare,
    Paperclip,
    PencilLine,
    Save,
    Tag,
    Trash2,
    Users,
    Wrench,
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CardLabels } from "./CardLabels";
import { CardMembers } from "./CardMembers";
import { CardChecklists } from "./CardChecklists";
import { CardComments } from "./CardComments";
import { CardAttachments } from "./CardAttachments";
import { CardCoverImage } from "./CardCoverImage";
import { CardCustomFields } from "./CardCustomFields";
import { TextWithLinkPreviews } from "@/components/ui/text-with-link-previews";
import { Skeleton } from "@/components/ui/skeleton";

interface CardModalProps {
    cardId: Id<"cards"> | null;
    isOpen: boolean;
    onClose: () => void;
    isReadOnly?: boolean;
}

interface PendingChanges {
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    dueDate?: number;
}

function CardModalSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
                <div className="space-y-5">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function CardModal({ cardId, isOpen, onClose, isReadOnly = false }: CardModalProps) {
    const card = useQuery(api.cards.getById, cardId ? { cardId } : "skip");
    const updateCard = useMutation(api.cards.update);
    const archiveCard = useMutation(api.cards.archive);
    const duplicateCard = useMutation(api.cards.duplicate);
    const deleteCard = useMutation(api.cards.deleteCard);

    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingClose, setPendingClose] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

    const isLoading = cardId != null && card === undefined;
    const notFound = cardId != null && card === null;

    useEffect(() => {
        if (card) {
            setPendingChanges({});
            setIsEditMode(false);
        }
    }, [card?._id]);

    useEffect(() => {
        if (isReadOnly) {
            setPendingChanges({});
            setIsEditMode(false);
        }
    }, [isReadOnly]);

    const hasUnsavedChanges = useMemo(() => {
        if (!card) return false;

        return (
            (pendingChanges.title !== undefined && pendingChanges.title !== card.title) ||
            (pendingChanges.description !== undefined &&
                pendingChanges.description !== (card.description || "")) ||
            (pendingChanges.priority !== undefined && pendingChanges.priority !== card.priority) ||
            (pendingChanges.dueDate !== undefined && pendingChanges.dueDate !== card.dueDate)
        );
    }, [card, pendingChanges]);

    const currentTitle =
        pendingChanges.title !== undefined ? pendingChanges.title : card?.title || "";
    const currentDescription =
        pendingChanges.description !== undefined
            ? pendingChanges.description
            : card?.description || "";
    const currentPriority =
        pendingChanges.priority !== undefined ? pendingChanges.priority : card?.priority;
    const currentDueDate =
        pendingChanges.dueDate !== undefined ? pendingChanges.dueDate : card?.dueDate;

    const handleDueDateChange = (date: Date | undefined) => {
        setPendingChanges((prev) => ({ ...prev, dueDate: date ? date.getTime() : undefined }));
    };

    const handleSaveChanges = async () => {
        if (!card || !hasUnsavedChanges) return;
        setIsSaving(true);

        const updates: {
            cardId: Id<"cards">;
            title?: string;
            description?: string;
            priority?: "low" | "medium" | "high" | "urgent";
            dueDate?: number;
        } = { cardId: card._id };

        if (pendingChanges.title !== undefined && pendingChanges.title !== card.title) {
            updates.title = pendingChanges.title.trim();
        }
        if (
            pendingChanges.description !== undefined &&
            pendingChanges.description !== (card.description || "")
        ) {
            updates.description = pendingChanges.description;
        }
        if (pendingChanges.priority !== undefined && pendingChanges.priority !== card.priority) {
            updates.priority = pendingChanges.priority;
        }
        if (pendingChanges.dueDate !== undefined && pendingChanges.dueDate !== card.dueDate) {
            updates.dueDate = pendingChanges.dueDate;
        }

        await updateCard(updates);
        setPendingChanges({});
        setIsSaving(false);

        if (pendingClose) {
            setPendingClose(false);
            onClose();
        }
    };

    const handleDiscardChanges = () => {
        setPendingChanges({});
        setIsEditMode(false);

        if (pendingClose) {
            setPendingClose(false);
            onClose();
        }
    };

    const handleCloseAttempt = () => {
        if (hasUnsavedChanges) {
            setPendingClose(true);
            setShowUnsavedDialog(true);
            return;
        }
        setIsEditMode(false);
        onClose();
    };

    const handleArchive = async () => {
        if (!card) return;
        setIsArchiving(true);
        try {
            await archiveCard({ cardId: card._id });
            setShowArchiveDialog(false);
            onClose();
        } catch (error) {
            console.error("Error archiving card:", error);
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
        } catch (error) {
            console.error("Error copying card:", error);
        } finally {
            setIsCopying(false);
        }
    };

    const handleDelete = async () => {
        if (!card) return;
        await deleteCard({ cardId: card._id });
        onClose();
    };

    const dueDate = currentDueDate ? new Date(currentDueDate) : undefined;
    const isOverdue = dueDate && dueDate < new Date() && !card?.completed;
    const priorityConfig = currentPriority
        ? PRIORITY_CONFIG[currentPriority as keyof typeof PRIORITY_CONFIG]
        : null;

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        handleCloseAttempt();
                    }
                }}
            >
                <DialogContent className="flex h-[90vh] md:min-w-4xl w-[95vw] max-w-4xl flex-col">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        {isLoading && <CardModalSkeleton />}

                        {notFound && (
                            <div className="py-12 text-center text-muted-foreground">
                                <p>Card not found or you do not have access.</p>
                            </div>
                        )}

                        {card && (
                            <>
                                {card.coverImage && (
                                    <div className="-mx-4 -mt-4 mb-4 overflow-hidden rounded-t-lg md:-mx-6 md:-mt-6">
                                        <img
                                            src={card.coverImage}
                                            alt="Cover"
                                            className="block h-48 w-full object-cover"
                                        />
                                    </div>
                                )}

                                <DialogHeader className="mb-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            {isEditMode ? (
                                                <Input
                                                    value={currentTitle}
                                                    onChange={(e) =>
                                                        setPendingChanges((prev) => ({
                                                            ...prev,
                                                            title: e.target.value,
                                                        }))
                                                    }
                                                    className="mb-2 h-10 text-xl font-semibold"
                                                    maxLength={200}
                                                />
                                            ) : (
                                                <DialogTitle className="wrap-break-word text-2xl leading-tight">
                                                    {currentTitle}
                                                </DialogTitle>
                                            )}

                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                {priorityConfig && (
                                                    <Badge
                                                        className={cn(
                                                            priorityConfig.color,
                                                            "text-white",
                                                        )}
                                                    >
                                                        {priorityConfig.label}
                                                    </Badge>
                                                )}
                                                {dueDate && (
                                                    <Badge
                                                        variant={
                                                            isOverdue ? "destructive" : "secondary"
                                                        }
                                                        className="gap-1"
                                                    >
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {dueDate.toLocaleDateString()}
                                                        {isOverdue && " (Overdue)"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            variant={isEditMode ? "secondary" : "default"}
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => {
                                                if (!isReadOnly) setIsEditMode((prev) => !prev);
                                            }}
                                            disabled={isReadOnly}
                                        >
                                            <PencilLine className="h-4 w-4" />
                                            {isEditMode ? "Done" : "Edit"}
                                        </Button>
                                    </div>
                                </DialogHeader>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
                                    <div className="space-y-6">
                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                                Description
                                            </div>
                                            {isEditMode ? (
                                                <Textarea
                                                    value={currentDescription}
                                                    onChange={(e) =>
                                                        setPendingChanges((prev) => ({
                                                            ...prev,
                                                            description: e.target.value,
                                                        }))
                                                    }
                                                    className="min-h-[120px]"
                                                    placeholder="Add a detailed description..."
                                                />
                                            ) : currentDescription ? (
                                                <div className="text-sm text-muted-foreground whitespace-pre-wrap [word-break:break-word]  ">
                                                    <TextWithLinkPreviews
                                                        text={currentDescription}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No description yet.
                                                </p>
                                            )}
                                        </section>

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                Labels
                                            </div>
                                            {isEditMode ? (
                                                <CardLabels
                                                    cardId={card._id}
                                                    boardId={card.boardId}
                                                />
                                            ) : card.labels && card.labels.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {card.labels.map((label) => (
                                                        <Badge
                                                            key={label._id}
                                                            style={{
                                                                backgroundColor: label.color,
                                                            }}
                                                            className="text-white"
                                                        >
                                                            {label.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No labels.
                                                </p>
                                            )}
                                        </section>

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                                Custom Fields
                                            </div>
                                            <CardCustomFields
                                                cardId={card._id}
                                                isEditable={isEditMode}
                                            />
                                        </section>

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                                Checklists
                                            </div>
                                            <CardChecklists
                                                cardId={card._id}
                                                isReadOnly={isReadOnly}
                                            />
                                        </section>

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                Comments
                                            </div>
                                            <CardComments
                                                cardId={card._id}
                                                isReadOnly={isReadOnly}
                                            />
                                        </section>

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                Attachments
                                            </div>
                                            <CardAttachments
                                                cardId={card._id}
                                                isReadOnly={isReadOnly}
                                            />
                                        </section>
                                    </div>

                                    <aside className="space-y-4">
                                        {isEditMode && (
                                            <section className="space-y-3 rounded-lg border bg-card p-4">
                                                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                                                    Edit Details
                                                </h3>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">
                                                        Members
                                                    </label>
                                                    <CardMembers
                                                        cardId={card._id}
                                                        boardId={card.boardId}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">
                                                        Due date
                                                    </label>
                                                    <DatePicker
                                                        date={dueDate}
                                                        onDateChange={handleDueDateChange}
                                                        placeholder="Set due date"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">
                                                        Priority
                                                    </label>
                                                    <Select
                                                        value={currentPriority || ""}
                                                        onValueChange={(value) => {
                                                            if (
                                                                value === "low" ||
                                                                value === "medium" ||
                                                                value === "high" ||
                                                                value === "urgent"
                                                            ) {
                                                                setPendingChanges((prev) => ({
                                                                    ...prev,
                                                                    priority: value,
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9 w-full">
                                                            <SelectValue placeholder="Set priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="medium">
                                                                Medium
                                                            </SelectItem>
                                                            <SelectItem value="high">
                                                                High
                                                            </SelectItem>
                                                            <SelectItem value="urgent">
                                                                Urgent
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">
                                                        Cover
                                                    </label>
                                                    <CardCoverImage
                                                        cardId={card._id}
                                                        coverImage={card.coverImage}
                                                    />
                                                </div>
                                            </section>
                                        )}

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                                                Actions
                                            </h3>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-9 w-full justify-start gap-2"
                                                onClick={() => setShowCopyDialog(true)}
                                                disabled={isCopying || isReadOnly}
                                            >
                                                {isCopying ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                                Copy
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-9 w-full justify-start gap-2"
                                                onClick={() => setShowArchiveDialog(true)}
                                                disabled={isArchiving || isReadOnly}
                                            >
                                                {isArchiving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Archive className="h-4 w-4" />
                                                )}
                                                Archive
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-9 w-full justify-start gap-2"
                                                onClick={() => setShowDeleteDialog(true)}
                                                disabled={isReadOnly}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </section>

                                        <section className="space-y-2 rounded-lg border bg-card p-4">
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                Status
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {card.completed ? "Completed" : "In progress"}
                                            </p>
                                        </section>

                                        {isEditMode && (
                                            <section className="space-y-2 rounded-lg border bg-card p-4">
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    Editing Mode
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    You are editing details. Save or discard changes
                                                    at the bottom.
                                                </p>
                                            </section>
                                        )}
                                    </aside>
                                </div>
                            </>
                        )}
                    </div>

                    {hasUnsavedChanges && card && (
                        <div className="flex justify-end gap-2 border-t bg-background p-4">
                            <Button variant="ghost" size="sm" onClick={handleDiscardChanges}>
                                Discard
                            </Button>
                            <Button size="sm" onClick={handleSaveChanges} className="gap-2">
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Delete Card"
                description="Are you sure you want to delete this card? This action cannot be undone."
            />

            <UnsavedChangesDialog
                open={showUnsavedDialog}
                onOpenChange={setShowUnsavedDialog}
                onSave={handleSaveChanges}
                onDiscard={handleDiscardChanges}
            />

            <ConfirmationDialog
                open={showArchiveDialog}
                onOpenChange={setShowArchiveDialog}
                onConfirm={handleArchive}
                title="Archive Card"
                description="Are you sure you want to archive this card? You can restore it later from archived items."
                confirmText="Archive"
                isLoading={isArchiving}
            />

            <ConfirmationDialog
                open={showCopyDialog}
                onOpenChange={setShowCopyDialog}
                onConfirm={handleDuplicate}
                title="Copy Card"
                description="This will create a duplicate of this card in the same list."
                confirmText="Copy"
                isLoading={isCopying}
            />
        </>
    );
}

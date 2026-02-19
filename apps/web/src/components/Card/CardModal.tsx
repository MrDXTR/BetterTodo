import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import {
    X,
    CreditCard,
    AlignLeft,
    CheckSquare,
    MessageSquare,
    Tag,
    Users,
    Calendar as CalendarIcon,
    Clock,
    Archive,
    Copy,
    Trash2,
    Image as ImageIcon,
    AlertCircle,
    Save,
    Loader2,
    Paperclip,
} from "lucide-react";
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
import { TextWithLinkPreviews } from "@/components/ui/text-with-link-previews";
import { Skeleton } from "@/components/ui/skeleton";

interface CardModalProps {
    cardId: Id<"cards"> | null;
    isOpen: boolean;
    onClose: () => void;
}

interface PendingChanges {
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    dueDate?: number;
}

export function CardModal({ cardId, isOpen, onClose }: CardModalProps) {
    const card = useQuery(
        api.cards.getById,
        cardId ? { cardId } : "skip"
    );
    const updateCard = useMutation(api.cards.update);
    const archiveCard = useMutation(api.cards.archive);
    const duplicateCard = useMutation(api.cards.duplicate);
    const deleteCard = useMutation(api.cards.deleteCard);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [pendingClose, setPendingClose] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // Pending changes state
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

    const isLoading = cardId != null && card === undefined;
    const notFound = cardId != null && card === null;

    // Reset pending changes when card changes
    useEffect(() => {
        if (card) {
            setPendingChanges({});
            setIsEditingTitle(false);
            setIsEditingDescription(false);
        }
    }, [card?._id]);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        if (!card) return false;

        return (
            (pendingChanges.title !== undefined && pendingChanges.title !== card.title) ||
            (pendingChanges.description !== undefined && pendingChanges.description !== (card.description || "")) ||
            (pendingChanges.priority !== undefined && pendingChanges.priority !== card.priority) ||
            (pendingChanges.dueDate !== undefined && pendingChanges.dueDate !== card.dueDate)
        );
    }, [card, pendingChanges]);

    // Get current values (pending or saved)
    const currentTitle = pendingChanges.title !== undefined ? pendingChanges.title : (card?.title || "");
    const currentDescription = pendingChanges.description !== undefined ? pendingChanges.description : (card?.description || "");
    const currentPriority = pendingChanges.priority !== undefined ? pendingChanges.priority : card?.priority;
    const currentDueDate = pendingChanges.dueDate !== undefined ? pendingChanges.dueDate : card?.dueDate;

    const handleTitleEdit = () => {
        if (!card) return;
        setPendingChanges(prev => ({ ...prev, title: currentTitle }));
        setIsEditingTitle(true);
    };

    const handleTitleChange = (value: string) => {
        setPendingChanges(prev => ({ ...prev, title: value }));
    };

    const handleDescriptionEdit = () => {
        if (!card) return;
        setPendingChanges(prev => ({ ...prev, description: currentDescription }));
        setIsEditingDescription(true);
    };

    const handleDescriptionChange = (value: string) => {
        setPendingChanges(prev => ({ ...prev, description: value }));
    };

    const handlePriorityChange = (priority: "low" | "medium" | "high" | "urgent") => {
        setPendingChanges(prev => ({ ...prev, priority }));
    };

    const handleDueDateChange = (date: Date | undefined) => {
        setPendingChanges(prev => ({ ...prev, dueDate: date ? date.getTime() : undefined }));
    };

    const handleSaveChanges = async () => {
        if (!card || !hasUnsavedChanges) return;

        const updates: any = { cardId: card._id };

        if (pendingChanges.title !== undefined && pendingChanges.title !== card.title) {
            updates.title = pendingChanges.title.trim();
        }
        if (pendingChanges.description !== undefined && pendingChanges.description !== card.description) {
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
        setIsEditingTitle(false);
        setIsEditingDescription(false);

        // If we were trying to close, close now
        if (pendingClose) {
            setPendingClose(false);
            onClose();
        }
    };

    const handleDiscardChanges = () => {
        setPendingChanges({});
        setIsEditingTitle(false);
        setIsEditingDescription(false);

        // If we were trying to close, close now
        if (pendingClose) {
            setPendingClose(false);
            onClose();
        }
    };

    const handleCloseAttempt = () => {
        if (hasUnsavedChanges) {
            setPendingClose(true);
            setShowUnsavedDialog(true);
        } else {
            onClose();
        }
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
    const priorityConfig = currentPriority ? PRIORITY_CONFIG[currentPriority as keyof typeof PRIORITY_CONFIG] : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
                <DialogContent className="max-w-3xl w-[95vw] md:min-w-[50vw] h-[90vh] flex flex-col p-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        {isLoading && (
                            <>
                                <DialogHeader className="mb-6">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="w-6 h-6 mt-1 rounded" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-7 w-3/4" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-6">
                                    <div className="space-y-6">
                                        <div className="flex gap-3">
                                            <Skeleton className="w-5 h-5 mt-1 rounded" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-8 w-full" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Skeleton className="w-5 h-5 mt-1 rounded" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-20 w-full rounded" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Skeleton className="w-5 h-5 mt-1 rounded" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-16 w-full" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-24" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                            <Skeleton className="h-8 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {notFound && (
                            <div className="py-8 text-center text-muted-foreground">
                                <p>Card not found or you don&apos;t have access to it.</p>
                            </div>
                        )}
                        {card && (
                            <>
                                {/* Cover Image Banner */}
                                {card.coverImage && (
                                    <div className="relative -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-4 group/cover">
                                        <img
                                            src={card.coverImage}
                                            alt="Cover"
                                            className="h-40 w-full object-cover rounded-t-lg"
                                        />
                                    </div>
                                )}

                                {/* Header */}
                                <DialogHeader className="mb-6">
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-6 h-6 mt-1 text-muted-foreground" />
                                        <div className="flex-1">
                                            {isEditingTitle ? (
                                                <Input
                                                    value={currentTitle}
                                                    onChange={(e) => handleTitleChange(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") setIsEditingTitle(false);
                                                        if (e.key === "Escape") {
                                                            setPendingChanges(prev => {
                                                                const { title, ...rest } = prev;
                                                                return rest;
                                                            });
                                                            setIsEditingTitle(false);
                                                        }
                                                    }}
                                                    className="text-xl font-semibold mb-2"
                                                    autoFocus
                                                />
                                            ) : (
                                                <h2
                                                    className="text-xl font-semibold mb-2 cursor-pointer hover:bg-muted px-2 py-1 rounded break-words"
                                                    onClick={handleTitleEdit}
                                                >
                                                    {currentTitle}
                                                </h2>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                in list <span className="underline">List Name</span>
                                            </p>
                                        </div>

                                    </div>
                                </DialogHeader>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-6">
                                    {/* Main Content */}
                                    <div className="space-y-6">
                                        {/* Labels */}
                                        <div className="flex items-start gap-3">
                                            <Tag className="w-5 h-5 mt-1 text-muted-foreground" />
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold mb-2">Labels</h3>
                                                <CardLabels cardId={card._id} boardId={card.boardId} />
                                            </div>
                                        </div>
                                        {/* Priority & Due Date */}
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 mt-1 text-muted-foreground" />
                                            <div className="flex-1 space-y-3">
                                                {priorityConfig && (
                                                    <div>
                                                        <h3 className="text-sm font-semibold mb-2">Priority</h3>
                                                        <Badge
                                                            className={cn(
                                                                priorityConfig.color,
                                                                "text-white"
                                                            )}
                                                        >
                                                            {priorityConfig.label}
                                                        </Badge>
                                                    </div>
                                                )}
                                                {dueDate && (
                                                    <div>
                                                        <h3 className="text-sm font-semibold mb-2">Due Date</h3>
                                                        <Badge
                                                            variant={isOverdue ? "destructive" : "secondary"}
                                                            className="gap-2"
                                                        >
                                                            <CalendarIcon className="w-3 h-3" />
                                                            {dueDate.toLocaleDateString()}
                                                            {isOverdue && " (Overdue)"}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="flex items-start gap-3">
                                            <AlignLeft className="w-5 h-5 mt-1 text-muted-foreground" />
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold mb-2">Description</h3>
                                                {isEditingDescription ? (
                                                    <div className="space-y-2">
                                                        <Textarea
                                                            value={currentDescription}
                                                            onChange={(e) => handleDescriptionChange(e.target.value)}
                                                            placeholder="Add a more detailed description..."
                                                            className="min-h-[100px]"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button size="sm" onClick={() => setIsEditingDescription(false)}>
                                                                Done
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setPendingChanges(prev => {
                                                                        const { description, ...rest } = prev;
                                                                        return rest;
                                                                    });
                                                                    setIsEditingDescription(false);
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="text-sm text-muted-foreground cursor-pointer [word-break:break-word] hover:bg-muted p-3 rounded min-h-[60px] break-words whitespace-pre-wrap"
                                                        onClick={handleDescriptionEdit}
                                                    >
                                                        {currentDescription ? (
                                                            <TextWithLinkPreviews text={currentDescription} />
                                                        ) : (
                                                            "Add a more detailed description..."
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Checklists */}
                                        <div className="flex items-start gap-3">
                                            <CheckSquare className="w-5 h-5 mt-1 text-muted-foreground" />
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold mb-2">Checklists</h3>
                                                <CardChecklists cardId={card._id} />
                                            </div>
                                        </div>

                                        {/* Comments */}
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="w-5 h-5 mt-1 text-muted-foreground" />
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold mb-2">Comments</h3>
                                                <CardComments cardId={card._id} />
                                            </div>
                                        </div>

                                        {/* Attachments */}
                                        <div className="flex items-start gap-3">
                                            <Paperclip className="w-5 h-5 mt-1 text-muted-foreground" />
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold mb-2">Attachments</h3>
                                                <CardAttachments cardId={card._id} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                                                ADD TO CARD
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">Members</label>
                                                    <CardMembers cardId={card._id} boardId={card.boardId} />
                                                </div>
                                                <Button variant="secondary" size="sm" className="w-full justify-start h-8">
                                                    <Tag className="w-4 h-4 mr-2" />
                                                    Labels
                                                </Button>
                                                <Button variant="secondary" size="sm" className="w-full justify-start h-8">
                                                    <CheckSquare className="w-4 h-4 mr-2" />
                                                    Checklist
                                                </Button>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">Due Date</label>
                                                    <DatePicker
                                                        date={dueDate}
                                                        onDateChange={handleDueDateChange}
                                                        placeholder="Set due date"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-muted-foreground">Priority</label>
                                                    <Select
                                                        value={currentPriority || ""}
                                                        onValueChange={(value) => {
                                                            if (value && (value === "low" || value === "medium" || value === "high" || value === "urgent")) {
                                                                handlePriorityChange(value);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full h-8">
                                                            <SelectValue placeholder="Set priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                            <SelectItem value="urgent">Urgent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <CardCoverImage cardId={card._id} coverImage={card.coverImage} />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                                                ACTIONS
                                            </h3>
                                            <div className="space-y-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full justify-start h-8 gap-2"
                                                    onClick={() => setShowCopyDialog(true)}
                                                    disabled={isCopying}
                                                >
                                                    {isCopying ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                    Copy
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full justify-start h-8 gap-2"
                                                    onClick={() => setShowArchiveDialog(true)}
                                                    disabled={isArchiving}
                                                >
                                                    {isArchiving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Archive className="w-4 h-4" />
                                                    )}
                                                    Archive
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="w-full justify-start h-8"
                                                    onClick={() => setShowDeleteDialog(true)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Time Tracking */}
                                        {(card.estimatedHours || card.actualHours) && (
                                            <div>
                                                <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                                                    TIME TRACKING
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    {card.estimatedHours && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Estimated:</span>
                                                            <span className="font-medium">{card.estimatedHours}h</span>
                                                        </div>
                                                    )}
                                                    {card.actualHours && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Actual:</span>
                                                            <span className="font-medium">{card.actualHours}h</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Save/Discard buttons - sticky at bottom */}
                    {hasUnsavedChanges && card && (
                        <div className="border-t bg-background p-4 flex gap-2 justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDiscardChanges}
                            >
                                Discard
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveChanges}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
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

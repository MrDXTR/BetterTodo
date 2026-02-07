import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import type { Id } from "@my-better-t-app/backend/convex/_generated/dataModel";
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
} from "lucide-react";
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

interface CardModalProps {
    cardId: Id<"cards"> | null;
    isOpen: boolean;
    onClose: () => void;
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
    const [title, setTitle] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState("");

    if (!card) return null;

    const handleTitleEdit = () => {
        setTitle(card.title);
        setIsEditingTitle(true);
    };

    const handleTitleSave = async () => {
        if (title.trim() && title !== card.title) {
            await updateCard({ cardId: card._id, title: title.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleDescriptionEdit = () => {
        setDescription(card.description || "");
        setIsEditingDescription(true);
    };

    const handleDescriptionSave = async () => {
        if (description !== card.description) {
            await updateCard({ cardId: card._id, description });
        }
        setIsEditingDescription(false);
    };

    const handlePriorityChange = async (priority: "low" | "medium" | "high" | "urgent") => {
        await updateCard({ cardId: card._id, priority });
    };

    const handleDueDateChange = async (date: Date | undefined) => {
        await updateCard({ cardId: card._id, dueDate: date ? date.getTime() : undefined });
    };

    const handleArchive = async () => {
        await archiveCard({ cardId: card._id });
        onClose();
    };

    const handleDuplicate = async () => {
        await duplicateCard({ cardId: card._id });
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this card?")) {
            await deleteCard({ cardId: card._id });
            onClose();
        }
    };

    const dueDate = card.dueDate ? new Date(card.dueDate) : undefined;
    const isOverdue = dueDate && dueDate < new Date() && !card.completed;
    const priorityConfig = card.priority ? PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                {/* Cover Image */}
                {card.coverImage && (
                    <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                        <img
                            src={card.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="p-6">
                    {/* Header */}
                    <DialogHeader className="mb-6">
                        <div className="flex items-start gap-3">
                            <CreditCard className="w-6 h-6 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                                {isEditingTitle ? (
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleTitleSave}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleTitleSave();
                                            if (e.key === "Escape") setIsEditingTitle(false);
                                        }}
                                        className="text-xl font-semibold mb-2"
                                        autoFocus
                                    />
                                ) : (
                                    <h2
                                        className="text-xl font-semibold mb-2 cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                        onClick={handleTitleEdit}
                                    >
                                        {card.title}
                                    </h2>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    in list <span className="underline">List Name</span>
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </Button>
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
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Add a more detailed description..."
                                                className="min-h-[100px]"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={handleDescriptionSave}>
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsEditingDescription(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm text-muted-foreground cursor-pointer hover:bg-muted p-3 rounded min-h-[60px]"
                                            onClick={handleDescriptionEdit}
                                        >
                                            {card.description || "Add a more detailed description..."}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Checklists */}
                            <div className="flex items-start gap-3">
                                <CheckSquare className="w-5 h-5 mt-1 text-muted-foreground" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold mb-2">Checklists</h3>
                                    <p className="text-sm text-muted-foreground">
                                        No checklists yet. Add one from the sidebar.
                                    </p>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="flex items-start gap-3">
                                <MessageSquare className="w-5 h-5 mt-1 text-muted-foreground" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold mb-2">Activity</h3>
                                    <p className="text-sm text-muted-foreground">
                                        No comments yet. Be the first to comment!
                                    </p>
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
                                    <Button variant="secondary" size="sm" className="w-full justify-start">
                                        <Users className="w-4 h-4 mr-2" />
                                        Members
                                    </Button>
                                    <Button variant="secondary" size="sm" className="w-full justify-start">
                                        <Tag className="w-4 h-4 mr-2" />
                                        Labels
                                    </Button>
                                    <Button variant="secondary" size="sm" className="w-full justify-start">
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
                                            value={card.priority || ""}
                                            onValueChange={(value) => {
                                                if (value && (value === "low" || value === "medium" || value === "high" || value === "urgent")) {
                                                    handlePriorityChange(value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
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
                                    <Button variant="secondary" size="sm" className="w-full justify-start">
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Cover
                                    </Button>
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
                                        className="w-full justify-start"
                                        onClick={handleDuplicate}
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={handleArchive}
                                    >
                                        <Archive className="w-4 h-4 mr-2" />
                                        Archive
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={handleDelete}
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
                </div>
            </DialogContent>
        </Dialog>
    );
}

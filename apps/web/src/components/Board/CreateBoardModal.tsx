import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LayoutTemplate, Check, ArrowLeft, Loader2 } from "lucide-react";

import { BOARD_COLORS, DEFAULT_BOARD_COLOR } from "@/lib/constants";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CreateBoardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (boardId: Id<"boards">) => void;
    defaultWorkspaceId?: Id<"workspaces">;
}

// ----- Board Templates -----
interface BoardTemplate {
    id: string;
    name: string;
    description: string;
    emoji: string;
    color: string;
    lists: string[];
}

const BOARD_TEMPLATES: BoardTemplate[] = [
    {
        id: "blank",
        name: "Blank Board",
        description: "Start from scratch",
        emoji: "📋",
        color: "#0079BF",
        lists: [],
    },
    {
        id: "kanban",
        name: "Kanban",
        description: "To Do → In Progress → Done",
        emoji: "🔄",
        color: "#6366f1",
        lists: ["To Do", "In Progress", "In Review", "Done"],
    },
    {
        id: "agile",
        name: "Agile Sprint",
        description: "Backlog, sprint planning, and delivery",
        emoji: "🚀",
        color: "#0ea5e9",
        lists: ["Backlog", "Sprint Queue", "In Progress", "In Review", "Done"],
    },
    {
        id: "bugtracker",
        name: "Bug Tracker",
        description: "Track and squash bugs systematically",
        emoji: "🪲",
        color: "#ef4444",
        lists: ["Reported", "Confirmed", "In Progress", "Testing", "Resolved"],
    },
    {
        id: "marketing",
        name: "Marketing Campaign",
        description: "Plan and track campaigns end to end",
        emoji: "📢",
        color: "#f97316",
        lists: ["Ideas", "Planning", "In Production", "Launched", "Measuring"],
    },
    {
        id: "personal",
        name: "Personal Tasks",
        description: "Manage your personal goals and todos",
        emoji: "🎯",
        color: "#22c55e",
        lists: ["Someday", "This Week", "Today", "Done"],
    },
];

export function CreateBoardModal({
    open,
    onOpenChange,
    onCreated,
    defaultWorkspaceId,
}: CreateBoardModalProps) {
    const [step, setStep] = useState<"template" | "form">("template");
    const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>(BOARD_TEMPLATES[0]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(DEFAULT_BOARD_COLOR);
    const [visibility, setVisibility] = useState<"private" | "team" | "public">("private");
    const [workspaceId, setWorkspaceId] = useState<string>(defaultWorkspaceId ?? "none");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createBoard = useMutation(api.boards.create);
    const createList = useMutation(api.lists.create);
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);

    useEffect(() => {
        if (open) {
            setWorkspaceId(defaultWorkspaceId ?? "none");
        }
    }, [open, defaultWorkspaceId]);

    const handleTemplateSelect = (template: BoardTemplate) => {
        setSelectedTemplate(template);
        setColor(template.color as any);
        setStep("form");
    };

    const handleReset = () => {
        setStep("template");
        setTitle("");
        setDescription("");
        setColor(DEFAULT_BOARD_COLOR);
        setVisibility("private");
        setWorkspaceId(defaultWorkspaceId ?? "none");
        setSelectedTemplate(BOARD_TEMPLATES[0]);
    };

    const handleClose = (open: boolean) => {
        if (!open) handleReset();
        onOpenChange(open);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a board title");
            return;
        }

        setIsSubmitting(true);

        try {
            const createdBoard = await createBoard({
                title: title.trim(),
                description: description.trim() || undefined,
                color,
                visibility,
                workspaceId: workspaceId !== "none" ? (workspaceId as Id<"workspaces">) : undefined,
            });

            // Create template lists if any
            if (createdBoard?._id && selectedTemplate.lists.length > 0) {
                for (let i = 0; i < selectedTemplate.lists.length; i++) {
                    await createList({
                        boardId: createdBoard._id,
                        title: selectedTemplate.lists[i],
                    });
                }
            }

            toast.success("Board created successfully!");
            handleReset();
            onOpenChange(false);

            if (createdBoard?._id) {
                onCreated?.(createdBoard._id);
            }
        } catch (error) {
            console.error("Error creating board:", error);
            toast.error("Failed to create board. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl border border-border/70 shadow-2xl">
                {step === "template" ? (
                    <>
                        <DialogHeader className="pb-1">
                            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                                <LayoutTemplate className="h-4 w-4 text-primary" />
                                <span>Start from a template</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Choose a template to get started quickly, or start with a blank
                                board.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3">
                            {BOARD_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    className={cn(
                                        "relative text-left rounded-xl border border-border/70 p-3.5 transition-[box-shadow,transform,background-color] duration-150 active:scale-[0.98] cursor-pointer shadow-2xs hover:shadow-xs",
                                        "bg-card hover:bg-muted/40",
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/10"
                                            style={{ background: template.color + "20" }}
                                        >
                                            {template.emoji}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs text-foreground">{template.name}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                                                {template.description}
                                            </p>
                                            {template.lists.length > 0 && (
                                                <p className="text-[10px] text-muted-foreground/70 mt-1.5 truncate">
                                                    {template.lists.join(" · ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <DialogHeader className="pb-1">
                            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setStep("template")}
                                    className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-muted"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <span className="text-lg">{selectedTemplate.emoji}</span>
                                <span>{selectedTemplate.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Customize your board before creating it.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3.5 py-1">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs font-medium">
                                    Board Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Product Roadmap"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={100}
                                    autoFocus
                                    className="h-8 text-xs"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-xs font-medium">Description (optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What is this board about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    className="text-xs resize-y"
                                />
                            </div>

                            {/* Color */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Board Color</Label>
                                <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                                    {BOARD_COLORS.map((boardColor) => {
                                        const isSelected = color === boardColor.value;
                                        return (
                                            <button
                                                key={boardColor.value}
                                                type="button"
                                                onClick={() => setColor(boardColor.value as any)}
                                                className={cn(
                                                    "relative h-8 w-full rounded-lg transition-transform duration-150 hover:scale-105 flex items-center justify-center cursor-pointer",
                                                    isSelected
                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                        : "ring-1 ring-inset ring-black/10 dark:ring-white/15",
                                                )}
                                                style={{ backgroundColor: boardColor.value }}
                                                title={boardColor.name}
                                            >
                                                {isSelected && (
                                                    <Check className="h-3.5 w-3.5 text-white drop-shadow-xs" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Visibility */}
                            <div className="space-y-1.5">
                                <Label htmlFor="visibility" className="text-xs font-medium">Visibility</Label>
                                <Select
                                    value={visibility}
                                    onValueChange={(value: any) => setVisibility(value)}
                                >
                                    <SelectTrigger id="visibility" className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="private">
                                            <div>
                                                <div className="font-medium">Private</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Only you and invited members
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="team">
                                            <div>
                                                <div className="font-medium">Team</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    All team members can view
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="public">
                                            <div>
                                                <div className="font-medium">Public</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Anyone with the link
                                                </div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="workspace" className="text-xs font-medium">Workspace</Label>
                                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                                    <SelectTrigger id="workspace" className="h-8 text-xs">
                                        <SelectValue placeholder="Choose workspace (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="none">No workspace</SelectItem>
                                        {(workspaces ?? []).map((workspace) => (
                                            <SelectItem key={workspace._id} value={workspace._id}>
                                                {workspace.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedTemplate.lists.length > 0 && (
                                <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
                                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                                        Lists to be created:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedTemplate.lists.map((list) => (
                                            <span
                                                key={list}
                                                className="text-[11px] bg-background border border-border/70 rounded-md px-2 py-0.5"
                                            >
                                                {list}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-3 border-t border-border/60">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleClose(false)}
                                disabled={isSubmitting}
                                className="h-8 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !title.trim()}
                                className="h-8 text-xs px-4 gap-1.5"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : null}
                                <span>Create board</span>
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

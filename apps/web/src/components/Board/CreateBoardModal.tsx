import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { LayoutTemplate, Check, ArrowLeft } from "lucide-react";

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
        emoji: "🐛",
        color: "#ef4444",
        lists: ["Reported", "Confirmed", "In Progress", "Testing", "Resolved"],
    },
    {
        id: "marketing",
        name: "Marketing Campaign",
        description: "Plan and track campaigns end to end",
        emoji: "📣",
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

export function CreateBoardModal({ open, onOpenChange, onCreated }: CreateBoardModalProps) {
    const [step, setStep] = useState<"template" | "form">("template");
    const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>(BOARD_TEMPLATES[0]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(DEFAULT_BOARD_COLOR);
    const [visibility, setVisibility] = useState<"private" | "team" | "public">("private");
    const [workspaceId, setWorkspaceId] = useState<string>("none");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createBoard = useMutation(api.boards.create);
    const createList = useMutation(api.lists.create);
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);

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
        setWorkspaceId("none");
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
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                {step === "template" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-primary" />
                                Start from a template
                            </DialogTitle>
                            <DialogDescription>
                                Choose a template to get started quickly, or start with a blank
                                board.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                            {BOARD_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    className={cn(
                                        "relative text-left rounded-xl border p-4 transition-all hover:shadow-md hover:scale-[1.02]",
                                        "bg-background hover:bg-muted/50",
                                    )}
                                    style={{ borderColor: template.color + "60" }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                                            style={{ background: template.color + "20" }}
                                        >
                                            {template.emoji}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm">{template.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
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
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep("template")}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <span className="text-xl">{selectedTemplate.emoji}</span>
                                {selectedTemplate.name}
                            </DialogTitle>
                            <DialogDescription>
                                Customize your board before creating it.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="title">
                                    Board Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Product Roadmap"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={100}
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What is this board about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                />
                            </div>

                            {/* Color */}
                            <div className="grid gap-2">
                                <Label>Board Color</Label>
                                <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                                    {BOARD_COLORS.map((boardColor) => (
                                        <button
                                            key={boardColor.value}
                                            type="button"
                                            onClick={() => setColor(boardColor.value as any)}
                                            className={`relative h-10 w-full rounded-md transition-all hover:scale-110 ${
                                                color === boardColor.value
                                                    ? "ring-2 ring-primary ring-offset-2"
                                                    : ""
                                            }`}
                                            style={{ backgroundColor: boardColor.value }}
                                            title={boardColor.name}
                                        >
                                            {color === boardColor.value && (
                                                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Visibility */}
                            <div className="grid gap-2">
                                <Label htmlFor="visibility">Visibility</Label>
                                <Select
                                    value={visibility}
                                    onValueChange={(value: any) => setVisibility(value)}
                                >
                                    <SelectTrigger id="visibility">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="private">
                                            <div>
                                                <div className="font-medium">Private</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Only you and invited members
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="team">
                                            <div>
                                                <div className="font-medium">Team</div>
                                                <div className="text-xs text-muted-foreground">
                                                    All team members can view
                                                </div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="public">
                                            <div>
                                                <div className="font-medium">Public</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Anyone with the link
                                                </div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="workspace">Workspace</Label>
                                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                                    <SelectTrigger id="workspace">
                                        <SelectValue placeholder="Choose workspace (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                        Lists to be created:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedTemplate.lists.map((list) => (
                                            <span
                                                key={list}
                                                className="text-xs bg-background border border-border rounded px-2 py-0.5"
                                            >
                                                {list}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !title.trim()}>
                                {isSubmitting ? "Creating..." : "Create Board"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

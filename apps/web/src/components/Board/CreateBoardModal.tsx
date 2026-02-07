import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

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

interface CreateBoardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(DEFAULT_BOARD_COLOR);
    const [visibility, setVisibility] = useState<"private" | "team" | "public">("private");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createBoard = useMutation(api.boards.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a board title");
            return;
        }

        setIsSubmitting(true);

        try {
            await createBoard({
                title: title.trim(),
                description: description.trim() || undefined,
                color,
                visibility,
            });

            toast.success("Board created successfully!");

            // Reset form
            setTitle("");
            setDescription("");
            setColor(DEFAULT_BOARD_COLOR);
            setVisibility("private");
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating board:", error);
            toast.error("Failed to create board. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Board</DialogTitle>
                        <DialogDescription>
                            Create a new board to organize your tasks and collaborate with your team.
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
                                rows={3}
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
                                        className={`h-10 w-full rounded-md transition-all hover:scale-110 ${color === boardColor.value
                                            ? "ring-2 ring-primary ring-offset-2"
                                            : ""
                                            }`}
                                        style={{ backgroundColor: boardColor.value }}
                                        title={boardColor.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="grid gap-2">
                            <Label htmlFor="visibility">Visibility</Label>
                            <Select
                                value={visibility}
                                onValueChange={(value: any) =>
                                    setVisibility(value)
                                }
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
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? "Creating..." : "Create Board"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

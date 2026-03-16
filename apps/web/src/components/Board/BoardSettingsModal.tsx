import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Archive, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Board } from "@/types/board";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LabelManager } from "@/components/Board/LabelManager";
import { CustomFieldManager } from "@/components/Board/CustomFieldManager";
import { AutomationSettings } from "@/components/Board/AutomationSettings";
import { ImportExportPanel } from "@/components/Board/ImportExportPanel";

interface BoardSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    board: Board;
}

export function BoardSettingsModal({ open, onOpenChange, board }: BoardSettingsModalProps) {
    const navigate = useNavigate();
    const [title, setTitle] = useState(board.title);
    const [description, setDescription] = useState(board.description ?? "");
    const [color, setColor] = useState(board.color ?? DEFAULT_BOARD_COLOR);
    const [visibility, setVisibility] = useState<"private" | "team" | "public">(board.visibility);
    const [workspaceId, setWorkspaceId] = useState<string>(board.workspaceId ?? "none");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const updateBoard = useMutation(api.boards.update);
    const archiveBoard = useMutation(api.boards.archive);
    const restoreBoard = useMutation(api.boards.restore);
    const deleteBoard = useMutation(api.boards.deleteBoard);
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);

    const isOwner = board.role === "owner";
    const canEdit = board.role === "owner" || board.role === "admin";

    // Sync form when modal opens with latest board data
    const handleOpenChange = (next: boolean) => {
        if (next) {
            setTitle(board.title);
            setDescription(board.description ?? "");
            setColor(board.color ?? DEFAULT_BOARD_COLOR);
            setVisibility(board.visibility);
            setWorkspaceId(board.workspaceId ?? "none");
        }
        onOpenChange(next);
    };

    const handleSave = async () => {
        if (!canEdit) return;
        if (!title.trim()) {
            toast.error("Please enter a board title");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateBoard({
                boardId: board._id,
                title: title.trim(),
                description: description.trim() || undefined,
                color,
                visibility,
                workspaceId: workspaceId !== "none" ? (workspaceId as Id<"workspaces">) : undefined,
            });
            toast.success("Board settings saved!");
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating board:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleArchive = async () => {
        if (!isOwner) return;
        setIsSubmitting(true);
        try {
            await archiveBoard({ boardId: board._id });
            toast.success("Board archived");
            onOpenChange(false);
            navigate({ to: "/boards" });
        } catch (error) {
            console.error("Error archiving board:", error);
            toast.error("Failed to archive board");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRestore = async () => {
        if (!isOwner) return;
        setIsSubmitting(true);
        try {
            await restoreBoard({ boardId: board._id });
            toast.success("Board restored");
            onOpenChange(false);
        } catch (error) {
            console.error("Error restoring board:", error);
            toast.error("Failed to restore board");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!isOwner) return;
        setIsSubmitting(true);
        try {
            await deleteBoard({ boardId: board._id });
            toast.success("Board deleted");
            setShowDeleteConfirm(false);
            onOpenChange(false);
            navigate({ to: "/boards" });
        } catch (error) {
            console.error("Error deleting board:", error);
            toast.error("Failed to delete board");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] sm:w-full max-h-[90dvh] flex flex-col p-4 sm:p-6 rounded-xl">
                    <DialogHeader className="shrink-0 pb-2">
                        <DialogTitle>Board settings</DialogTitle>
                        <DialogDescription>
                            Edit board details and manage visibility. Only owners can archive or
                            delete.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs
                        defaultValue="general"
                        className="flex flex-col min-h-0 flex-1 overflow-hidden"
                    >
                        <TabsList
                            className={`shrink-0 w-full ${
                                canEdit ? "grid grid-cols-2" : "grid grid-cols-1"
                            }`}
                        >
                            <TabsTrigger value="general" className="w-full">
                                General
                            </TabsTrigger>
                            {canEdit && (
                                <TabsTrigger value="advanced" className="w-full">
                                    Advanced
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent
                            value="general"
                            className="overflow-y-auto flex-1 min-h-0 mt-3"
                        >
                            <div className="grid gap-4 px-1 pb-1">
                                {/* Title */}
                                <div className="grid gap-2">
                                    <Label htmlFor="settings-title">
                                        Board title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="settings-title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={100}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {/* Description */}
                                <div className="grid gap-2">
                                    <Label htmlFor="settings-description">Description</Label>
                                    <Textarea
                                        id="settings-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        disabled={!canEdit}
                                        placeholder="What is this board about?"
                                    />
                                </div>

                                {/* Color */}
                                <div className="grid gap-2">
                                    <Label>Board color</Label>
                                    <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                                        {BOARD_COLORS.map((boardColor) => (
                                            <button
                                                key={boardColor.value}
                                                type="button"
                                                onClick={() =>
                                                    canEdit && setColor(boardColor.value)
                                                }
                                                disabled={!canEdit}
                                                className={`h-10 w-full rounded-md transition-all hover:scale-110 disabled:opacity-50 ${
                                                    color === boardColor.value
                                                        ? "ring-2 ring-primary ring-offset-2"
                                                        : ""
                                                }`}
                                                style={{
                                                    backgroundColor: boardColor.value,
                                                }}
                                                title={boardColor.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div className="grid gap-2">
                                    <Label htmlFor="settings-visibility">Visibility</Label>
                                    <Select
                                        value={visibility}
                                        onValueChange={(value: "private" | "team" | "public") =>
                                            setVisibility(value)
                                        }
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger id="settings-visibility">
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
                                    <Label htmlFor="settings-workspace">Workspace</Label>
                                    <Select
                                        value={workspaceId}
                                        onValueChange={setWorkspaceId}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger id="settings-workspace">
                                            <SelectValue placeholder="No workspace" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No workspace</SelectItem>
                                            {(workspaces ?? []).map((workspace) => (
                                                <SelectItem
                                                    key={workspace._id}
                                                    value={workspace._id}
                                                >
                                                    {workspace.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {canEdit && (
                            <TabsContent
                                value="advanced"
                                className="overflow-y-auto flex-1 min-h-0 mt-3"
                            >
                                <div className="grid gap-4 px-1 pb-1">
                                    <LabelManager boardId={board._id} />
                                    <CustomFieldManager boardId={board._id} />
                                    <AutomationSettings boardId={board._id} />
                                    <ImportExportPanel
                                        boardId={board._id}
                                        boardTitle={board.title}
                                    />
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between pt-4 shrink-0 mt-2 border-t">
                        <div className="flex flex-col gap-2 w-full sm:w-auto order-2 sm:order-1">
                            {isOwner && (
                                <>
                                    {board.archived ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleRestore}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto"
                                        >
                                            <Archive className="h-4 w-4 mr-2" />
                                            Restore board
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleArchive}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto"
                                        >
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archive board
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete board
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            {canEdit && (
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSubmitting || !title.trim()}
                                    className="w-full sm:w-auto"
                                >
                                    {isSubmitting ? "Saving..." : "Save changes"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={handleDeleteConfirm}
                title="Delete board?"
                description="This will permanently delete the board and all its lists and cards. This action cannot be undone."
                confirmText="Delete board"
            />
        </>
    );
}

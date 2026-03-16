import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Building2, LayoutGrid, Plus, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { WORKSPACE_PALETTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

function workspaceColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) >>> 0;
    return WORKSPACE_PALETTE[h % WORKSPACE_PALETTE.length];
}

export interface WorkspaceSelectProps {
    selectedId: Id<"workspaces"> | null;
    onSelect: (id: Id<"workspaces"> | null) => void;
}
function NewWorkspaceDialog({ variant }: { variant: "sidebar" | "mobile" }) {
    const createWorkspace = useMutation(api.workspaces.create);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        try {
            await createWorkspace({ name: name.trim() });
            setName("");
            setOpen(false);
            toast.success("Workspace created");
        } catch {
            toast.error("Failed to create workspace");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === "sidebar" ? (
                    <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                        <Plus className="h-4 w-4 shrink-0" />
                        New Workspace
                    </button>
                ) : (
                    <button
                        type="button"
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                        <Plus className="h-3 w-3" />
                        New
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        New Workspace
                    </DialogTitle>
                    <DialogDescription>
                        Group boards together for your team or project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="new-ws-name">Name</Label>
                        <Input
                            id="new-ws-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Design Team"
                            maxLength={80}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!name.trim() || busy} className="w-full">
                            {busy ? "Creating…" : "Create Workspace"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Desktop sidebar
export function WorkspaceSidebar({ selectedId, onSelect }: WorkspaceSelectProps) {
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);
    const loading = workspaces === undefined;

    return (
        <nav className="flex flex-col gap-0.5">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Workspaces
            </p>

            {/* All Boards */}
            <button
                type="button"
                onClick={() => onSelect(null)}
                className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    selectedId === null
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
            >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                All Boards
            </button>

            {/* Workspace list */}
            {loading ? (
                <>
                    <Skeleton className="mx-1 my-0.5 h-7 w-4/5" />
                    <Skeleton className="mx-1 my-0.5 h-7 w-3/5" />
                </>
            ) : (
                workspaces.map((ws) => {
                    const color = workspaceColor(ws.name);
                    const initials = ws.name.slice(0, 2).toUpperCase();
                    const active = selectedId === ws._id;
                    return (
                        <div key={ws._id} className="group/ws flex items-center gap-0.5">
                            <button
                                type="button"
                                onClick={() => onSelect(ws._id)}
                                className={cn(
                                    "flex flex-1 min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                                    active
                                        ? "bg-accent font-medium text-accent-foreground"
                                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                )}
                            >
                                <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                                    style={{ backgroundColor: color }}
                                >
                                    {initials}
                                </span>
                                <span className="flex-1 truncate text-left">{ws.name}</span>
                                <span className="shrink-0 tabular-nums text-xs opacity-50">
                                    {ws.boardsCount}
                                </span>
                            </button>
                            <Link
                                to="/workspaces/$workspaceId"
                                params={{ workspaceId: ws._id }}
                                className="opacity-0 group-hover/ws:opacity-100 shrink-0 p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
                                title="Workspace settings"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Settings className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    );
                })
            )}

            {/* Create workspace */}
            <div className="mt-2 border-t pt-2">
                <NewWorkspaceDialog variant="sidebar" />
            </div>
        </nav>
    );
}

// Mobile horizontal strip
export function WorkspaceMobileStrip({ selectedId, onSelect }: WorkspaceSelectProps) {
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* All Boards pill */}
            <button
                type="button"
                onClick={() => onSelect(null)}
                className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    selectedId === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
            >
                <LayoutGrid className="h-3 w-3" />
                All
            </button>

            {/* Workspace pills */}
            {(workspaces ?? []).map((ws) => {
                const color = workspaceColor(ws.name);
                const active = selectedId === ws._id;
                return (
                    <button
                        key={ws._id}
                        type="button"
                        onClick={() => onSelect(ws._id)}
                        className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                        )}
                    >
                        <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="max-w-30 truncate">{ws.name}</span>
                    </button>
                );
            })}

            {/* New workspace */}
            <NewWorkspaceDialog variant="mobile" />
        </div>
    );
}

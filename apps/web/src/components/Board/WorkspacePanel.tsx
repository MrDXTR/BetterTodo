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
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>New Workspace</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="h-3 w-3" />
                        <span>New</span>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm p-5 sm:p-6 rounded-2xl border border-border/70 shadow-2xl">
                <DialogHeader className="pb-1">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>New Workspace</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Group boards together for your team or project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="new-ws-name" className="text-xs font-medium">Name</Label>
                        <Input
                            id="new-ws-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Design Team"
                            maxLength={80}
                            autoFocus
                            className="h-8 text-xs"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={!name.trim() || busy} className="w-full h-8 text-xs">
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
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspaces
            </p>

            {/* All Boards */}
            <button
                type="button"
                onClick={() => onSelect(null)}
                className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer active:scale-[0.98]",
                    selectedId === null
                        ? "bg-accent font-medium text-accent-foreground shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
            >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>All Boards</span>
            </button>

            {/* Workspace list */}
            {loading ? (
                <>
                    <Skeleton className="mx-1 my-0.5 h-6 w-4/5 rounded-md" />
                    <Skeleton className="mx-1 my-0.5 h-6 w-3/5 rounded-md" />
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
                                    "flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer active:scale-[0.98]",
                                    active
                                        ? "bg-accent font-medium text-accent-foreground shadow-2xs"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                )}
                            >
                                <span
                                    className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm text-[9px] font-bold text-white ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                    style={{ backgroundColor: color }}
                                >
                                    {initials}
                                </span>
                                <span className="flex-1 truncate text-left">{ws.name}</span>
                                <span className="shrink-0 tabular-nums text-[10px] opacity-60">
                                    {ws.boardsCount}
                                </span>
                            </button>
                            <Link
                                to="/workspaces/$workspaceId"
                                params={{ workspaceId: ws._id }}
                                className="opacity-0 group-hover/ws:opacity-100 shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity duration-150"
                                title="Workspace settings"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Settings className="h-3 w-3" />
                            </Link>
                        </div>
                    );
                })
            )}

            {/* Create workspace */}
            <div className="mt-2 border-t border-border/50 pt-2">
                <NewWorkspaceDialog variant="sidebar" />
            </div>
        </nav>
    );
}

// Mobile horizontal strip
export function WorkspaceMobileStrip({ selectedId, onSelect }: WorkspaceSelectProps) {
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);

    return (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* All Boards pill */}
            <button
                type="button"
                onClick={() => onSelect(null)}
                className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer active:scale-[0.98]",
                    selectedId === null
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
            >
                <LayoutGrid className="h-3 w-3" />
                <span>All</span>
            </button>

            {/* Workspaces */}
            {(workspaces ?? []).map((ws) => {
                const color = workspaceColor(ws.name);
                const active = selectedId === ws._id;
                return (
                    <div
                        key={ws._id}
                        className={cn(
                            "flex shrink-0 items-center rounded-full transition-colors",
                            active
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(ws._id)}
                            className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-medium cursor-pointer active:scale-[0.98]"
                        >
                            <span
                                className="h-2 w-2 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                style={{ backgroundColor: color }}
                            />
                            <span className="max-w-[120px] truncate">{ws.name}</span>
                            <span className="tabular-nums text-[10px] opacity-70">({ws.boardsCount})</span>
                        </button>
                        <Link
                            to="/workspaces/$workspaceId"
                            params={{ workspaceId: ws._id }}
                            className={cn(
                                "pr-2.5 pl-1 py-1 transition-opacity cursor-pointer active:scale-90",
                                active
                                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                                    : "text-muted-foreground/60 hover:text-foreground",
                            )}
                            title={`${ws.name} settings`}
                            aria-label={`${ws.name} settings`}
                        >
                            <Settings className="h-3 w-3" />
                        </Link>
                    </div>
                );
            })}

            <div className="shrink-0">
                <NewWorkspaceDialog variant="mobile" />
            </div>
        </div>
    );
}

import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkspacePanel() {
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);
    const createWorkspace = useMutation(api.workspaces.create);

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const workspaceCount = (workspaces ?? []).length;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createWorkspace({ name: name.trim() });
            setName("");
            toast.success("Workspace created");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create workspace");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="rounded-lg border bg-card">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Team workspaces</h2>
                    {workspaceCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            ({workspaceCount})
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="space-y-3 px-3 pb-3 border-t pt-3">
                    <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Create a workspace"
                            maxLength={80}
                        />
                        <Button type="submit" disabled={!name.trim() || isSubmitting} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create
                        </Button>
                    </form>

                    {workspaceCount > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {workspaces!.map((workspace) => (
                                <div key={workspace._id} className="rounded-md border p-3">
                                    <p className="font-medium text-sm">{workspace.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {workspace.boardsCount} board
                                        {workspace.boardsCount === 1 ? "" : "s"} · {workspace.role}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

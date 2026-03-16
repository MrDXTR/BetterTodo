import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import {
    Building2,
    ChevronLeft,
    ChevronDown,
    Crown,
    Shield,
    User,
    UserMinus,
    UserPlus,
    Loader2,
    Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/workspaces/$workspaceId")({
    component: RouteComponent,
});

const ROLE_CONFIG = {
    owner: { label: "Owner", icon: Crown, color: "text-yellow-500" },
    admin: { label: "Admin", icon: Shield, color: "text-blue-500" },
    member: { label: "Member", icon: User, color: "text-green-500" },
} as const;

function RenameSection({
    workspaceId,
    currentName,
    canManage,
}: {
    workspaceId: Id<"workspaces">;
    currentName: string;
    canManage: boolean;
}) {
    const updateWorkspace = useMutation(api.workspaces.update);
    const [name, setName] = useState(currentName);
    const [busy, setBusy] = useState(false);

    // Keep in sync if parent data changes
    useEffect(() => {
        setName(currentName);
    }, [currentName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed || trimmed === currentName) return;
        setBusy(true);
        try {
            await updateWorkspace({ workspaceId, name: trimmed });
            toast.success("Workspace renamed");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to rename workspace");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">General</h2>
            </div>
            <div className="px-5 py-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
                    <div className="space-y-1.5">
                        <Label htmlFor="ws-name">Workspace name</Label>
                        <Input
                            id="ws-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            disabled={!canManage || busy}
                            placeholder="Workspace name"
                        />
                    </div>
                    {canManage && (
                        <Button
                            type="submit"
                            size="sm"
                            className="self-start"
                            disabled={!name.trim() || name.trim() === currentName || busy}
                        >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            Save changes
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}

function InviteForm({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
    const addMemberByEmail = useMutation(api.workspaces.addMemberByEmail);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member">("member");
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setBusy(true);
        try {
            const result = await addMemberByEmail({ workspaceId, email: email.trim(), role });
            toast.success(`Added ${result.userName || email} to workspace`);
            setEmail("");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to add member");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" />
                Invite Member
            </p>
            <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
            />
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs flex-1"
                        >
                            {ROLE_CONFIG[role].label}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {(["admin", "member"] as const).map((r) => (
                            <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                                {ROLE_CONFIG[r].label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button type="submit" size="sm" disabled={busy || !email.trim()} className="gap-1">
                    {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                    )}
                    Invite
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                The person must already have an account in BetterTodo.
            </p>
        </form>
    );
}

function MembersSection({
    workspaceId,
    currentUserId,
    canManage,
    isOwner,
}: {
    workspaceId: Id<"workspaces">;
    currentUserId: string;
    canManage: boolean;
    isOwner: boolean;
}) {
    const workspace = useQuery(api.workspaces.getById, { workspaceId });
    const updateRole = useMutation(api.workspaces.updateMemberRole);
    const removeMember = useMutation(api.workspaces.removeMember);

    const [removing, setRemoving] = useState<{ userId: string; name: string } | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
        setLoadingAction(userId);
        try {
            await updateRole({ workspaceId, userId, role: newRole });
            toast.success("Role updated");
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to update role");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRemove = async () => {
        if (!removing) return;
        setLoadingAction(removing.userId);
        try {
            await removeMember({ workspaceId, userId: removing.userId });
            toast.success("Member removed");
            setRemoving(null);
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to remove member");
        } finally {
            setLoadingAction(null);
        }
    };

    const members = workspace?.members ?? [];

    return (
        <>
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-5 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-semibold text-sm">Members</h2>
                        {members.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {members.length}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Invite form */}
                {canManage && (
                    <div className="px-5 pt-4">
                        <InviteForm workspaceId={workspaceId} />
                    </div>
                )}

                {/* Member list */}
                <div className="mt-2">
                    {workspace === undefined ? (
                        <div className="divide-y">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-4">
                                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-7 w-20 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No members yet
                        </p>
                    ) : (
                        <div className="divide-y">
                            {members.map((member: any) => {
                                const isSelf = member.userId === currentUserId;
                                const isLoading = loadingAction === member.userId;
                                const roleKey =
                                    (member.role as keyof typeof ROLE_CONFIG) in ROLE_CONFIG
                                        ? (member.role as keyof typeof ROLE_CONFIG)
                                        : "member";
                                const rc = ROLE_CONFIG[roleKey];
                                const RoleIcon = rc.icon;
                                const initials = (member.user?.name ?? member.user?.email ?? "?")
                                    .split(" ")
                                    .map((p: string) => p[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2);

                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-3 px-5 py-3.5"
                                    >
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={member.user?.image} />
                                            <AvatarFallback className="text-xs font-medium">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">
                                                    {member.user?.name ?? "Unknown"}
                                                </p>
                                                {isSelf && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] px-1.5 py-0 shrink-0"
                                                    >
                                                        You
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.user?.email ?? ""}
                                            </p>
                                        </div>

                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                        ) : member.role === "owner" ? (
                                            <Badge variant="secondary" className="gap-1 shrink-0">
                                                <Crown className="h-3 w-3 text-yellow-500" />
                                                Owner
                                            </Badge>
                                        ) : isOwner && !isSelf ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 gap-1 text-xs shrink-0"
                                                    >
                                                        <RoleIcon
                                                            className={`h-3 w-3 ${rc.color}`}
                                                        />
                                                        {rc.label}
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {(["admin", "member"] as const).map((r) => {
                                                        const rConfig = ROLE_CONFIG[r];
                                                        const RIcon = rConfig.icon;
                                                        return (
                                                            <DropdownMenuItem
                                                                key={r}
                                                                onClick={() =>
                                                                    handleRoleChange(
                                                                        member.userId,
                                                                        r,
                                                                    )
                                                                }
                                                                className="gap-2"
                                                            >
                                                                <RIcon
                                                                    className={`h-4 w-4 ${rConfig.color}`}
                                                                />
                                                                {rConfig.label}
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setRemoving({
                                                                userId: member.userId,
                                                                name:
                                                                    member.user?.name ??
                                                                    "this member",
                                                            })
                                                        }
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                        Remove from workspace
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Badge variant="secondary" className="gap-1 shrink-0">
                                                <RoleIcon className={`h-3 w-3 ${rc.color}`} />
                                                {rc.label}
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationDialog
                open={removing !== null}
                onOpenChange={(open) => !open && setRemoving(null)}
                onConfirm={handleRemove}
                title="Remove member?"
                description={`Are you sure you want to remove ${removing?.name} from this workspace? They will lose access to all team boards.`}
                confirmText="Remove member"
            />
        </>
    );
}

function WorkspaceSettingsContent({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
    const navigate = useNavigate();
    const currentUser = useQuery(api.auth.getCurrentUser);
    const workspace = useQuery(api.workspaces.getById, { workspaceId });

    useEffect(() => {
        if (workspace === null) {
            navigate({ to: "/boards" });
        }
    }, [workspace, navigate]);

    if (workspace === undefined || currentUser === undefined) {
        return (
            <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!workspace) return null;

    const myMembership = workspace.members.find((m: any) => m.userId === currentUser?._id);
    const myRole = myMembership?.role ?? "member";
    const isOwner = myRole === "owner";
    const canManage = isOwner || myRole === "admin";

    return (
        <div className="min-h-[calc(100vh-3rem)] bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div>
                    <Link
                        to="/boards"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Boards
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
                            <p className="text-sm text-muted-foreground">Workspace Settings</p>
                        </div>
                    </div>
                </div>

                {/* General settings */}
                <RenameSection
                    workspaceId={workspaceId}
                    currentName={workspace.name}
                    canManage={canManage}
                />

                {/* Members */}
                <MembersSection
                    workspaceId={workspaceId}
                    currentUserId={currentUser?._id ?? ""}
                    canManage={canManage}
                    isOwner={isOwner}
                />
            </div>
        </div>
    );
}
function RouteComponent() {
    const { workspaceId } = Route.useParams();

    return (
        <>
            <Authenticated>
                <WorkspaceSettingsContent workspaceId={workspaceId as Id<"workspaces">} />
            </Authenticated>
            <Unauthenticated>
                <RedirectToSignIn />
            </Unauthenticated>
            <AuthLoading>
                <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </AuthLoading>
        </>
    );
}

function RedirectToSignIn() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate({ to: "/sign-in" });
    }, [navigate]);
    return null;
}

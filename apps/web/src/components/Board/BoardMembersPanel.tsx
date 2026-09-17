import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    Crown,
    Shield,
    User,
    Eye,
    UserMinus,
    UserPlus,
    ChevronDown,
    Loader2,
    Link2,
    Copy,
    Check,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";

interface BoardMembersPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boardId: Id<"boards">;
    currentUserRole?: string;
}

const ROLE_CONFIG = {
    owner: {
        label: "Owner",
        icon: Crown,
        color: "text-amber-500",
        description: "Full control over the board",
    },
    admin: {
        label: "Admin",
        icon: Shield,
        color: "text-blue-500",
        description: "Can manage members and settings",
    },
    member: {
        label: "Member",
        icon: User,
        color: "text-emerald-500",
        description: "Can create and edit cards",
    },
    viewer: {
        label: "Viewer",
        icon: Eye,
        color: "text-muted-foreground",
        description: "Can only view the board",
    },
} as const;

export function BoardMembersPanel({
    open,
    onOpenChange,
    boardId,
    currentUserRole,
}: BoardMembersPanelProps) {
    const members = useQuery(api.boards.getMembers, open ? { boardId } : "skip");
    const updateRole = useMutation(api.boards.updateMemberRole);
    const removeMember = useMutation(api.boards.removeMember);

    const [removingMember, setRemovingMember] = useState<{
        userId: string;
        name: string;
    } | null>(null);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
    const [isInviting, setIsInviting] = useState(false);
    const addMemberByEmail = useMutation(api.boards.addMemberByEmail);
    const getOrCreateShareLink = useMutation(api.boards.getOrCreateShareLink);
    const [shareLinkRole, setShareLinkRole] = useState<"member" | "viewer">("member");
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [hasCopiedLink, setHasCopiedLink] = useState(false);

    const handleCopyShareLink = async () => {
        setIsGeneratingLink(true);
        try {
            const res = await getOrCreateShareLink({
                boardId,
                role: shareLinkRole,
            });
            const inviteUrl = `${window.location.origin}/invite/${res.token}`;
            await navigator.clipboard.writeText(inviteUrl);
            setHasCopiedLink(true);
            toast.success("Board invite link copied to clipboard!");
            setTimeout(() => setHasCopiedLink(false), 2500);
        } catch (error: any) {
            toast.error(error?.message || "Failed to generate invite link");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";
    const isOwner = currentUserRole === "owner";

    const handleRoleChange = async (userId: string, newRole: "admin" | "member" | "viewer") => {
        setLoadingAction(userId);
        try {
            await updateRole({ boardId, userId, role: newRole });
            toast.success("Member role updated");
        } catch (error: any) {
            toast.error(error.message || "Failed to update role");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRemoveMember = async () => {
        if (!removingMember) return;
        setLoadingAction(removingMember.userId);
        try {
            await removeMember({ boardId, userId: removingMember.userId });
            toast.success("Member removed from board");
            setRemovingMember(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to remove member");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-md p-6">
                    <SheetHeader>
                        <SheetTitle className="text-base font-semibold">Board Members</SheetTitle>
                        <SheetDescription className="text-xs">
                            {members
                                ? `${members.length} member${members.length === 1 ? "" : "s"}`
                                : "Loading..."}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Invite Section */}
                    {canManageMembers && (
                        <div className="mt-5 p-3.5 rounded-xl border border-border/70 bg-muted/25 space-y-2.5">
                            <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Invite Member</span>
                            </p>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!inviteEmail.trim()) return;
                                    setIsInviting(true);
                                    try {
                                        const result = await addMemberByEmail({
                                            boardId,
                                            email: inviteEmail.trim(),
                                            role: inviteRole,
                                        });
                                        toast.success(
                                            `Invitation sent to ${result.userName || inviteEmail}`,
                                        );
                                        setInviteEmail("");
                                    } catch (error: any) {
                                        toast.error(error.message || "Failed to add member");
                                    } finally {
                                        setIsInviting(false);
                                    }
                                }}
                                className="flex flex-col gap-2"
                            >
                                <Input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={isInviting}
                                    className="h-8 text-xs bg-background"
                                />
                                <div className="flex gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-1 text-xs flex-1 h-8 justify-between"
                                            >
                                                <span>{ROLE_CONFIG[inviteRole].label}</span>
                                                <ChevronDown className="h-3 w-3 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {(["admin", "member", "viewer"] as const).map((r) => (
                                                <DropdownMenuItem
                                                    key={r}
                                                    onClick={() => setInviteRole(r)}
                                                    className="text-xs cursor-pointer"
                                                >
                                                    {ROLE_CONFIG[r].label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isInviting || !inviteEmail.trim()}
                                        className="gap-1 h-8 text-xs px-3"
                                    >
                                        {isInviting ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <UserPlus className="h-3 w-3" />
                                        )}
                                        <span>Invite</span>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Share via Link */}
                    {canManageMembers && (
                        <div className="mt-3.5 p-3.5 rounded-xl border border-border/70 bg-muted/15 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                                    <Link2 className="h-3.5 w-3.5 text-primary" />
                                    <span>Share via Link</span>
                                </p>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                                >
                                    Public Link
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Anyone with this link can join this board (even if they need to sign
                                in or create an account first).
                            </p>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-xs h-8 justify-between shrink-0"
                                        >
                                            <span>{ROLE_CONFIG[shareLinkRole].label}</span>
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {(["member", "viewer"] as const).map((r) => (
                                            <DropdownMenuItem
                                                key={r}
                                                onClick={() => {
                                                    setShareLinkRole(r);
                                                    setHasCopiedLink(false);
                                                }}
                                                className="text-xs cursor-pointer"
                                            >
                                                {ROLE_CONFIG[r].label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleCopyShareLink}
                                    disabled={isGeneratingLink}
                                    className="gap-1.5 h-8 text-xs flex-1"
                                >
                                    {isGeneratingLink ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : hasCopiedLink ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                    <span>
                                        {hasCopiedLink ? "Link Copied!" : "Copy Share Link"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                        {members === undefined ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
                                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3.5 w-28 bg-muted animate-pulse rounded" />
                                        <div className="h-2.5 w-16 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            ))
                        ) : members.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">
                                No members found
                            </p>
                        ) : (
                            members.map((member: any) => {
                                const role =
                                    ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] ??
                                    ROLE_CONFIG.member;
                                const RoleIcon = role.icon;
                                const isLoading = loadingAction === member.userId;

                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <Avatar className="h-8 w-8 ring-2 ring-background shrink-0">
                                            <AvatarImage src={member.user?.image} />
                                            <AvatarFallback className="text-xs font-medium">
                                                {member.user?.name?.charAt(0).toUpperCase() ?? "?"}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Name & Email */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate text-foreground">
                                                {member.user?.name ?? "Unknown User"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {member.user?.email ?? ""}
                                            </p>
                                        </div>

                                        {/* Role Badge / Dropdown */}
                                        {isLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                        ) : member.role === "owner" ? (
                                            <Badge
                                                variant="secondary"
                                                className="gap-1 shrink-0 text-[10px]"
                                            >
                                                <Crown className="h-3 w-3 text-amber-500" />
                                                <span>Owner</span>
                                            </Badge>
                                        ) : isOwner ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="xs"
                                                        className="h-7 gap-1 text-[11px] shrink-0"
                                                    >
                                                        <RoleIcon
                                                            className={`h-3 w-3 ${role.color}`}
                                                        />
                                                        <span>{role.label}</span>
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="text-xs"
                                                >
                                                    {(["admin", "member", "viewer"] as const).map(
                                                        (r) => {
                                                            const rc = ROLE_CONFIG[r];
                                                            const Icon = rc.icon;
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={r}
                                                                    onClick={() =>
                                                                        handleRoleChange(
                                                                            member.userId,
                                                                            r,
                                                                        )
                                                                    }
                                                                    className="gap-2 cursor-pointer"
                                                                >
                                                                    <Icon
                                                                        className={`h-3.5 w-3.5 ${rc.color}`}
                                                                    />
                                                                    <div>
                                                                        <p className="font-medium text-xs">
                                                                            {rc.label}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {rc.description}
                                                                        </p>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            );
                                                        },
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setRemovingMember({
                                                                userId: member.userId,
                                                                name:
                                                                    member.user?.name ??
                                                                    "this member",
                                                            })
                                                        }
                                                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <UserMinus className="h-3.5 w-3.5" />
                                                        <span className="font-medium text-xs">
                                                            Remove from board
                                                        </span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : canManageMembers && member.role !== "owner" ? (
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                className="h-7 text-[11px] text-destructive hover:text-destructive shrink-0"
                                                onClick={() =>
                                                    setRemovingMember({
                                                        userId: member.userId,
                                                        name: member.user?.name ?? "this member",
                                                    })
                                                }
                                            >
                                                <UserMinus className="h-3 w-3 mr-1" />
                                                <span>Remove</span>
                                            </Button>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="gap-1 shrink-0 text-[10px]"
                                            >
                                                <RoleIcon className={`h-3 w-3 ${role.color}`} />
                                                <span>{role.label}</span>
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <DeleteConfirmationDialog
                open={removingMember !== null}
                onOpenChange={(open) => !open && setRemovingMember(null)}
                onConfirm={handleRemoveMember}
                title="Remove member?"
                description={`Are you sure you want to remove ${removingMember?.name} from this board? They will lose access to all cards and lists.`}
                confirmText="Remove member"
            />
        </>
    );
}

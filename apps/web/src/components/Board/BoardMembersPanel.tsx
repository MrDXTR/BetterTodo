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
    ChevronDown,
    Loader2,
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
        color: "text-yellow-500",
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
        color: "text-green-500",
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

    const canManageMembers =
        currentUserRole === "owner" || currentUserRole === "admin";
    const isOwner = currentUserRole === "owner";

    const handleRoleChange = async (
        userId: string,
        newRole: "admin" | "member" | "viewer"
    ) => {
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
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Board Members</SheetTitle>
                        <SheetDescription>
                            {members
                                ? `${members.length} member${members.length === 1 ? "" : "s"}`
                                : "Loading..."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
                        {members === undefined ? (
                            // Skeleton loader
                            Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-lg"
                                >
                                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            ))
                        ) : members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No members found
                            </p>
                        ) : (
                            members.map((member: any) => {
                                const role =
                                    ROLE_CONFIG[
                                    member.role as keyof typeof ROLE_CONFIG
                                    ] ?? ROLE_CONFIG.member;
                                const RoleIcon = role.icon;
                                const isLoading =
                                    loadingAction === member.userId;

                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                    >
                                        {/* Avatar */}
                                        <Avatar className="h-10 w-10 border-2 border-background">
                                            <AvatarImage
                                                src={member.user?.image}
                                            />
                                            <AvatarFallback className="text-sm font-medium">
                                                {member.user?.name
                                                    ?.charAt(0)
                                                    .toUpperCase() ?? "?"}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Name & Email */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {member.user?.name ??
                                                    "Unknown User"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.user?.email ?? ""}
                                            </p>
                                        </div>

                                        {/* Role Badge / Dropdown */}
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : member.role === "owner" ? (
                                            <Badge
                                                variant="secondary"
                                                className="gap-1 shrink-0"
                                            >
                                                <Crown className="h-3 w-3 text-yellow-500" />
                                                Owner
                                            </Badge>
                                        ) : isOwner ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 gap-1 text-xs shrink-0"
                                                    >
                                                        <RoleIcon
                                                            className={`h-3 w-3 ${role.color}`}
                                                        />
                                                        {role.label}
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {(
                                                        [
                                                            "admin",
                                                            "member",
                                                            "viewer",
                                                        ] as const
                                                    ).map((r) => {
                                                        const rc =
                                                            ROLE_CONFIG[r];
                                                        const Icon = rc.icon;
                                                        return (
                                                            <DropdownMenuItem
                                                                key={r}
                                                                onClick={() =>
                                                                    handleRoleChange(
                                                                        member.userId,
                                                                        r
                                                                    )
                                                                }
                                                                className="gap-2"
                                                            >
                                                                <Icon
                                                                    className={`h-4 w-4 ${rc.color}`}
                                                                />
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {
                                                                            rc.label
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {
                                                                            rc.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setRemovingMember({
                                                                userId: member.userId,
                                                                name:
                                                                    member.user
                                                                        ?.name ??
                                                                    "this member",
                                                            })
                                                        }
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                        <p className="font-medium">
                                                            Remove from board
                                                        </p>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : canManageMembers &&
                                            member.role !== "owner" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-destructive hover:text-destructive shrink-0"
                                                onClick={() =>
                                                    setRemovingMember({
                                                        userId: member.userId,
                                                        name:
                                                            member.user?.name ??
                                                            "this member",
                                                    })
                                                }
                                            >
                                                <UserMinus className="h-3 w-3 mr-1" />
                                                Remove
                                            </Button>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="gap-1 shrink-0"
                                            >
                                                <RoleIcon
                                                    className={`h-3 w-3 ${role.color}`}
                                                />
                                                {role.label}
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

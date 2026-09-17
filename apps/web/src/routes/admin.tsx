import { api } from "@BetterTodo/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Shield, Trash2, UserCog, Users, ChevronLeft, Crown, User, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <ProtectedRoute>
            <AdminPageContent />
        </ProtectedRoute>
    );
}

function AdminPageContent() {
    const currentRole = useQuery(api.auth.getMyRole);
    const navigate = useNavigate();

    // Redirect non-admins away
    useEffect(() => {
        if (currentRole === "user") {
            navigate({ to: "/dashboard" });
        }
    }, [currentRole, navigate]);

    if (currentRole === undefined) {
        return (
            <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (currentRole !== "admin") return null;

    return <AdminPanel />;
}

function AdminPanel() {
    const users = useQuery(api.auth.listUsersForAdmin);
    const setRole = useMutation(api.auth.setUserRole);
    const deleteUser = useMutation(api.auth.deleteUserAndAllData);
    const currentUser = useQuery(api.auth.getCurrentUser);

    const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
    const [pendingRoleChange, setPendingRoleChange] = useState<{
        userId: string;
        name: string | null;
        email: string | null;
        nextRole: "admin" | "user";
    } | null>(null);
    const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

    const isLoading = users === undefined || users === null;
    const selectedForDelete = (users ?? []).find((u) => u.userId === pendingDeleteUserId) ?? null;

    const adminCount = (users ?? []).filter((u) => u.role === "admin").length;
    const userCount = (users ?? []).filter((u) => u.role === "user").length;

    const handleToggleRole = async (userId: string, nextRole: "admin" | "user") => {
        setIsUpdatingRole(userId);
        try {
            await setRole({ userId, role: nextRole });
            toast.success(`Role updated to ${nextRole}`);
            setPendingRoleChange(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to update role");
        } finally {
            setIsUpdatingRole(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!pendingDeleteUserId) return;
        setIsDeletingUser(pendingDeleteUserId);
        try {
            await deleteUser({ userId: pendingDeleteUserId });
            toast.success("User and all associated data deleted");
            setPendingDeleteUserId(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete user");
        } finally {
            setIsDeletingUser(null);
        }
    };

    return (
        <div className="min-h-[calc(100vh-3rem)] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Dashboard
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Admin Panel
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage user accounts and administrative roles
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant="outline" className="text-xs font-normal gap-1.5 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Total: {isLoading ? "…" : (users?.length ?? 0)}</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-normal gap-1.5 px-2.5 py-1">
                        <Crown className="h-3.5 w-3.5 text-primary" />
                        <span>Admins: {isLoading ? "…" : adminCount}</span>
                    </Badge>
                </div>
            </div>

            {/* Users List Card */}
            <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Users ({isLoading ? "…" : (users?.length ?? 0)})
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        {userCount} standard · {adminCount} admin
                    </p>
                </div>

                <div className="divide-y divide-border/60">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 sm:p-5">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-7 w-16 rounded-full" />
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </div>
                            </div>
                        ))
                    ) : (users ?? []).length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        (users ?? []).map((user) => {
                            const isSelf = currentUser?._id === user.userId;
                            const isAdmin = user.role === "admin";
                            const initials = user.name
                                ? user.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()
                                : (user.email?.[0]?.toUpperCase() ?? "U");

                            return (
                                <div
                                    key={user.userId}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-muted/15 transition-colors"
                                >
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                                            <AvatarImage
                                                src={user.image ?? undefined}
                                                alt={user.name ?? "User"}
                                            />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate leading-tight">
                                                    {user.name || "Unnamed User"}
                                                </p>
                                                {isSelf && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                                                    >
                                                        You
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.email || user.userId}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 ml-12 sm:ml-0">
                                        <Badge
                                            variant={isAdmin ? "default" : "secondary"}
                                            className={cn(
                                                "gap-1 text-xs",
                                                isAdmin &&
                                                    "bg-primary/15 text-primary border-primary/20 hover:bg-primary/20",
                                            )}
                                        >
                                            {isAdmin ? (
                                                <Crown className="h-3 w-3" />
                                            ) : (
                                                <User className="h-3 w-3" />
                                            )}
                                            {user.role}
                                        </Badge>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                currentUser === undefined ||
                                                isUpdatingRole === user.userId ||
                                                isDeletingUser === user.userId ||
                                                isSelf
                                            }
                                            onClick={() =>
                                                setPendingRoleChange({
                                                    userId: user.userId,
                                                    name: user.name,
                                                    email: user.email,
                                                    nextRole: isAdmin ? "user" : "admin",
                                                })
                                            }
                                            className="gap-1.5 h-8 text-xs"
                                        >
                                            {isUpdatingRole === user.userId ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <UserCog className="h-3.5 w-3.5" />
                                            )}
                                            {isAdmin ? "Demote" : "Promote"}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={
                                                currentUser === undefined ||
                                                isUpdatingRole === user.userId ||
                                                isDeletingUser === user.userId ||
                                                isSelf
                                            }
                                            onClick={() => setPendingDeleteUserId(user.userId)}
                                            className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            {isDeletingUser === user.userId ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Delete User Modal */}
            <DeleteConfirmationDialog
                open={pendingDeleteUserId !== null}
                onOpenChange={(open) => !open && setPendingDeleteUserId(null)}
                title="Delete user and all their data?"
                description={`This permanently removes ${selectedForDelete?.email ?? selectedForDelete?.userId ?? "this user"} and all their boards, cards, and other data. This cannot be undone.`}
                confirmText="Delete permanently"
                isLoading={isDeletingUser !== null}
                onConfirm={handleDeleteUser}
            />

            {/* Promote / Demote User Confirmation Modal */}
            <AlertDialog
                open={pendingRoleChange !== null}
                onOpenChange={(open) => !open && setPendingRoleChange(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingRoleChange?.nextRole === "admin"
                                ? "Promote user to Admin?"
                                : "Demote admin to regular User?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingRoleChange?.nextRole === "admin"
                                ? `Are you sure you want to promote ${pendingRoleChange.name || pendingRoleChange.email || "this user"} to Admin? They will have full administrative privileges to manage all users, roles, and settings.`
                                : `Are you sure you want to demote ${pendingRoleChange?.name || pendingRoleChange?.email || "this user"} to a regular User? They will lose access to the admin dashboard and user management capabilities.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdatingRole !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (pendingRoleChange) {
                                    handleToggleRole(
                                        pendingRoleChange.userId,
                                        pendingRoleChange.nextRole,
                                    );
                                }
                            }}
                            disabled={isUpdatingRole !== null}
                            className={cn(
                                "gap-1.5",
                                pendingRoleChange?.nextRole === "user"
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                        >
                            {isUpdatingRole !== null && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <span>
                                {pendingRoleChange?.nextRole === "admin"
                                    ? "Promote to Admin"
                                    : "Demote to User"}
                            </span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

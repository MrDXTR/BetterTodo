import { api } from "@BetterTodo/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { Shield, Trash2, UserCog, Users, ChevronLeft, Crown, User, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <>
            <Authenticated>
                <AdminPageContent />
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
            toast.success("User and all their data deleted");
            setPendingDeleteUserId(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete user");
        } finally {
            setIsDeletingUser(null);
        }
    };

    return (
        <div className="min-h-[calc(100vh-3rem)] bg-muted/30">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage user roles and accounts
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Crown className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{isLoading ? "—" : adminCount}</p>
                            <p className="text-xs text-muted-foreground">Admins</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{isLoading ? "—" : userCount}</p>
                            <p className="text-xs text-muted-foreground">Members</p>
                        </div>
                    </div>
                </div>

                {/* User list */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h2 className="font-semibold text-sm">All Users</h2>
                    </div>

                    {isLoading ? (
                        <div className="divide-y">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-4">
                                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-7 w-16 rounded-full" />
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : !users || users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                No other users found yet.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {users.map((user) => {
                                const isSelf = currentUser?._id === user.userId;
                                const isAdmin = user.role === "admin";
                                const initials = (user.name ?? user.email ?? "?")
                                    .split(" ")
                                    .map((p) => p[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2);

                                return (
                                    <div
                                        key={user.userId}
                                        className={cn(
                                            "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                                            isSelf && "bg-muted/40",
                                        )}
                                    >
                                        {/* Avatar + info */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-9 w-9 shrink-0">
                                                {user.image && <AvatarImage src={user.image} />}
                                                <AvatarFallback className="text-xs font-medium">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">
                                                        {user.name ?? "Unnamed user"}
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
                                                    {user.email ?? user.userId}
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
                                                    isUpdatingRole === user.userId ||
                                                    isDeletingUser === user.userId ||
                                                    isSelf
                                                }
                                                onClick={() =>
                                                    handleToggleRole(
                                                        user.userId,
                                                        isAdmin ? "user" : "admin",
                                                    )
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
                            })}
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationDialog
                open={pendingDeleteUserId !== null}
                onOpenChange={(open) => !open && setPendingDeleteUserId(null)}
                onConfirm={handleDeleteUser}
                title="Delete user and all their data?"
                description={`This permanently removes ${selectedForDelete?.email ?? selectedForDelete?.userId ?? "this user"} and all their boards, cards, and other data. This cannot be undone.`}
                confirmText="Delete permanently"
            />
        </div>
    );
}

function RedirectToSignIn() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate({ to: "/sign-in" });
    }, [navigate]);
    return null;
}

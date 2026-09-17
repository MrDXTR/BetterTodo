import { api } from "@BetterTodo/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { Kanban, Shield, User, Eye, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/invite/$token")({
    component: InvitePage,
});

function InvitePage() {
    const { token } = Route.useParams();
    const inviteInfo = useQuery(api.boards.getInviteInfo, { token });

    return (
        <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-4 bg-muted/20">
            <div className="w-full max-w-md">
                {inviteInfo === undefined ? (
                    <Card className="border-border/70 bg-card shadow-lg p-6 flex flex-col items-center justify-center text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                        <p className="text-sm text-muted-foreground">Checking invite details…</p>
                    </Card>
                ) : inviteInfo === null ? (
                    <Card className="border-border/70 bg-card shadow-lg text-center p-6 space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <Shield className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg font-bold">Invite Not Found</CardTitle>
                        <CardDescription>
                            This invite link is invalid, has expired, or has already been used.
                        </CardDescription>
                        <div className="pt-2">
                            <Link to="/dashboard">
                                <Button variant="outline" size="sm" className="text-xs">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <>
                        <Authenticated>
                            <AutoAcceptInvite token={token} inviteInfo={inviteInfo} />
                        </Authenticated>
                        <Unauthenticated>
                            <InvitePreview token={token} inviteInfo={inviteInfo} />
                        </Unauthenticated>
                        <AuthLoading>
                            <Card className="border-border/70 bg-card shadow-lg p-6 flex flex-col items-center justify-center text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Loading your account…
                                </p>
                            </Card>
                        </AuthLoading>
                    </>
                )}
            </div>
        </div>
    );
}

function AutoAcceptInvite({ token, inviteInfo }: { token: string; inviteInfo: any }) {
    const navigate = useNavigate();
    const acceptInviteByToken = useMutation(api.boards.acceptInviteByToken);
    const [status, setStatus] = useState<"accepting" | "success" | "error">("accepting");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const accept = async () => {
            try {
                const res = await acceptInviteByToken({ token });
                if (!isMounted) return;
                setStatus("success");
                toast.success(`Joined "${inviteInfo.boardTitle}"!`);
                setTimeout(() => {
                    navigate({ to: "/boards/$boardId", params: { boardId: res.boardId } });
                }, 700);
            } catch (err: any) {
                if (!isMounted) return;
                setStatus("error");
                setErrorMessage(err?.message || "Failed to join board");
            }
        };
        accept();
        return () => {
            isMounted = false;
        };
    }, [token, acceptInviteByToken, inviteInfo.boardTitle, navigate]);

    if (status === "error") {
        return (
            <Card className="border-border/70 bg-card shadow-lg text-center p-6 space-y-4">
                <CardTitle className="text-lg font-bold text-destructive">Could Not Join</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
                <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="text-xs">
                        Go to Dashboard
                    </Button>
                </Link>
            </Card>
        );
    }

    return (
        <Card className="border-border/70 bg-card shadow-lg p-8 flex flex-col items-center justify-center text-center space-y-3">
            {status === "success" ? (
                <>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-sm">Joined board!</p>
                    <p className="text-xs text-muted-foreground">Redirecting to board…</p>
                </>
            ) : (
                <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-semibold text-sm">
                        Accepting invite to "{inviteInfo.boardTitle}"…
                    </p>
                    <p className="text-xs text-muted-foreground">Please wait a moment.</p>
                </>
            )}
        </Card>
    );
}

function InvitePreview({ token, inviteInfo }: { token: string; inviteInfo: any }) {
    const roleIcon =
        {
            admin: Shield,
            member: User,
            viewer: Eye,
        }[inviteInfo.role as "admin" | "member" | "viewer"] ?? User;
    const RoleIcon = roleIcon;

    return (
        <Card className="border-border/70 bg-card shadow-xl overflow-hidden">
            {/* Top Color Banner */}
            <div
                className="h-3 w-full"
                style={{ backgroundColor: inviteInfo.boardColor || "#0079BF" }}
            />
            <CardHeader className="text-center pt-6 pb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-muted/50 mb-3 shadow-xs">
                    <Kanban className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">
                    {inviteInfo.boardTitle}
                </CardTitle>
                <CardDescription className="text-xs max-w-sm mx-auto mt-1">
                    <strong className="font-medium text-foreground">
                        {inviteInfo.inviterName}
                    </strong>{" "}
                    invited you to collaborate on this board.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
                {inviteInfo.boardDescription && (
                    <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground line-clamp-3">
                        {inviteInfo.boardDescription}
                    </div>
                )}

                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="text-muted-foreground">Your Role</span>
                    <Badge variant="secondary" className="gap-1 capitalize text-xs">
                        <RoleIcon className="h-3 w-3" />
                        <span>{inviteInfo.role}</span>
                    </Badge>
                </div>

                <div className="pt-2 space-y-2">
                    <Link to="/sign-in" search={{ inviteToken: token }} className="w-full block">
                        <Button className="w-full gap-2 h-9 text-xs">
                            <span>Sign in or Sign up to Join</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <p className="text-[11px] text-center text-muted-foreground">
                        Signing in with Google or email will immediately add you to the board.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

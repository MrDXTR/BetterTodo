import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "@BetterTodo/backend/convex/_generated/api";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { getSafeRedirectUrl } from "@/lib/auth-utils";

// Parse search params
const signInSearchSchema = z.object({
    inviteToken: z.string().optional(),
    redirect: z.string().optional(),
    mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/sign-in")({
    validateSearch: signInSearchSchema,
    component: SignInPage,
});

function SignInPage() {
    const { inviteToken, redirect, mode } = Route.useSearch();
    const [showSignIn, setShowSignIn] = useState(mode !== "signup");

    useEffect(() => {
        if (mode === "signup") {
            setShowSignIn(false);
        } else if (mode === "signin") {
            setShowSignIn(true);
        }
    }, [mode]);

    return (
        <>
            <Authenticated>
                <HandleInviteAndRedirect inviteToken={inviteToken} redirect={redirect} />
            </Authenticated>
            <AuthLoading>
                <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </AuthLoading>
            <Unauthenticated>
                <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md">
                        <div className="mb-6 text-center">
                            <Link
                                to="/"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                ← Back to home
                            </Link>
                        </div>
                        {inviteToken && (
                            <div className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-400">
                                🔗 You have a board invitation waiting. Sign in or create an account
                                to accept it.
                            </div>
                        )}
                        {showSignIn ? (
                            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
                        ) : (
                            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
                        )}
                    </div>
                </div>
            </Unauthenticated>
        </>
    );
}

/**
 * When the user is already authenticated (or just signed in/up),
 * check for an inviteToken and auto-accept it, or redirect to requested path / dashboard.
 */
function HandleInviteAndRedirect({
    inviteToken,
    redirect,
}: {
    inviteToken?: string;
    redirect?: string;
}) {
    const navigate = useNavigate();
    const acceptInviteByToken = useMutation(api.boards.acceptInviteByToken);
    const [attempted, setAttempted] = useState(false);

    useEffect(() => {
        if (attempted) return;
        setAttempted(true);

        const run = async () => {
            if (inviteToken) {
                try {
                    const result = await acceptInviteByToken({ token: inviteToken });
                    // Redirect to the board that was accepted
                    navigate({
                        to: "/boards/$boardId",
                        params: { boardId: result.boardId },
                        replace: true,
                    });
                    return;
                } catch (err) {
                    console.warn("Failed to accept invite by token:", err);
                    // Fall through to redirect or dashboard on error
                }
            }

            const safeRedirect = getSafeRedirectUrl(redirect);
            if (safeRedirect) {
                window.location.replace(safeRedirect);
                return;
            }

            navigate({ to: "/dashboard", replace: true });
        };

        run();
    }, [inviteToken, redirect, attempted, acceptInviteByToken, navigate]);

    return (
        <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                {inviteToken ? (
                    <p className="text-sm text-muted-foreground">Accepting invitation…</p>
                ) : (
                    <p className="text-sm text-muted-foreground">Redirecting…</p>
                )}
            </div>
        </div>
    );
}

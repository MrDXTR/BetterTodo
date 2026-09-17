import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowLeft, KanbanSquare, LayoutDashboard } from "lucide-react";
import { useEffect, useRef } from "react";

import { BoardView } from "@/components/Board/BoardView";
import { BoardSkeleton } from "@/components/Board/BoardSkeleton";
import { Button } from "@/components/ui/button";
import { getSafeRedirectUrl } from "@/lib/auth-utils";

export const Route = createFileRoute("/boards/$boardId")({
    component: BoardRoute,
});

function BoardRoute() {
    const { boardId } = Route.useParams();
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const navigate = useNavigate();
    const router = useRouterState();
    const isRedirectingRef = useRef(false);

    // Convex queries accept boardId as Id<"boards">
    const board = useQuery(
        api.boards.getById,
        boardId ? { boardId: boardId as Id<"boards"> } : "skip",
    );

    useEffect(() => {
        // If auth finished loading and user is not authenticated, and board couldn't be loaded (private or requires auth)
        if (!isAuthLoading && !isAuthenticated && board === null) {
            if (isRedirectingRef.current) return;

            const pathname = router.location.pathname;
            if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
                return;
            }

            isRedirectingRef.current = true;
            const search = router.location.searchStr;
            const fullPath = search ? `${pathname}${search}` : pathname;
            const safeRedirect = getSafeRedirectUrl(fullPath);

            navigate({
                to: "/sign-in",
                search: safeRedirect ? { redirect: safeRedirect } : {},
                replace: true,
            });
        }
    }, [
        isAuthLoading,
        isAuthenticated,
        board,
        navigate,
        router.location.pathname,
        router.location.searchStr,
    ]);

    if (board === undefined || isAuthLoading) {
        return (
            <div className="flex h-full flex-col overflow-hidden bg-background">
                <div className="h-12 shrink-0 border-b bg-muted/30" />
                <BoardSkeleton />
            </div>
        );
    }

    if (board === null) {
        if (!isAuthenticated) {
            return (
                <div className="flex h-[calc(100vh-3.25rem)] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-xs text-muted-foreground">Redirecting to sign in...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex min-h-[calc(100vh-3.25rem)] w-full flex-col items-center justify-center p-4 sm:p-6 bg-background">
                <div className="mx-auto flex max-w-md flex-col items-center text-center">
                    <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border/80 bg-muted/50 shadow-xs">
                        <KanbanSquare className="h-10 w-10 text-muted-foreground" />
                        <span className="absolute -top-2 -right-2 rounded-full border border-border/80 bg-background px-2 py-0.5 text-[11px] font-bold font-mono text-primary shadow-xs">
                            404
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Board not found
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
                        This board doesn't exist, has been deleted, or you don't have permission to
                        view it.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 w-full">
                        <Link to="/boards" className="w-full sm:w-auto">
                            <Button
                                variant="default"
                                className="w-full sm:w-auto gap-2 text-xs h-9"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Boards
                            </Button>
                        </Link>
                        <Link to="/dashboard" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto gap-2 text-xs h-9"
                            >
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Go to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <BoardView board={board} />;
}

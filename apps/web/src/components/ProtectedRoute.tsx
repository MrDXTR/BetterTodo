import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { getSafeRedirectUrl } from "@/lib/auth-utils";

function RedirectToSignIn() {
    const navigate = useNavigate();
    const router = useRouterState();
    const isRedirectingRef = useRef(false);

    useEffect(() => {
        if (isRedirectingRef.current) return;

        const pathname = router.location.pathname;
        // Never redirect if already on an auth route or transitioning to one
        if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
            return;
        }

        const search = router.location.searchStr;
        const fullPath = search ? `${pathname}${search}` : pathname;
        const safeRedirect = getSafeRedirectUrl(fullPath);

        isRedirectingRef.current = true;

        navigate({
            to: "/sign-in",
            search: safeRedirect ? { redirect: safeRedirect } : {},
            replace: true,
        });
    }, [navigate, router.location.pathname, router.location.searchStr]);

    return null;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Authenticated>{children}</Authenticated>
            <Unauthenticated>
                <RedirectToSignIn />
            </Unauthenticated>
            <AuthLoading>
                <div className="flex h-[calc(100vh-3.25rem)] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Checking authentication...</p>
                    </div>
                </div>
            </AuthLoading>
        </>
    );
}

export default ProtectedRoute;

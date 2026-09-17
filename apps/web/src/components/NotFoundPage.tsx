import { Link } from "@tanstack/react-router";
import { ArrowLeft, Compass, Home, KanbanSquare, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
    return (
        <div className="flex min-h-[calc(100vh-3.25rem)] w-full flex-col items-center justify-center p-4 sm:p-6 bg-background">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                {/* Visual Icon Badge */}
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border/80 bg-muted/50 shadow-xs">
                    <Compass className="h-10 w-10 text-primary animate-pulse" />
                    <span className="absolute -top-2 -right-2 rounded-full border border-border/80 bg-background px-2 py-0.5 text-[11px] font-bold font-mono text-primary shadow-xs">
                        404
                    </span>
                </div>

                {/* Title and message */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Page not found
                </h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
                    The page you are looking for doesn't exist, has been removed, or is temporarily
                    unavailable.
                </p>

                {/* Action buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 w-full">
                    <Link to="/" className="w-full sm:w-auto">
                        <Button variant="default" className="w-full sm:w-auto gap-2 text-xs h-9">
                            <Home className="h-3.5 w-3.5" />
                            Home
                        </Button>
                    </Link>
                    <Link to="/dashboard" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs h-9">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link to="/boards" className="w-full sm:w-auto">
                        <Button variant="ghost" className="w-full sm:w-auto gap-2 text-xs h-9">
                            <KanbanSquare className="h-3.5 w-3.5" />
                            Boards
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;

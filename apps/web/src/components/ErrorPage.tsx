import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
    error?: unknown;
    reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
    const router = useRouter();
    const [showDetails, setShowDetails] = useState(false);

    const errorMessage =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "An unexpected error occurred while loading this page.";

    const handleRetry = () => {
        if (reset) {
            reset();
        } else {
            router.invalidate();
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-3.25rem)] w-full flex-col items-center justify-center p-4 sm:p-6 bg-background">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                {/* Warning Icon Badge */}
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/10 text-destructive shadow-xs">
                    <AlertTriangle className="h-10 w-10" />
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Something went wrong
                </h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
                    We encountered an unexpected error while loading this page. You can try
                    refreshing or returning to the home screen.
                </p>

                {/* Action buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 w-full">
                    <Button
                        variant="default"
                        onClick={handleRetry}
                        className="w-full sm:w-auto gap-2 text-xs h-9 cursor-pointer"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Try again
                    </Button>
                    <Link to="/" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs h-9">
                            <Home className="h-3.5 w-3.5" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Optional Collapsible Technical Details */}
                {errorMessage && (
                    <div className="mt-6 w-full text-left">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
                        >
                            {showDetails ? "Hide error details" : "Show technical details"}
                        </button>
                        {showDetails && (
                            <pre className="mt-2.5 max-h-40 overflow-auto rounded-lg border border-border bg-muted/60 p-3 text-[11px] font-mono text-muted-foreground break-words whitespace-pre-wrap text-left">
                                {errorMessage}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ErrorPage;

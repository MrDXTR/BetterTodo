import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
    return (
        <div className="bg-card rounded-lg p-3 shadow-sm">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    );
}

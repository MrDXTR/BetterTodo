import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
    return (
        <div className="h-full overflow-x-auto p-6">
            <div className="flex gap-4 h-full">
                {/* List Skeleton 1 */}
                <div className="flex-shrink-0 w-72 bg-card rounded-lg p-3">
                    <Skeleton className="h-8 w-32 mb-3" />
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full rounded" />
                        <Skeleton className="h-16 w-full rounded" />
                        <Skeleton className="h-24 w-full rounded" />
                    </div>
                </div>

                {/* List Skeleton 2 */}
                <div className="flex-shrink-0 w-72 bg-card rounded-lg p-3">
                    <Skeleton className="h-8 w-40 mb-3" />
                    <div className="space-y-2">
                        <Skeleton className="h-18 w-full rounded" />
                        <Skeleton className="h-22 w-full rounded" />
                    </div>
                </div>

                {/* List Skeleton 3 */}
                <div className="flex-shrink-0 w-72 bg-card rounded-lg p-3">
                    <Skeleton className="h-8 w-36 mb-3" />
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full rounded" />
                        <Skeleton className="h-16 w-full rounded" />
                        <Skeleton className="h-20 w-full rounded" />
                        <Skeleton className="h-18 w-full rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}

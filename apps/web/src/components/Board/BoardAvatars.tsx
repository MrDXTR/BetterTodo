import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface BoardAvatarsProps {
    users: Array<{
        _id: Id<"presence">;
        userId: string;
        user: {
            name: string | null;
            image?: string | null;
        };
    }>;
}

export function BoardAvatars({ users }: BoardAvatarsProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className="flex -space-x-2 mr-2">
            <TooltipProvider delayDuration={300}>
                {users.slice(0, 4).map((user) => (
                    <Tooltip key={user._id}>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-primary/20 transition-transform hover:z-10 hover:scale-110">
                                    <AvatarImage src={user.user.image || undefined} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                        {user.user.name?.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold">{user.user.name}</p>
                            <p className="text-xs text-muted-foreground">Active now</p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {users.length > 4 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs font-medium ring-2 ring-primary/20">
                        +{users.length - 4}
                    </div>
                )}
            </TooltipProvider>
        </div>
    );
}

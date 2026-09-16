import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BoardMember {
    _id: Id<"boardMembers">;
    userId: string;
    role: string;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    } | null;
}

interface BoardAvatarsProps {
    users: BoardMember[];
}

export function BoardAvatars({ users }: BoardAvatarsProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className="flex -space-x-1.5 mr-1 items-center">
            <TooltipProvider delayDuration={200}>
                {users.slice(0, 4).map((member) => (
                    <Tooltip key={member._id}>
                        <TooltipTrigger asChild>
                            <div className="relative cursor-pointer transition-transform duration-150 hover:z-10 hover:scale-105">
                                <Avatar className="h-6 w-6 ring-2 ring-background shrink-0">
                                    <AvatarImage src={member.user?.image || undefined} />
                                    <AvatarFallback className="text-[10px] bg-muted font-medium text-foreground">
                                        {member.user?.name?.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={4} className="text-xs">
                            <p className="font-medium">{member.user?.name || "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                                {member.role}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {users.length > 4 && (
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted ring-2 ring-background text-[10px] font-medium text-muted-foreground shrink-0">
                        +{users.length - 4}
                    </div>
                )}
            </TooltipProvider>
        </div>
    );
}

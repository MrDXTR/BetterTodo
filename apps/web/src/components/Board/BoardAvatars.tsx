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
        <div className="flex -space-x-2 mr-2">
            <TooltipProvider delayDuration={300}>
                {users.slice(0, 4).map((member) => (
                    <Tooltip key={member._id}>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-primary/20 transition-transform hover:z-10 hover:scale-110">
                                    <AvatarImage src={member.user?.image || undefined} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                        {member.user?.name?.charAt(0).toUpperCase() || "?"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold">{member.user?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {member.role}
                            </p>
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

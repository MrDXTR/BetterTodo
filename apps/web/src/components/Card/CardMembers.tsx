import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Users, Check, UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface CardMembersProps {
    cardId: Id<"cards">;
    boardId: Id<"boards">;
}

export function CardMembers({ cardId, boardId }: CardMembersProps) {
    const card = useQuery(api.cards.getById, { cardId });
    const boardMembers = useQuery(api.boards.getMembers, { boardId });
    const cardAssignments = useQuery(api.cards.getAssignments, { cardId });
    const assignMember = useMutation(api.cards.assignUser);
    const unassignMember = useMutation(api.cards.unassignUser);

    const [searchQuery, setSearchQuery] = useState("");
    const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

    if (!card || !boardMembers || !cardAssignments) return null;

    const assignedUserIds = cardAssignments.map((a: any) => a.userId);

    const handleToggleMember = async (userId: string) => {
        setTogglingUserId(userId);
        try {
            if (assignedUserIds.includes(userId)) {
                await unassignMember({ cardId, userId });
                toast.success("Member unassigned");
            } else {
                await assignMember({ cardId, userId });
                toast.success("Member assigned");
            }
        } catch (error) {
            console.error("Error toggling member assignment:", error);
            toast.error("Failed to update assignment");
        } finally {
            setTogglingUserId(null);
        }
    };

    const filteredMembers = boardMembers.filter(
        (member: any) =>
            member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {/* Display assigned members */}
            {cardAssignments.length > 0 && (
                <TooltipProvider delayDuration={200}>
                    <div className="flex -space-x-1.5">
                        {cardAssignments.slice(0, 4).map((assignment: any) => {
                            const boardMember = boardMembers.find(
                                (m: any) => m.userId === assignment.userId,
                            );
                            const user = assignment.user || boardMember?.user;
                            const displayName = user?.name || user?.email || "Member";
                            const initial = displayName.trim().charAt(0).toUpperCase() || "M";

                            return (
                                <Tooltip key={assignment.userId}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-6 w-6 ring-2 ring-background shrink-0 cursor-default">
                                            <AvatarImage src={user?.image} alt={displayName} />
                                            <AvatarFallback className="text-[10px] font-medium bg-muted">
                                                {initial}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs py-1 px-2">
                                        {displayName}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                        {cardAssignments.length > 4 && (
                            <div className="h-6 w-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                    +{cardAssignments.length - 4}
                                </span>
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            )}

            {/* Add member button */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="xs"
                        disabled={!!togglingUserId}
                        className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                    >
                        {togglingUserId ? (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : (
                            <UserPlus className="w-3 h-3" />
                        )}
                        <span>{cardAssignments.length > 0 ? "Assign" : "Assignee"}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-foreground">
                                Assign Members
                            </h4>
                        </div>

                        {/* Search */}
                        <Input
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-7 text-xs bg-muted/30"
                        />

                        {/* Member list */}
                        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                            {filteredMembers.map((member: any) => {
                                const isAssigned = assignedUserIds.includes(member.userId);
                                const isToggling = togglingUserId === member.userId;
                                const displayName =
                                    member.user?.name || member.user?.email || "Unknown";
                                const initial = displayName.trim().charAt(0).toUpperCase() || "M";

                                return (
                                    <button
                                        type="button"
                                        key={member.userId}
                                        disabled={isToggling}
                                        onClick={() => handleToggleMember(member.userId)}
                                        className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/70 transition-colors cursor-pointer text-left disabled:opacity-60"
                                    >
                                        <Avatar className="h-6 w-6 shrink-0">
                                            <AvatarImage src={member.user?.image} />
                                            <AvatarFallback className="text-[10px]">
                                                {initial}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                                {displayName}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground capitalize">
                                                {member.role}
                                            </p>
                                        </div>
                                        {isToggling ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                                        ) : (
                                            isAssigned && (
                                                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                            )
                                        )}
                                    </button>
                                );
                            })}
                            {filteredMembers.length === 0 && (
                                <p className="text-[11px] text-muted-foreground px-2 py-1.5 text-center">
                                    No members found.
                                </p>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

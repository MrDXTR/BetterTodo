import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Users, X, Plus, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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

    if (!card || !boardMembers || !cardAssignments) return null;

    const assignedUserIds = cardAssignments.map((a: any) => a.userId);

    const handleToggleMember = async (userId: string) => {
        if (assignedUserIds.includes(userId)) {
            await unassignMember({ cardId, userId });
        } else {
            await assignMember({ cardId, userId });
        }
    };

    const filteredMembers = boardMembers.filter(
        (member: any) =>
            member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="flex items-center gap-2">
            {/* Display assigned members */}
            {cardAssignments.length > 0 && (
                <div className="flex -space-x-2">
                    {cardAssignments.slice(0, 3).map((assignment: any) => (
                        <Avatar
                            key={assignment.userId}
                            className="w-8 h-8 border-2 border-background"
                        >
                            <AvatarImage src={assignment.user?.image} />
                            <AvatarFallback className="text-xs">
                                {assignment.user?.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                    {cardAssignments.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-medium">
                                +{cardAssignments.length - 3}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Add member button */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                        <Plus className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Members</h4>
                        </div>

                        {/* Search */}
                        <Input
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 text-sm"
                        />

                        {/* Member list */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {filteredMembers.map((member: any) => (
                                <button
                                    key={member.userId}
                                    onClick={() => handleToggleMember(member.userId)}
                                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                                >
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={member.user?.image} />
                                        <AvatarFallback className="text-xs">
                                            {member.user?.name?.charAt(0).toUpperCase() || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">
                                            {member.user?.name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.role}
                                        </p>
                                    </div>
                                    {assignedUserIds.includes(member.userId) && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                            {filteredMembers.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No members found
                                </p>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

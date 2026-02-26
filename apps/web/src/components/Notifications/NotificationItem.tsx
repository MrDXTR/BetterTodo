import { formatDistanceToNow } from "date-fns";
import {
    Bell,
    MessageSquare,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    X,
    Check,
    XCircle,
    Loader2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface NotificationItemProps {
    notification: {
        _id: Id<"notifications">;
        type: string;
        title: string;
        message: string;
        linkUrl?: string;
        read: boolean;
        createdAt: number;
    };
    onNavigate?: () => void;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
    mention: MessageSquare,
    assignment: UserPlus,
    due_date: AlertCircle,
    comment: MessageSquare,
    completed: CheckCircle2,
    board_invite: UserPlus,
    default: Bell,
};

export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
    const markAsRead = useMutation(api.notifications.markAsRead);
    const deleteNotification = useMutation(api.notifications.deleteNotification);
    const acceptInvite = useMutation(api.boards.acceptInvite);
    const declineInvite = useMutation(api.boards.declineInvite);

    const pendingInvites = useQuery(
        api.boards.getPendingInvites,
        notification.type === "board_invite" ? {} : "skip",
    );

    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;

    // Extract boardId from linkUrl (format: /boards/{boardId})
    const boardIdFromLink = notification.linkUrl?.split("/boards/")[1];

    // Find matching invite for this notification
    const matchingInvite = pendingInvites?.find(
        (invite) => String(invite.boardId) === boardIdFromLink,
    );

    const isBoardInvite = notification.type === "board_invite";

    const handleClick = async () => {
        // Don't navigate if this is a board invite (they should use the buttons)
        if (isBoardInvite) return;

        if (!notification.read) {
            await markAsRead({ notificationId: notification._id });
        }
        if (notification.linkUrl && onNavigate) {
            onNavigate();
            window.location.href = notification.linkUrl;
        }
    };

    const handleAccept = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!matchingInvite) return;

        setIsAccepting(true);
        try {
            await acceptInvite({ inviteId: matchingInvite._id });
            await markAsRead({ notificationId: notification._id });
            toast.success(`Joined "${matchingInvite.boardTitle}"!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to accept invite");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!matchingInvite) return;

        setIsDeclining(true);
        try {
            await declineInvite({ inviteId: matchingInvite._id });
            await deleteNotification({ notificationId: notification._id });
            toast.success("Invite declined");
        } catch (error: any) {
            toast.error(error.message || "Failed to decline invite");
        } finally {
            setIsDeclining(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification({ notificationId: notification._id });
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative flex gap-3 p-3 rounded-lg transition-colors border",
                isBoardInvite ? "cursor-default" : "cursor-pointer",
                notification.read
                    ? "bg-background hover:bg-muted/50 border-transparent"
                    : "bg-primary/5 hover:bg-primary/10 border-primary/20",
            )}
        >
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    notification.read ? "bg-muted" : "bg-primary/10",
                )}
            >
                <Icon
                    className={cn(
                        "h-4 w-4",
                        notification.read ? "text-muted-foreground" : "text-primary",
                    )}
                />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={cn(
                            "text-sm font-medium leading-tight",
                            !notification.read && "font-semibold",
                        )}
                    >
                        {notification.title}
                    </p>
                    {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>

                {/* Accept/Decline buttons for board invites */}
                {isBoardInvite && matchingInvite && (
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={handleAccept}
                            disabled={isAccepting || isDeclining}
                        >
                            {isAccepting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Check className="h-3 w-3" />
                            )}
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={handleDecline}
                            disabled={isAccepting || isDeclining}
                        >
                            {isDeclining ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <XCircle className="h-3 w-3" />
                            )}
                            Decline
                        </Button>
                    </div>
                )}

                {/* Show "responded" state if invite was already handled */}
                {isBoardInvite && !matchingInvite && pendingInvites !== undefined && (
                    <p className="text-xs text-muted-foreground italic pt-1">
                        Invite already responded to
                    </p>
                )}

                <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </p>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                onClick={handleDelete}
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

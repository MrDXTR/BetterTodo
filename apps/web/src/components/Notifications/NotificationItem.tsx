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
                "group relative flex gap-2.5 p-2.5 rounded-lg transition-colors border text-xs",
                isBoardInvite ? "cursor-default" : "cursor-pointer",
                notification.read
                    ? "bg-transparent hover:bg-muted/40 border-transparent"
                    : "bg-primary/5 hover:bg-primary/10 border-primary/20",
            )}
        >
            <div
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                    notification.read
                        ? "bg-muted/50 ring-border/50"
                        : "bg-primary/10 ring-primary/20",
                )}
            >
                <Icon
                    className={cn(
                        "h-3.5 w-3.5",
                        notification.read ? "text-muted-foreground" : "text-primary",
                    )}
                />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={cn(
                            "text-xs leading-snug truncate",
                            notification.read
                                ? "text-foreground/90 font-medium"
                                : "text-foreground font-semibold",
                        )}
                    >
                        {notification.title}
                    </p>
                    {!notification.read && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.message}
                </p>

                {/* Accept/Decline buttons for board invites */}
                {isBoardInvite && matchingInvite && (
                    <div className="flex items-center gap-1.5 pt-1">
                        <Button
                            size="xs"
                            className="h-6 text-[11px] px-2 gap-1"
                            onClick={handleAccept}
                            disabled={isAccepting || isDeclining}
                        >
                            {isAccepting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Check className="h-3 w-3" />
                            )}
                            <span>Accept</span>
                        </Button>
                        <Button
                            size="xs"
                            variant="outline"
                            className="h-6 text-[11px] px-2 gap-1"
                            onClick={handleDecline}
                            disabled={isAccepting || isDeclining}
                        >
                            {isDeclining ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <XCircle className="h-3 w-3" />
                            )}
                            <span>Decline</span>
                        </Button>
                    </div>
                )}

                {/* Show "responded" state if invite was already handled */}
                {isBoardInvite && !matchingInvite && pendingInvites !== undefined && (
                    <p className="text-[10px] text-muted-foreground italic pt-0.5">
                        Invite already responded to
                    </p>
                )}

                <p className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </p>
            </div>

            <Button
                variant="ghost"
                size="icon-xs"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 max-sm:opacity-70 transition-opacity absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={handleDelete}
                title="Dismiss"
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

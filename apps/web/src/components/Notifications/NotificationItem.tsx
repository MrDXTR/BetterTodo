import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, UserPlus, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const NOTIFICATION_ICONS = {
    mention: MessageSquare,
    assignment: UserPlus,
    due_date: AlertCircle,
    comment: MessageSquare,
    completed: CheckCircle2,
    default: Bell,
};

export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
    const markAsRead = useMutation(api.notifications.markAsRead);
    const deleteNotification = useMutation(api.notifications.deleteNotification);

    const Icon = NOTIFICATION_ICONS[notification.type as keyof typeof NOTIFICATION_ICONS] || NOTIFICATION_ICONS.default;

    const handleClick = async () => {
        if (!notification.read) {
            await markAsRead({ notificationId: notification._id });
        }
        if (notification.linkUrl && onNavigate) {
            onNavigate();
            window.location.href = notification.linkUrl;
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
                "group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer border",
                notification.read
                    ? "bg-background hover:bg-muted/50 border-transparent"
                    : "bg-primary/5 hover:bg-primary/10 border-primary/20"
            )}
        >
            <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                notification.read ? "bg-muted" : "bg-primary/10"
            )}>
                <Icon className={cn(
                    "h-4 w-4",
                    notification.read ? "text-muted-foreground" : "text-primary"
                )} />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                        "text-sm font-medium leading-tight",
                        !notification.read && "font-semibold"
                    )}>
                        {notification.title}
                    </p>
                    {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
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

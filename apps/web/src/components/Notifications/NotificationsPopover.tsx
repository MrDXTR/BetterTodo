import { Bell, Check, Inbox } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import { useState } from "react";

export function NotificationsPopover() {
    const [open, setOpen] = useState(false);
    const notifications = useQuery(api.notifications.getAll);
    const unreadCount = useQuery(api.notifications.getUnreadCount);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={handleMarkAllAsRead}
                        >
                            <Check className="h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications === undefined ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                                <Inbox className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                You're all caught up!
                            </p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification._id}
                                    notification={notification}
                                    onNavigate={() => setOpen(false)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

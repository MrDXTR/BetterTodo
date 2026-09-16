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
                    className="relative h-8 w-8 rounded-lg"
                    aria-label="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 sm:w-96 p-0 rounded-xl border border-border/70 shadow-xl overflow-hidden"
                align="end"
                sideOffset={6}
            >
                <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5 bg-muted/20">
                    <h3 className="font-semibold text-xs text-foreground">Notifications</h3>
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            <Check className="h-3 w-3" />
                            <span>Mark all read</span>
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[360px]">
                    {notifications === undefined ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 mb-2.5">
                                <Inbox className="h-5 w-5 text-muted-foreground/60" />
                            </div>
                            <p className="text-xs font-medium text-foreground">No notifications</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                You're all caught up!
                            </p>
                        </div>
                    ) : (
                        <div className="p-1.5 space-y-1">
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

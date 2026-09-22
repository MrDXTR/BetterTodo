import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Bell, BellRing, Check, Inbox, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationsPopover() {
    const [open, setOpen] = useState(false);
    const notifications = useQuery(api.notifications.getAll);
    const unreadCount = useQuery(api.notifications.getUnreadCount);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading: isPushLoading,
        subscribe: enablePush,
        unsubscribe: disablePush,
    } = usePushNotifications();

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const needsPushPrompt =
        isSupported &&
        !isSubscribed &&
        permission !== "denied" &&
        Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);

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

                {needsPushPrompt && (
                    <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-3.5 py-2.5">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">
                                Desktop notifications
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Get alerted for card dues and updates
                            </p>
                        </div>
                        <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-xs shrink-0 font-medium"
                            onClick={enablePush}
                            disabled={isPushLoading}
                        >
                            {isPushLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                "Enable"
                            )}
                        </Button>
                    </div>
                )}

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

                {isSupported && isSubscribed && (
                    <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-3.5 py-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <BellRing className="h-3 w-3" />
                            <span>Push alerts active</span>
                        </span>
                        <button
                            type="button"
                            onClick={disablePush}
                            disabled={isPushLoading}
                            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            Disable
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

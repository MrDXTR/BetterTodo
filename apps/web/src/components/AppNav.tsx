import { api } from "@BetterTodo/backend/convex/_generated/api";
import { Link, useRouterState } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import {
    Clock,
    Flame,
    Home,
    KanbanSquare,
    LayoutDashboard,
    Menu,
    Plus,
    Search,
    Settings,
    Shield,
    Sparkles,
} from "lucide-react";
import { useState } from "react";

import { NotificationsPopover } from "@/components/Notifications/NotificationsPopover";
import { SearchCommandPalette } from "@/components/SearchCommandPalette";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

function NavLinks({
    vertical = false,
    onNavigate,
}: {
    vertical?: boolean;
    onNavigate?: () => void;
}) {
    const router = useRouterState();
    const pathname = router.location.pathname;

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/boards", label: "Boards", icon: KanbanSquare },
    ];

    return (
        <nav
            className={cn(
                "flex items-center gap-1",
                vertical && "flex-col items-stretch gap-1 w-full",
            )}
        >
            {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                    <Link
                        key={link.href}
                        to={link.href}
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                            isActive
                                ? "bg-muted text-foreground shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                    >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

function MobileWorkspacesList({ onNavigate }: { onNavigate?: () => void }) {
    const workspaces = useQuery(api.workspaces.getMyWorkspaces);
    if (!workspaces || workspaces.length === 0) return null;

    return (
        <div className="space-y-1.5 pt-3 border-t border-border/60">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspaces
            </p>
            <div className="space-y-0.5">
                {workspaces.map((ws) => (
                    <div
                        key={ws._id}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    >
                        <span className="truncate flex-1 font-medium">{ws.name}</span>
                        <Link
                            to="/workspaces/$workspaceId"
                            params={{ workspaceId: ws._id }}
                            onClick={onNavigate}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            title={`${ws.name} Settings`}
                        >
                            <Settings className="h-3 w-3" />
                            <span>Settings</span>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AppNav() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pushNotifications = usePushNotifications();
    const unsubscribeFromPushBeforeSignOut = () => pushNotifications.unsubscribe({ silent: true });

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
            <div className="flex h-13 items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-85 active:scale-[0.98]"
                >
                    <img
                        src="/mainlogo.svg"
                        alt="BetterTodo"
                        className="h-8 w-auto object-contain dark:invert"
                    />
                </Link>

                {/* Desktop nav — only when signed in */}
                <Authenticated>
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <NavLinks />
                    </div>
                </Authenticated>

                {/* Right: theme + user (desktop) / hamburger (mobile) */}
                <div className="flex items-center gap-2">
                    <Authenticated>
                        <SearchCommandPalette />
                        <NotificationsPopover pushNotifications={pushNotifications} />
                    </Authenticated>
                    <AnimatedThemeToggler
                        variant="circle"
                        duration={500}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-[0.96] cursor-pointer"
                    />
                    <div className="hidden md:flex md:items-center md:gap-2">
                        <Authenticated>
                            <UserMenu onBeforeSignOut={unsubscribeFromPushBeforeSignOut} />
                        </Authenticated>
                        <Unauthenticated>
                            <Link to="/sign-in">
                                <Button variant="outline" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                        </Unauthenticated>
                    </div>
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden h-8 w-8"
                                aria-label="Open menu"
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] p-4 flex flex-col">
                            <SheetHeader>
                                <SheetTitle className="text-left text-base">Navigation</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-2 pt-4 flex-1 overflow-y-auto">
                                <Authenticated>
                                    <NavLinks vertical onNavigate={() => setMobileOpen(false)} />
                                    <MobileWorkspacesList onNavigate={() => setMobileOpen(false)} />
                                </Authenticated>
                                <div className="mt-auto pt-4 border-t border-border/60">
                                    <Authenticated>
                                        <UserMenu
                                            onBeforeSignOut={unsubscribeFromPushBeforeSignOut}
                                        />
                                    </Authenticated>
                                    <Unauthenticated>
                                        <Link to="/sign-in" onClick={() => setMobileOpen(false)}>
                                            <Button variant="outline" className="w-full">
                                                Sign In
                                            </Button>
                                        </Link>
                                    </Unauthenticated>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

export default AppNav;

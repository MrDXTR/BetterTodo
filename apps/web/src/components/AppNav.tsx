import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { LayoutDashboard, LayoutList, Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { SearchCommandPalette } from "@/components/SearchCommandPalette";
import { NotificationsPopover } from "@/components/Notifications/NotificationsPopover";
import UserMenu from "@/components/user-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/boards", label: "Boards", icon: LayoutList },
] as const;

function NavLinks({
  onNavigate,
  vertical,
}: {
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  return (
    <nav
      className={cn(
        "flex gap-1",
        vertical ? "flex-col" : "items-center"
      )}
    >
      {navLinks.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/dashboard" }}
          activeProps={{
            className: "bg-accent text-accent-foreground font-medium",
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            "hover:bg-accent/80 hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export default function AppNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 font-semibold text-lg tracking-tight"
        >
          <img
            src="/logo.png"
            alt="BetterTodo"
            className="h-8 w-8 rounded-md object-contain"
          />
          <span className="hidden sm:inline">BetterTodo</span>
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
            <NotificationsPopover />
          </Authenticated>
          <ModeToggle />
          <div className="hidden md:flex md:items-center md:gap-2">
            <Authenticated>
              <UserMenu />
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
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 pt-4">
                <NavLinks
                  vertical
                  onNavigate={() => setMobileOpen(false)}
                />
                <div className="mt-4 pt-4 border-t">
                  <Authenticated>
                    <UserMenu />
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

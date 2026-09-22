import { api } from "@BetterTodo/backend/convex/_generated/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LogOut, Shield } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

type UserMenuProps = {
    onBeforeSignOut?: () => Promise<void>;
};

export function UserMenu({ onBeforeSignOut }: UserMenuProps) {
    const navigate = useNavigate();
    const user = useQuery(api.auth.getCurrentUser);
    const role = useQuery(api.auth.getMyRole);

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 px-2 rounded-full border border-border/60 hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
                >
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium max-w-[100px] truncate">
                        {user?.name || "User"}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                {role === "admin" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link to="/admin" className="flex w-full items-center">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin Panel
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={async () => {
                        await onBeforeSignOut?.();
                        await authClient.signOut();
                        navigate({ to: "/sign-in" });
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default UserMenu;

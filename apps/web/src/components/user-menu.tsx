import { api } from "@BetterTodo/backend/convex/_generated/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Shield } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";

export default function UserMenu() {
    const navigate = useNavigate();
    const user = useQuery(api.auth.getCurrentUser);
    const role = useQuery(api.auth.getMyRole);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">{user?.name}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card min-w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>{user?.email}</DropdownMenuItem>
                    {role === "admin" && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Shield className="h-4 w-4 text-primary" />
                                    Admin Panel
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                            authClient.signOut({
                                fetchOptions: {
                                    onSuccess: () => {
                                        navigate({ to: "/dashboard" });
                                    },
                                },
                            });
                        }}
                    >
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

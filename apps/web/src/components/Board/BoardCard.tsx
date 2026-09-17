import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowUpRight,
    Clock,
    Crown,
    Globe,
    Lock,
    ShieldCheck,
    Users,
    MoreVertical,
    Trash2,
} from "lucide-react";
import type { Board } from "@/types/board";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";

export interface BoardCardProps {
    board: Board;
    isManageMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (boardId: Id<"boards">) => void;
    onDeleteSingle?: (board: Board) => void;
}

export function BoardCard({
    board,
    isManageMode = false,
    isSelected = false,
    onToggleSelect,
    onDeleteSingle,
}: BoardCardProps) {
    const color = board.color || "#0079BF";
    const role = board.role || "member";
    const isOwner = role === "owner";

    const visibilityConfig = {
        private: { label: "Private", icon: Lock },
        team: { label: "Team", icon: Users },
        public: { label: "Public", icon: Globe },
    }[board.visibility] || { label: "Private", icon: Lock };

    const VisibilityIcon = visibilityConfig.icon;

    const roleConfig = {
        owner: { label: "Owner", icon: Crown, color: "text-amber-500" },
        admin: { label: "Admin", icon: ShieldCheck, color: "text-blue-500" },
        member: { label: "Member", icon: Users, color: "text-emerald-500" },
        viewer: { label: "Viewer", icon: Users, color: "text-muted-foreground" },
    }[role] || { label: "Member", icon: Users, color: "text-muted-foreground" };

    const RoleIcon = roleConfig.icon;

    const timestamp = board.updatedAt || board.createdAt || board._creationTime;
    const timeAgo = timestamp
        ? formatDistanceToNow(timestamp, { addSuffix: true })
        : null;

    const cardInner = (
        <div
            className={cn(
                "relative flex flex-col h-full overflow-hidden rounded-2xl border bg-card shadow-xs transition-all duration-200",
                isManageMode
                    ? isSelected
                        ? "border-primary ring-2 ring-primary/40 shadow-md scale-[1.01]"
                        : isOwner
                            ? "border-border/70 hover:border-primary/40 cursor-pointer"
                            : "border-border/40 opacity-55 cursor-not-allowed"
                    : "border-border/70 group-hover:border-primary/40 group-hover:shadow-lg",
            )}
        >
            {/* Visual Header / Cover with gradient mesh & decorative kanban silhouette */}
            <div
                className="relative h-28 w-full overflow-hidden rounded-t-[15px] p-3 flex flex-col justify-between"
                style={{
                    background: `linear-gradient(135deg, ${color} 0%, ${color}DD 50%, ${color}99 100%)`,
                }}
            >
                {/* Inner 1px media ring for optical crispness */}
                <div className="absolute inset-0 ring-1 ring-inset ring-black/15 dark:ring-white/10 rounded-t-[15px] pointer-events-none" />

                {/* Subtle decorative kanban columns silhouette */}
                <div className="absolute right-3.5 bottom-0 flex items-end gap-1.5 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
                    <div className="w-5 h-12 rounded-t-sm bg-white/40 shadow-xs" />
                    <div className="w-5 h-18 rounded-t-sm bg-white/55 shadow-xs" />
                    <div className="w-5 h-9 rounded-t-sm bg-white/30 shadow-xs" />
                </div>

                {/* Top Row: Visibility Badge & Controls */}
                <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white border border-white/15 shadow-2xs">
                        <VisibilityIcon className="h-2.5 w-2.5" />
                        <span>{visibilityConfig.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        {isManageMode ? (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isOwner) {
                                        onToggleSelect?.(board._id as Id<"boards">);
                                    }
                                }}
                                className={cn(
                                    "flex items-center justify-center p-1 rounded-md bg-black/40 backdrop-blur-md border border-white/20 shadow-xs transition-transform",
                                    isOwner ? "cursor-pointer hover:scale-105" : "opacity-40 cursor-not-allowed",
                                )}
                                title={isOwner ? "Select to delete" : "Only the board owner can delete this board"}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    disabled={!isOwner}
                                    className="border-white/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                            </div>
                        ) : (
                            <>
                                {isOwner && onDeleteSingle && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md text-white border border-white/15 opacity-80 hover:opacity-100 transition-all shadow-2xs cursor-pointer"
                                                title="Board actions"
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSingle(board);
                                                }}
                                                className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Delete Board</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/25 backdrop-blur-md text-white border border-white/15 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom of Cover: Subtle Color Accent Marker */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div
                            className="h-2 w-2 rounded-full ring-2 ring-white/70 shadow-xs"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-white/90 drop-shadow-xs">
                            Board
                        </span>
                    </div>
                    {isManageMode && !isOwner && (
                        <span className="text-[9px] font-medium bg-black/40 text-white/80 px-1.5 py-0.5 rounded backdrop-blur-xs">
                            Non-owner
                        </span>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
                    {board.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.25rem] leading-relaxed mb-4">
                    {board.description || (
                        <span className="text-muted-foreground/50 italic">
                            No description provided
                        </span>
                    )}
                </p>

                {/* Card Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium">
                        <RoleIcon className={cn("h-3.5 w-3.5", roleConfig.color)} />
                        <span className="capitalize">{roleConfig.label}</span>
                    </div>

                    {timeAgo && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/75">
                            <Clock className="h-3 w-3" />
                            <span>{timeAgo}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isManageMode) {
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => {
                    if (isOwner) {
                        onToggleSelect?.(board._id as Id<"boards">);
                    }
                }}
                onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && isOwner) {
                        e.preventDefault();
                        onToggleSelect?.(board._id as Id<"boards">);
                    }
                }}
                className={cn(
                    "group block select-none outline-none",
                    isOwner && "cursor-pointer active:scale-[0.98]",
                )}
            >
                {cardInner}
            </div>
        );
    }

    return (
        <Link
            to="/boards/$boardId"
            params={{ boardId: board._id }}
            className="group block transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 active:scale-[0.98]"
        >
            {cardInner}
        </Link>
    );
}

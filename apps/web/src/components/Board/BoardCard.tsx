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
} from "lucide-react";
import type { Board } from "@/types/board";
import { cn } from "@/lib/utils";

interface BoardCardProps {
    board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
    const color = board.color || "#0079BF";
    const role = board.role || "member";

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

    return (
        <Link
            to="/boards/$boardId"
            params={{ boardId: board._id }}
            className="group block transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 active:scale-[0.98]"
        >
            <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-[border-color,box-shadow] duration-200 group-hover:border-primary/40 group-hover:shadow-lg">
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

                    {/* Top Row: Visibility Badge & Open Arrow */}
                    <div className="relative z-10 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white border border-white/15 shadow-2xs">
                            <VisibilityIcon className="h-2.5 w-2.5" />
                            <span>{visibilityConfig.label}</span>
                        </span>

                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/25 backdrop-blur-md text-white border border-white/15 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shadow-2xs">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                    </div>

                    {/* Bottom of Cover: Subtle Color Accent Marker */}
                    <div className="relative z-10 flex items-center gap-1.5">
                        <div
                            className="h-2 w-2 rounded-full ring-2 ring-white/70 shadow-xs"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-white/90 drop-shadow-xs">
                            Board
                        </span>
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
        </Link>
    );
}

import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Archive, CheckSquare, Layers3, ListTodo, Settings, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Board } from "@/types/board";
import { BoardAvatars } from "@/components/Board/BoardAvatars";
import { BoardMembersPanel } from "@/components/Board/BoardMembersPanel";
import { ArchivedItemsPanel } from "@/components/Board/ArchivedItemsPanel";
import { BoardSettingsModal } from "@/components/Board/BoardSettingsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardHeaderProps {
    board: Board;
    members?: any[];
    stats?: {
        lists: number;
        cards: number;
        checklistItemsCompleted: number;
        checklistItemsTotal: number;
    };
}

function hexToRgba(hex: string, alpha: number) {
    const clean = hex.replace("#", "");
    if (!/^[0-9a-fA-F]+$/.test(clean)) {
        return `rgba(0, 0, 0, ${alpha})`;
    }

    let r = 0;
    let g = 0;
    let b = 0;

    if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
        r = parseInt(clean.slice(0, 2), 16);
        g = parseInt(clean.slice(2, 4), 16);
        b = parseInt(clean.slice(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BoardHeader({ board, members = [], stats }: BoardHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(board.title);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);
    const [archivedOpen, setArchivedOpen] = useState(false);

    useEffect(() => {
        setTitle(board.title);
    }, [board.title]);

    const updateBoard = useMutation(api.boards.update);

    const handleSaveTitle = async () => {
        if (!title.trim() || title === board.title) {
            setTitle(board.title);
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateBoard({
                boardId: board._id,
                title: title.trim(),
            });
            setIsEditingTitle(false);
            toast.success("Board title updated");
        } catch (error) {
            console.error("Error updating board title:", error);
            toast.error("Failed to update board title");
            setTitle(board.title);
        }
    };

    const boardColor = board.color || "#0079BF";

    const colors = useMemo(
        () => ({
            tintStrong: hexToRgba(boardColor, 0.16),
            tintSoft: hexToRgba(boardColor, 0.08),
            tintBorder: hexToRgba(boardColor, 0.3),
            tintChip: hexToRgba(boardColor, 0.12),
        }),
        [boardColor]
    );

    const controlButtonClass =
        "h-8 px-2.5 text-foreground/70 hover:text-foreground hover:bg-background/75 transition-colors";

    return (
        <header className="relative overflow-hidden border-b border-border/60 bg-background/85 backdrop-blur-md">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `linear-gradient(115deg, ${colors.tintStrong} 0%, ${colors.tintSoft} 38%, transparent 72%)`,
                }}
            />

            <div className="relative px-4 md:px-6 py-3.5">
                {/* Row 1: back button, title, controls */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <Link to="/boards" className="shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground hover:bg-background/70 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ background: boardColor }}
                        />

                        {isEditingTitle ? (
                            <Input
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveTitle();
                                    if (e.key === "Escape") {
                                        setTitle(board.title);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                className="h-9 max-w-lg font-semibold text-base bg-background border-border shadow-sm"
                                maxLength={100}
                            />
                        ) : (
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                className="truncate rounded-md px-2 py-1.5 text-left text-base font-semibold text-foreground hover:bg-background/65 transition-colors max-w-full"
                            >
                                {board.title}
                            </button>
                        )}
                    </div>

                    <div
                        className="ml-auto shrink-0 flex items-center gap-1 rounded-xl border bg-background/65 p-1 backdrop-blur-sm"
                        style={{ borderColor: colors.tintBorder }}
                    >
                        <BoardAvatars users={members} />

                        <Button
                            variant="ghost"
                            size="sm"
                            className={controlButtonClass}
                            onClick={() => setMembersOpen(true)}
                        >
                            <Users className="h-4 w-4" />
                            <span className="hidden lg:inline ml-1">Members</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={controlButtonClass}
                            onClick={() => setArchivedOpen(true)}
                        >
                            <Archive className="h-4 w-4" />
                            <span className="hidden lg:inline ml-1">Archived</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground hover:bg-background/75 transition-transform transition-colors hover:rotate-45"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Row 2: stats chips — full width, no competition */}
                <div className="mt-2 ml-10 flex flex-row items-center gap-2 flex-nowrap overflow-x-auto scrollbar-none">
                    <span
                        className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                        style={{ borderColor: colors.tintBorder, background: colors.tintChip }}
                    >
                        {board.visibility}
                    </span>

                    {stats && (
                        <>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground whitespace-nowrap">
                                <Layers3 className="h-3 w-3 shrink-0" />
                                {stats.lists} {stats.lists === 1 ? "list" : "lists"}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground whitespace-nowrap">
                                <ListTodo className="h-3 w-3 shrink-0" />
                                {stats.cards} {stats.cards === 1 ? "card" : "cards"}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground whitespace-nowrap">
                                <CheckSquare className="h-3 w-3 shrink-0" />
                                {stats.checklistItemsCompleted}/{stats.checklistItemsTotal} tasks
                            </span>
                        </>
                    )}
                </div>
            </div>

            <BoardSettingsModal
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                board={board}
            />

            <BoardMembersPanel
                open={membersOpen}
                onOpenChange={setMembersOpen}
                boardId={board._id}
                currentUserRole={board.role}
            />

            <ArchivedItemsPanel
                open={archivedOpen}
                onOpenChange={setArchivedOpen}
                boardId={board._id}
            />
        </header>
    );
}
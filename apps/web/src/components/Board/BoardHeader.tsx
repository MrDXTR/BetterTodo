import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Settings, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Board } from "@/types/board";
import { BoardSettingsModal } from "@/components/Board/BoardSettingsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardHeaderProps {
    board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(board.title);
    const [settingsOpen, setSettingsOpen] = useState(false);

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
            toast.success("Board title updated!");
        } catch (error) {
            console.error("Error updating board title:", error);
            toast.error("Failed to update board title");
            setTitle(board.title);
        }
    };

    const boardColor = board.color || '#0079BF';

    return (
        <header
            className="relative flex items-center gap-4 px-6 py-3 border-b"
            style={{
                // Only a whisper of the board color — 4% opacity fill + a colored bottom border
                background: `${boardColor}0a`,
                borderBottomColor: `${boardColor}35`,
                borderBottomWidth: '1px',
            }}
        >
            {/* Thin accent line at the very top — the one place color is visible */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: boardColor, opacity: 0.6 }}
            />

            {/* Back Button */}
            <Link to="/boards" className="relative z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>

            {/* Board Title */}
            <div className="flex-1 relative z-10">
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
                        className="max-w-md h-9 font-semibold text-base bg-background border-border shadow-sm"
                        maxLength={100}
                    />
                ) : (
                    <button
                        onClick={() => setIsEditingTitle(true)}
                        className="rounded-md px-3 py-1.5 font-semibold text-base text-foreground hover:bg-muted/50 transition-colors"
                    >
                        {board.title}
                    </button>
                )}
            </div>

            {/* Color dot — small indicator so the board color isn't lost */}
            <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 opacity-70"
                style={{ background: boardColor }}
            />

            {/* Actions */}
            <div className="flex items-center gap-1 relative z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                    <Star className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors hidden md:flex items-center gap-1.5"
                >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Members</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => setSettingsOpen(true)}
                    style={{ transition: 'transform 0.3s ease, color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(45deg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

            <BoardSettingsModal
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                board={board}
            />
        </header>
    );
}
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
            className="relative flex items-center gap-4 px-6 py-4 backdrop-blur-md border-b overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${boardColor}f5 0%, ${boardColor}e8 50%, ${boardColor}dd 100%)`,
                borderColor: `${boardColor}30`,
                boxShadow: `0 4px 24px ${boardColor}30, 0 2px 8px ${boardColor}20`
            }}
        >
            {/* Animated gradient overlay */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none animate-pulse"
                style={{
                    background: `
                        radial-gradient(circle at 20% 50%, white 0%, transparent 50%),
                        radial-gradient(circle at 80% 50%, white 0%, transparent 50%)
                    `,
                    animationDuration: '4s'
                }}
            />

            {/* Shimmer effect */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s infinite'
                }}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}} />

            {/* Back Button */}
            <Link to="/boards" className="relative z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 transition-all hover:scale-105 backdrop-blur-sm"
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
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
                        className="max-w-md bg-white/95 font-semibold text-lg backdrop-blur-sm border-white/40 shadow-lg"
                        maxLength={100}
                    />
                ) : (
                    <button
                        onClick={() => setIsEditingTitle(true)}
                        className="rounded-lg px-4 py-2 font-semibold text-white hover:bg-white/15 transition-all text-lg backdrop-blur-sm"
                        style={{
                            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        {board.title}
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 relative z-10">
                {/* Star/Favorite */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-9 w-9 p-0 transition-all hover:scale-110 backdrop-blur-sm"
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <Star className="h-4 w-4" />
                </Button>

                {/* Members */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-9 px-3 transition-all hover:scale-105 backdrop-blur-sm hidden md:flex"
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Members</span>
                </Button>

                {/* Settings */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-9 w-9 p-0 transition-all hover:scale-110 hover:rotate-90 backdrop-blur-sm"
                    onClick={() => setSettingsOpen(true)}
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease'
                    }}
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

import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Settings, Star, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Board } from "@/types/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardHeaderProps {
    board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(board.title);

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

    return (
        <header
            className="flex items-center gap-4 border-b border-white/20 px-4 py-3 backdrop-blur-sm"
            style={{
                background: `linear-gradient(135deg, ${board.color || '#0079BF'}dd 0%, ${board.color || '#0079BF'}99 100%)`,
            }}
        >
            {/* Back Button */}
            <Link to="/boards">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>

            {/* Board Title */}
            <div className="flex-1">
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
                        className="max-w-md bg-white/90 font-semibold"
                        maxLength={100}
                    />
                ) : (
                    <button
                        onClick={() => setIsEditingTitle(true)}
                        className="rounded px-3 py-1.5 font-semibold text-white hover:bg-white/20 transition-colors"
                    >
                        {board.title}
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
                {/* Star/Favorite */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                    <Star className="h-4 w-4" />
                </Button>

                {/* Members */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-8 px-2 md:px-3"
                >
                    <Users className="md:mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Members</span>
                </Button>

                {/* Settings */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}

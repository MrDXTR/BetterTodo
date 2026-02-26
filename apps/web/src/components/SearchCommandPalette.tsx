import { useEffect, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { Search, LayoutGrid, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

export function SearchCommandPalette() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    // Debounced query — only search when we have ≥2 chars
    const debouncedQuery = useDebounce(searchQuery, 300);
    const shouldSearch = debouncedQuery.trim().length >= 2;

    const results = useQuery(
        api.search.globalSearch,
        shouldSearch ? { query: debouncedQuery, limit: 8 } : "skip",
    );

    // Cmd+K / Ctrl+K to open
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleSelect = useCallback(
        (type: "board" | "card", id: string, boardId?: string) => {
            setOpen(false);
            setSearchQuery("");
            if (type === "board") {
                navigate({ to: "/boards/$boardId", params: { boardId: id } });
            } else if (type === "card" && boardId) {
                navigate({ to: "/boards/$boardId", params: { boardId } });
            }
        },
        [navigate],
    );

    return (
        <>
            {/* Search trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted/40 text-muted-foreground text-sm hover:bg-muted/60 transition-colors"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Command dialog */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search boards and cards..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                />
                <CommandList>
                    {!shouldSearch && (
                        <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 py-6">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    Type at least 2 characters to search
                                </p>
                            </div>
                        </CommandEmpty>
                    )}

                    {shouldSearch && results === undefined && (
                        <div className="flex items-center justify-center py-6">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    )}

                    {shouldSearch &&
                        results &&
                        results.boards.length === 0 &&
                        results.cards.length === 0 && (
                            <CommandEmpty>
                                No results found for &quot;{debouncedQuery}
                                &quot;
                            </CommandEmpty>
                        )}

                    {/* Boards results */}
                    {results && results.boards.length > 0 && (
                        <CommandGroup heading="Boards">
                            {results.boards.map((board) => (
                                <CommandItem
                                    key={board._id}
                                    value={`board-${board._id}-${board.title}`}
                                    onSelect={() => handleSelect("board", board._id)}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <div
                                        className="h-4 w-4 rounded-sm shrink-0"
                                        style={{
                                            backgroundColor: board.color || "#0079BF",
                                        }}
                                    />
                                    <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {board.title}
                                        </p>
                                        {board.description && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {board.description}
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-aria-selected:opacity-100" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results && results.boards.length > 0 && results.cards.length > 0 && (
                        <CommandSeparator />
                    )}

                    {/* Cards results */}
                    {results && results.cards.length > 0 && (
                        <CommandGroup heading="Cards">
                            {results.cards.map((card) => (
                                <CommandItem
                                    key={card._id}
                                    value={`card-${card._id}-${card.title}`}
                                    onSelect={() => handleSelect("card", card._id, card.boardId)}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    {card.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm font-medium truncate ${card.completed ? "line-through text-muted-foreground" : ""}`}
                                        >
                                            {card.title}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span
                                                className="h-2 w-2 rounded-sm shrink-0"
                                                style={{
                                                    backgroundColor: card.boardColor || "#0079BF",
                                                }}
                                            />
                                            <span className="truncate">
                                                {card.boardTitle} › {card.listTitle}
                                            </span>
                                            {card.priority && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-4 px-1"
                                                >
                                                    {card.priority}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}

// Simple debounce hook
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

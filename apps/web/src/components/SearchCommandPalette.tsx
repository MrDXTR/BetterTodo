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

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function SearchCommandPalette() {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    // Debounced query — only search when we have ≥2 chars
    const debouncedQuery = useDebounce(searchQuery, 250);
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
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-border/60 bg-muted/30 text-muted-foreground text-xs hover:bg-muted/60 hover:text-foreground transition-[background-color,color,transform] active:scale-[0.97] cursor-pointer select-none"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">Search...</span>
                <kbd className="hidden sm:inline-flex h-4.5 items-center gap-0.5 rounded border border-border/70 bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
                    <span className="text-[10px]">⌘</span>K
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
                            <div className="flex flex-col items-center gap-2 py-6 text-center">
                                <Search className="h-7 w-7 text-muted-foreground/40" />
                                <p className="text-xs text-muted-foreground">
                                    Type at least 2 characters to search across boards and cards
                                </p>
                            </div>
                        </CommandEmpty>
                    )}

                    {shouldSearch && results === undefined && (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    )}

                    {shouldSearch &&
                        results &&
                        results.boards.length === 0 &&
                        results.cards.length === 0 && (
                            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                                No results found for &ldquo;{debouncedQuery}&rdquo;
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
                                    className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-1.5"
                                >
                                    <div
                                        className="h-3.5 w-3.5 rounded-xs shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                        style={{
                                            backgroundColor: board.color || "#0079BF",
                                        }}
                                    />
                                    <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">
                                            {board.title}
                                        </p>
                                        {board.description && (
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {board.description}
                                            </p>
                                        )}
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-aria-selected:opacity-100 transition-opacity" />
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
                                    className="flex items-center gap-2.5 cursor-pointer rounded-md px-2.5 py-1.5"
                                >
                                    {card.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-xs font-medium truncate ${card.completed ? "line-through text-muted-foreground" : ""}`}
                                        >
                                            {card.title}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                            <span
                                                className="h-2 w-2 rounded-xs shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                                style={{
                                                    backgroundColor: card.boardColor || "#0079BF",
                                                }}
                                            />
                                            <span className="truncate">
                                                {card.boardTitle || "Board"}
                                            </span>
                                            {card.listTitle && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">
                                                        {card.listTitle}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-aria-selected:opacity-100 transition-opacity" />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}

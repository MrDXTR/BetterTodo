import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Archive, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";

interface ArchivedItemsPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boardId?: Id<"boards">;
}

export function ArchivedItemsPanel({ open, onOpenChange, boardId }: ArchivedItemsPanelProps) {
    const archived = useQuery(api.boards.getArchived, open ? (boardId ? { boardId } : {}) : "skip");
    const restoreBoard = useMutation(api.boards.restore);
    const restoreCard = useMutation(api.cards.restore);
    const deleteCard = useMutation(api.cards.deleteCard);

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [deletingCard, setDeletingCard] = useState<{
        id: Id<"cards">;
        title: string;
    } | null>(null);

    const handleRestoreBoard = async (id: Id<"boards">) => {
        setLoadingId(id);
        try {
            await restoreBoard({ boardId: id });
            toast.success("Board restored");
        } catch (error: any) {
            toast.error(error.message || "Failed to restore board");
        } finally {
            setLoadingId(null);
        }
    };

    const handleRestoreCard = async (id: Id<"cards">) => {
        setLoadingId(id);
        try {
            await restoreCard({ cardId: id });
            toast.success("Card restored");
        } catch (error: any) {
            toast.error(error.message || "Failed to restore card");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeleteCard = async () => {
        if (!deletingCard) return;
        setLoadingId(deletingCard.id);
        try {
            await deleteCard({ cardId: deletingCard.id });
            toast.success("Card permanently deleted");
            setDeletingCard(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete card");
        } finally {
            setLoadingId(null);
        }
    };

    const boards = archived?.boards ?? [];
    const cards = archived?.cards ?? [];
    const isLoading = archived === undefined;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-md p-6">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                            <Archive className="h-4 w-4" />
                            <span>Archived Items</span>
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            Restore or permanently delete archived items
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue="cards" className="mt-5">
                        <TabsList className="grid w-full grid-cols-2 h-8">
                            <TabsTrigger value="cards" className="text-xs">
                                Cards{" "}
                                {!isLoading && (
                                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                                        {cards.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="boards" className="text-xs">
                                Boards{" "}
                                {!isLoading && (
                                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                                        {boards.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="cards">
                            <ScrollArea className="h-[calc(100vh-14rem)] pr-1">
                                {isLoading ? (
                                    <div className="space-y-2 mt-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-14 rounded-xl bg-muted animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ) : cards.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            No archived cards
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-3">
                                        {cards.map((card: any) => (
                                            <div
                                                key={card._id}
                                                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card/40 hover:bg-muted/40 transition-colors shadow-2xs"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate text-foreground">
                                                        {card.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <span
                                                            className="inline-block h-2 w-2 rounded-full shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                                            style={{
                                                                backgroundColor:
                                                                    card.boardColor ?? "#0079BF",
                                                            }}
                                                        />
                                                        <span>{card.boardTitle}</span>
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleRestoreCard(card._id)}
                                                        disabled={loadingId === card._id}
                                                        title="Restore card"
                                                    >
                                                        {loadingId === card._id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            setDeletingCard({
                                                                id: card._id,
                                                                title: card.title,
                                                            })
                                                        }
                                                        disabled={loadingId === card._id}
                                                        title="Delete permanently"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="boards">
                            <ScrollArea className="h-[calc(100vh-14rem)] pr-1">
                                {isLoading ? (
                                    <div className="space-y-2 mt-3">
                                        {Array.from({ length: 2 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-14 rounded-xl bg-muted animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ) : boards.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            No archived boards
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-3">
                                        {boards.map((board: any) => (
                                            <div
                                                key={board._id}
                                                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card/40 hover:bg-muted/40 transition-colors shadow-2xs"
                                            >
                                                <div
                                                    className="h-7 w-7 rounded-lg shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/15"
                                                    style={{
                                                        backgroundColor: board.color ?? "#0079BF",
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate text-foreground">
                                                        {board.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {board.description || "No description"}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    className="gap-1 shrink-0 h-7 text-xs px-2.5"
                                                    onClick={() => handleRestoreBoard(board._id)}
                                                    disabled={loadingId === board._id}
                                                >
                                                    {loadingId === board._id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-3 w-3" />
                                                    )}
                                                    <span>Restore</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </SheetContent>
            </Sheet>

            <DeleteConfirmationDialog
                open={deletingCard !== null}
                onOpenChange={(open) => !open && setDeletingCard(null)}
                onConfirm={handleDeleteCard}
                title="Delete Card Permanently?"
                description={`Are you sure you want to permanently delete "${deletingCard?.title}"? This cannot be undone.`}
                confirmText="Delete permanently"
            />
        </>
    );
}

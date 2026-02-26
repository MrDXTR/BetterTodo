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
                <SheetContent className="sm:max-w-md p-4">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Archive className="h-5 w-5" />
                            Archived Items
                        </SheetTitle>
                        <SheetDescription>
                            Restore or permanently delete archived items
                        </SheetDescription>
                    </SheetHeader>

                    <Tabs defaultValue="cards" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cards">
                                Cards{" "}
                                {!isLoading && (
                                    <Badge variant="secondary" className="ml-1.5 text-xs">
                                        {cards.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="boards">
                                Boards{" "}
                                {!isLoading && (
                                    <Badge variant="secondary" className="ml-1.5 text-xs">
                                        {boards.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="cards">
                            <ScrollArea className="h-[calc(100vh-16rem)]">
                                {isLoading ? (
                                    <div className="space-y-3 mt-2">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-16 rounded-lg bg-muted animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ) : cards.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Archive className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            No archived cards
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        {cards.map((card: any) => (
                                            <div
                                                key={card._id}
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {card.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <span
                                                            className="inline-block h-2 w-2 rounded-sm shrink-0"
                                                            style={{
                                                                backgroundColor:
                                                                    card.boardColor ?? "#0079BF",
                                                            }}
                                                        />
                                                        {card.boardTitle}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
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
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive"
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
                            <ScrollArea className="h-[calc(100vh-16rem)]">
                                {isLoading ? (
                                    <div className="space-y-3 mt-2">
                                        {Array.from({ length: 2 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-16 rounded-lg bg-muted animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ) : boards.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Archive className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            No archived boards
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        {boards.map((board: any) => (
                                            <div
                                                key={board._id}
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                            >
                                                <div
                                                    className="h-8 w-8 rounded shrink-0"
                                                    style={{
                                                        backgroundColor: board.color ?? "#0079BF",
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {board.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {board.description || "No description"}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1 shrink-0"
                                                    onClick={() => handleRestoreBoard(board._id)}
                                                    disabled={loadingId === board._id}
                                                >
                                                    {loadingId === board._id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-3 w-3" />
                                                    )}
                                                    Restore
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
                description={`Are you sure you want to permanently delete "${deletingCard?.title}"? This action cannot be undone.`}
                confirmText="Delete permanently"
            />
        </>
    );
}

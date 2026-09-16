import { useState, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    MessageSquare,
    CornerUpRight,
    Trash2,
    ChevronDown,
    ChevronUp,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types/board";
import { TextWithLinkPreviews } from "@/components/ui/text-with-link-previews";

interface CardCommentsProps {
    cardId: Id<"cards">;
    isReadOnly?: boolean;
}

export function CardComments({ cardId, isReadOnly = false }: CardCommentsProps) {
    const comments = useQuery(api.comments.getByCard, { cardId });
    const currentUser = useQuery(api.auth.getCurrentUser);
    const card = useQuery(api.cards.getById, { cardId });
    const boardMembers = card
        ? useQuery(api.boards.getMembers, { boardId: card.boardId })
        : undefined;

    const createComment = useMutation(api.comments.create);
    const deleteComment = useMutation(api.comments.deleteComment);

    const [content, setContent] = useState("");
    const [replyToId, setReplyToId] = useState<Id<"comments"> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<Id<"comments"> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Mentions autocomplete state
    const [mentionQuery, setMentionQuery] = useState<{
        active: boolean;
        text: string;
        startIndex: number;
    } | null>(null);
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

    const matchingMembers = useMemo(() => {
        if (!mentionQuery?.active || !boardMembers) return [];
        const query = mentionQuery.text.toLowerCase();
        const members = boardMembers.filter((m: any) => {
            const name = m.user?.name || m.user?.email || "Member";
            return name.toLowerCase().includes(query);
        });
        return members;
    }, [mentionQuery, boardMembers]);

    const isLoading = comments === undefined;

    // Group comments by root parent
    const commentsByParent = useMemo(() => {
        const byParent = new Map<string, Comment[]>();
        if (!comments) return byParent;

        for (const c of comments as Comment[]) {
            const key = c.parentCommentId ? c.parentCommentId : "root";
            const arr = byParent.get(key as string) ?? [];
            arr.push(c);
            byParent.set(key as string, arr);
        }
        return byParent;
    }, [comments]);

    const rootComments = commentsByParent.get("root") ?? [];

    const getReplies = (commentId: Id<"comments">) =>
        commentsByParent.get(commentId as unknown as string) ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        const trimmed = content.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await createComment({
                cardId,
                content: trimmed,
                parentCommentId: replyToId ?? undefined,
            });
            setContent("");
            setReplyToId(null);
        } catch (error) {
            console.error("Failed to create comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: Id<"comments">) => {
        if (isReadOnly) return;
        setDeletingCommentId(commentId);
        try {
            await deleteComment({ commentId });
        } catch (error) {
            console.error("Failed to delete comment", error);
        } finally {
            setDeletingCommentId(null);
        }
    };

    const handleReply = (commentId: Id<"comments">) => {
        if (isReadOnly) return;
        setReplyToId(commentId);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const resolveAuthor = (userId: string): { name: string; role?: string } => {
        if (currentUser && currentUser._id === userId) {
            return { name: currentUser.name || "You", role: "You" };
        }
        if (!boardMembers) return { name: "Unknown" };
        const member = boardMembers.find((m: any) => m.userId === userId);
        return {
            name: member?.user?.name || member?.user?.email || "Unknown",
            role: member?.role,
        };
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);

        const cursor = e.target.selectionStart ?? val.length;
        const textBeforeCursor = val.slice(0, cursor);
        const atIndex = textBeforeCursor.lastIndexOf("@");

        if (atIndex !== -1) {
            const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
            const hasPrecedingWhitespace = /\s/.test(charBeforeAt);
            const query = textBeforeCursor.slice(atIndex + 1);

            if (hasPrecedingWhitespace && !/\s/.test(query)) {
                setMentionQuery({
                    active: true,
                    text: query,
                    startIndex: atIndex,
                });
                setMentionSelectedIndex(0);
                return;
            }
        }

        if (mentionQuery?.active) {
            setMentionQuery(null);
        }
    };

    const insertMention = (memberName: string) => {
        if (!mentionQuery) return;
        const before = content.slice(0, mentionQuery.startIndex);
        const cursor = textareaRef.current?.selectionStart ?? content.length;
        const after = content.slice(cursor);
        const newText = `${before}@${memberName} ${after}`;
        setContent(newText);
        setMentionQuery(null);
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = before.length + memberName.length + 2;
                textareaRef.current.setSelectionRange(newPos, newPos);
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionQuery?.active && matchingMembers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionSelectedIndex((prev) => (prev + 1) % matchingMembers.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionSelectedIndex(
                    (prev) => (prev - 1 + matchingMembers.length) % matchingMembers.length,
                );
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const selected = matchingMembers[mentionSelectedIndex];
                if (selected) {
                    const name = selected.user?.name || selected.user?.email || "Member";
                    insertMention(name);
                }
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setMentionQuery(null);
                return;
            }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    const replyToAuthor = replyToId
        ? (() => {
              const target = (comments as Comment[] | undefined)?.find((c) => c._id === replyToId);
              return target ? resolveAuthor(target.userId) : null;
          })()
        : null;

    return (
        <div className="space-y-3.5">
            {isLoading && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}

            {!isLoading && comments?.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                    No comments yet. Be the first to leave a comment.
                </p>
            )}

            <div className="space-y-3">
                {rootComments.map((comment) => (
                    <CommentThread
                        key={comment._id}
                        comment={comment}
                        getReplies={getReplies}
                        onReply={handleReply}
                        onDelete={handleDelete}
                        resolveAuthor={resolveAuthor}
                        currentUserId={currentUser?._id}
                        deletingCommentId={deletingCommentId}
                        isReadOnly={isReadOnly}
                    />
                ))}
            </div>

            {!isReadOnly && (
                <form onSubmit={handleSubmit} className="space-y-2 relative pt-2">
                    {replyToId && replyToAuthor && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                            <div className="flex items-center gap-1.5">
                                <CornerUpRight className="h-3 w-3 text-primary" />
                                <span>Replying to <span className="font-medium text-foreground">@{replyToAuthor.name}</span></span>
                            </div>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setReplyToId(null)}
                                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Write a comment... (use @ to mention, ⌘↵ to submit)"
                            className="min-h-[72px] text-xs bg-card/40 resize-y"
                            disabled={isSubmitting}
                        />

                        {mentionQuery?.active && matchingMembers.length > 0 && (
                            <div
                                className="absolute z-50 w-56 bg-popover text-popover-foreground border border-border/60 shadow-md rounded-lg overflow-hidden"
                                style={{ bottom: "100%", left: "0", marginBottom: "6px" }}
                            >
                                <ul className="max-h-44 overflow-auto py-1">
                                    {matchingMembers.map((m: any, idx: number) => {
                                        const name = m.user?.name || m.user?.email || "Member";
                                        const isActive = idx === mentionSelectedIndex;
                                        return (
                                            <li
                                                key={m.userId}
                                                className={cn(
                                                    "px-2.5 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2",
                                                    isActive
                                                        ? "bg-accent text-accent-foreground font-medium"
                                                        : "hover:bg-muted/50 text-foreground",
                                                )}
                                                onClick={() => insertMention(name)}
                                                onMouseEnter={() => setMentionSelectedIndex(idx)}
                                            >
                                                <span className="truncate flex-1">{name}</span>
                                                {m.role && (
                                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider shrink-0">
                                                        {m.role}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            Tip: ⌘+Enter to submit
                        </span>
                        <Button
                            type="submit"
                            size="xs"
                            disabled={!content.trim() || isSubmitting}
                            className="h-7 text-xs px-3 gap-1.5 ml-auto"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <MessageSquare className="h-3 w-3" />
                            )}
                            <span>Comment</span>
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

interface CommentThreadProps {
    comment: Comment;
    getReplies: (commentId: Id<"comments">) => Comment[];
    onReply: (commentId: Id<"comments">) => void;
    onDelete: (commentId: Id<"comments">) => void;
    resolveAuthor: (userId: string) => { name: string; role?: string };
    currentUserId?: string;
    deletingCommentId: Id<"comments"> | null;
    isReadOnly?: boolean;
}

function CommentThread({
    comment,
    getReplies,
    onReply,
    onDelete,
    resolveAuthor,
    currentUserId,
    deletingCommentId,
    isReadOnly = false,
}: CommentThreadProps) {
    const [showAllReplies, setShowAllReplies] = useState(false);

    const collectAllNestedReplies = (parentId: Id<"comments">): Comment[] => {
        const directReplies = getReplies(parentId);
        const allReplies: Comment[] = [];

        for (const reply of directReplies) {
            allReplies.push(reply);
            const nestedReplies = collectAllNestedReplies(reply._id);
            allReplies.push(...nestedReplies);
        }

        return allReplies;
    };

    const allNestedReplies = collectAllNestedReplies(comment._id);
    const visibleReplies = showAllReplies ? allNestedReplies : allNestedReplies.slice(0, 1);
    const hiddenRepliesCount = allNestedReplies.length - 1;

    return (
        <div className="space-y-2">
            <CommentItem
                comment={comment}
                onReply={onReply}
                onDelete={onDelete}
                resolveAuthor={resolveAuthor}
                currentUserId={currentUserId}
                deletingCommentId={deletingCommentId}
                isReadOnly={isReadOnly}
            />

            {allNestedReplies.length > 0 && (
                <div className="ml-5 pl-2.5 border-l border-border/50 space-y-2">
                    {visibleReplies.map((reply) => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            resolveAuthor={resolveAuthor}
                            currentUserId={currentUserId}
                            deletingCommentId={deletingCommentId}
                            isReply
                            isReadOnly={isReadOnly}
                        />
                    ))}

                    {allNestedReplies.length > 1 && (
                        <button
                            type="button"
                            onClick={() => setShowAllReplies(!showAllReplies)}
                            className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 py-0.5 cursor-pointer"
                        >
                            {showAllReplies ? (
                                <>
                                    <ChevronUp className="h-3 w-3" />
                                    <span>Hide replies</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3 w-3" />
                                    <span>View {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? "reply" : "replies"}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

interface CommentItemProps {
    comment: Comment;
    onReply: (commentId: Id<"comments">) => void;
    onDelete: (commentId: Id<"comments">) => void;
    resolveAuthor: (userId: string) => { name: string; role?: string };
    currentUserId?: string;
    deletingCommentId: Id<"comments"> | null;
    isReply?: boolean;
    isReadOnly?: boolean;
}

function CommentItem({
    comment,
    onReply,
    onDelete,
    resolveAuthor,
    currentUserId,
    deletingCommentId,
    isReply = false,
    isReadOnly = false,
}: CommentItemProps) {
    const { name, role } = resolveAuthor(comment.userId);
    const isOwn = currentUserId && currentUserId === comment.userId;
    const isDeleting = deletingCommentId === comment._id;

    const createdAt = new Date(comment.createdAt).toLocaleTimeString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className={cn(
                "group rounded-lg border border-border/50 bg-card/40 p-2.5 text-xs transition-opacity shadow-2xs",
                isDeleting && "opacity-50",
            )}
        >
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-5 w-5 ring-1 ring-border shrink-0">
                        <AvatarFallback className="text-[9px] bg-muted font-medium">
                            {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate">{isOwn ? "You" : name}</span>
                    {role && role !== "You" && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">
                            {role}
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/70 shrink-0">
                        {createdAt}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity">
                    {!isReadOnly && (
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onReply(comment._id)}
                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                            title="Reply"
                        >
                            <CornerUpRight className="h-3 w-3" />
                        </Button>
                    )}
                    {(isOwn || role === "owner" || role === "admin") && !isReadOnly && (
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(comment._id)}
                            disabled={isDeleting}
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            title="Delete comment"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="text-foreground pl-7 leading-relaxed [word-break:break-word]">
                <TextWithLinkPreviews text={comment.content} />
            </div>
        </div>
    );
}

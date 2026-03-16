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

    // Group comments by root parent (Instagram-style single branch)
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

    const handleReply = (commentId: Id<"comments">) => {
        if (isReadOnly) return;
        setReplyToId(commentId);
        textareaRef.current?.focus();
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);

        // Check for mention
        const cursor = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);

        if (match) {
            const atIndex = textBeforeCursor.lastIndexOf("@");
            setMentionQuery({
                active: true,
                text: textBeforeCursor.slice(atIndex + 1),
                startIndex: atIndex,
            });
            setMentionSelectedIndex(0);
        } else {
            setMentionQuery(null);
        }
    };

    const insertMention = (memberName: string) => {
        if (!mentionQuery) return;
        const newContent =
            content.slice(0, mentionQuery.startIndex) +
            `@${memberName} ` +
            content.slice(mentionQuery.startIndex + mentionQuery.text.length + 1);

        setContent(newContent);
        setMentionQuery(null);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mentionQuery?.active || matchingMembers.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionSelectedIndex((prev) => (prev + 1) % matchingMembers.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionSelectedIndex(
                (prev) => (prev - 1 + matchingMembers.length) % matchingMembers.length,
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selectedMember = matchingMembers[mentionSelectedIndex];
            const name = selectedMember.user?.name || selectedMember.user?.email || "Member";
            insertMention(name);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setMentionQuery(null);
        }
    };

    const handleDelete = async (commentId: Id<"comments">) => {
        if (isReadOnly) return;
        if (deletingCommentId) return;
        setDeletingCommentId(commentId);
        try {
            await deleteComment({ commentId });
        } catch (error) {
            console.error("Failed to delete comment", error);
        } finally {
            setDeletingCommentId(null);
        }
    };

    const resolveAuthor = (userId: string) => {
        const member = boardMembers?.find((m: any) => m.userId === userId) as any;
        const name =
            member?.user?.name ||
            member?.user?.email ||
            (userId === currentUser?._id ? "You" : "Member");
        const role = member?.role as string | undefined;
        return { name, role };
    };

    // Find the comment being replied to
    const replyToComment = replyToId
        ? (comments as Comment[] | undefined)?.find((c) => c._id === replyToId)
        : null;
    const replyToAuthor = replyToComment ? resolveAuthor(replyToComment.userId) : null;

    return (
        <div className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Loading comments...</p>}

            {!isLoading && rootComments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No comments yet. Be the first to comment!
                </p>
            )}

            <div className="space-y-4">
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
                <form onSubmit={handleSubmit} className="space-y-2 relative">
                    {replyToId && replyToAuthor && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <CornerUpRight className="h-3 w-3" />
                                <span>Replying to @{replyToAuthor.name}</span>
                            </div>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setReplyToId(null)}
                                className="underline underline-offset-2 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a comment..."
                        className="min-h-[60px] text-sm"
                        disabled={isSubmitting}
                    />

                    {mentionQuery?.active && matchingMembers.length > 0 && (
                        <div
                            className="absolute z-10 w-[240px] bg-popover text-popover-foreground border border-border/50 shadow-md rounded-md overflow-hidden"
                            style={{ bottom: "100%", left: "0", marginBottom: "8px" }}
                        >
                            <ul className="max-h-[200px] overflow-auto py-1">
                                {matchingMembers.map((m: any, idx: number) => {
                                    const name = m.user?.name || m.user?.email || "Member";
                                    const isActive = idx === mentionSelectedIndex;
                                    return (
                                        <li
                                            key={m.userId}
                                            className={cn(
                                                "px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2",
                                                isActive
                                                    ? "bg-accent text-accent-foreground"
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

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!content.trim() || isSubmitting}
                            className="inline-flex items-center gap-1"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <MessageSquare className="h-3 w-3" />
                            )}
                            {isSubmitting ? "Comment" : "Comment"}
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
    const replies = getReplies(comment._id);
    const [showAllReplies, setShowAllReplies] = useState(false);

    // Recursively collect all nested replies
    const collectAllNestedReplies = (parentId: Id<"comments">): Comment[] => {
        const directReplies = getReplies(parentId);
        const allReplies: Comment[] = [];

        for (const reply of directReplies) {
            allReplies.push(reply);
            // Recursively get replies to this reply
            const nestedReplies = collectAllNestedReplies(reply._id);
            allReplies.push(...nestedReplies);
        }

        return allReplies;
    };

    const allNestedReplies = collectAllNestedReplies(comment._id);

    // Show first 1 reply by default
    const visibleReplies = showAllReplies ? allNestedReplies : allNestedReplies.slice(0, 1);
    const hiddenRepliesCount = allNestedReplies.length - 1;

    return (
        <div className="space-y-2">
            {/* Main comment */}
            <CommentItem
                comment={comment}
                onReply={onReply}
                onDelete={onDelete}
                resolveAuthor={resolveAuthor}
                currentUserId={currentUserId}
                deletingCommentId={deletingCommentId}
                isReadOnly={isReadOnly}
            />

            {/* Replies - Instagram style: all in single branch with consistent spacing */}
            {allNestedReplies.length > 0 && (
                <div className="ml-8 space-y-2">
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

                    {/* View all replies / Hide replies button */}
                    {allNestedReplies.length > 1 && (
                        <button
                            type="button"
                            onClick={() => setShowAllReplies(!showAllReplies)}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 py-1"
                        >
                            {showAllReplies ? (
                                <>
                                    <ChevronUp className="h-3 w-3" />
                                    Hide replies
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3 w-3" />
                                    View {hiddenRepliesCount} more{" "}
                                    {hiddenRepliesCount === 1 ? "reply" : "replies"}
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
    const isGlobalDeleting = deletingCommentId !== null;

    const createdAt = new Date(comment.createdAt).toLocaleString();

    return (
        <div
            className={cn(
                "rounded-md bg-muted/50 p-2 text-sm transition-opacity",
                isDeleting && "opacity-70",
            )}
        >
            <div className="flex items-center justify-between gap-2 mb-1">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{isOwn ? "You" : name}</span>
                        {role && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {role}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{createdAt}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!isReadOnly && (
                        <button
                            type="button"
                            disabled={isGlobalDeleting}
                            onClick={() => onReply(comment._id)}
                            className="text-[11px] text-muted-foreground hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                            Reply
                        </button>
                    )}
                    {isOwn && !isReadOnly && (
                        <button
                            type="button"
                            disabled={isGlobalDeleting}
                            onClick={() => onDelete(comment._id)}
                            className="text-[11px] text-destructive hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                            {isDeleting ? "Delete" : "Delete"}
                        </button>
                    )}
                </div>
            </div>
            <div className="text-sm break-words">
                <TextWithLinkPreviews text={comment.content} />
            </div>
            {comment.edited && (
                <p className="mt-1 text-[10px] text-muted-foreground italic">Edited</p>
            )}
        </div>
    );
}

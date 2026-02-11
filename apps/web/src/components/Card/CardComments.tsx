import { useState, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { MessageSquare, CornerUpRight, Trash2, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types/board";

interface CardCommentsProps {
  cardId: Id<"cards">;
}

export function CardComments({ cardId }: CardCommentsProps) {
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    const trimmed = content.trim();
    if (!trimmed) return;

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
    }
  };

  const handleReply = (commentId: Id<"comments">) => {
    setReplyToId(commentId);
    textareaRef.current?.focus();
  };

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await deleteComment({ commentId });
    } catch (error) {
      console.error("Failed to delete comment", error);
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
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      )}

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
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {replyToId && replyToAuthor && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CornerUpRight className="h-3 w-3" />
              <span>Replying to @{replyToAuthor.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyToId(null)}
              className="underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[60px] text-sm"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim()}
            className="inline-flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            Comment
          </Button>
        </div>
      </form>
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
}

function CommentThread({
  comment,
  getReplies,
  onReply,
  onDelete,
  resolveAuthor,
  currentUserId,
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
              isReply
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
                  View {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
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
  isReply?: boolean;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  resolveAuthor,
  currentUserId,
  isReply = false,
}: CommentItemProps) {
  const { name, role } = resolveAuthor(comment.userId);
  const isOwn = currentUserId && currentUserId === comment.userId;

  const createdAt = new Date(comment.createdAt).toLocaleString();

  return (
    <div className="rounded-md bg-muted/50 p-2 text-sm">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {isOwn ? "You" : name}
            </span>
            {role && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {role}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{createdAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReply(comment._id)}
            className="text-[11px] text-muted-foreground hover:underline"
          >
            Reply
          </button>
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete(comment._id)}
              className="text-[11px] text-destructive hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>
      <div className="text-sm whitespace-pre-wrap break-words">
        {comment.content}
      </div>
      {comment.edited && (
        <p className="mt-1 text-[10px] text-muted-foreground italic">
          Edited
        </p>
      )}
    </div>
  );
}

import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";

// ============================================
// BOARD TYPES
// ============================================

export type BoardRole = "owner" | "admin" | "member" | "viewer";
export type BoardVisibility = "private" | "team" | "public";

export interface Board {
    _id: Id<"boards">;
    _creationTime: number;
    title: string;
    description?: string;
    color?: string;
    backgroundUrl?: string;
    visibility: BoardVisibility;
    workspaceId?: Id<"workspaces">;
    createdBy: string;
    archived: boolean;
    createdAt: number;
    updatedAt: number;
    role?: BoardRole; // Added by query
}

export interface BoardWithLists extends Board {
    lists: ListWithCards[];
}

// ============================================
// LIST TYPES
// ============================================

export interface List {
    _id: Id<"lists">;
    _creationTime: number;
    boardId: Id<"boards">;
    title: string;
    position: number;
    cardLimit?: number;
    archived: boolean;
    createdAt: number;
}

export interface ListWithCards extends List {
    cards: Card[];
}

// ============================================
// CARD TYPES
// ============================================

export type CardPriority = "low" | "medium" | "high" | "urgent";

export interface Card {
    _id: Id<"cards">;
    _creationTime: number;
    listId: Id<"lists">;
    boardId: Id<"boards">;
    title: string;
    description?: string;
    position: number;
    coverImage?: string;
    dueDate?: number;
    priority?: CardPriority;
    estimatedHours?: number;
    actualHours?: number;
    createdBy: string;
    archived: boolean;
    completed: boolean;
    checklistCount?: number;
    checklistItemsCompleted?: number;
    checklistItemsTotal?: number;
    labelIds?: string[]; // label IDs for quick filtering
    createdAt: number;
    updatedAt: number;
}

export interface CardWithDetails extends Card {
    labels: Label[];
    assignments: CardAssignment[];
    checklists: ChecklistWithItems[];
}

// ============================================
// LABEL TYPES
// ============================================

export interface Label {
    _id: Id<"labels">;
    _creationTime: number;
    boardId: Id<"boards">;
    name: string;
    color: string;
}

export interface CardLabel {
    _id: Id<"cardLabels">;
    _creationTime: number;
    cardId: Id<"cards">;
    labelId: Id<"labels">;
}

// ============================================
// ASSIGNMENT TYPES
// ============================================

export interface CardAssignment {
    _id: Id<"cardAssignments">;
    _creationTime: number;
    cardId: Id<"cards">;
    userId: string;
    assignedAt: number;
    assignedBy: string;
}

// ============================================
// CHECKLIST TYPES
// ============================================

export interface Checklist {
    _id: Id<"checklists">;
    _creationTime: number;
    cardId: Id<"cards">;
    title: string;
    position: number;
}

export interface ChecklistItem {
    _id: Id<"checklistItems">;
    _creationTime: number;
    checklistId: Id<"checklists">;
    title: string;
    completed: boolean;
    assignedTo?: string;
    dueDate?: number;
    position: number;
}

export interface ChecklistWithItems extends Checklist {
    items: ChecklistItem[];
}

// ============================================
// COMMENT TYPES
// ============================================

export interface Comment {
    _id: Id<"comments">;
    _creationTime: number;
    cardId: Id<"cards">;
    userId: string;
    content: string;
    parentCommentId?: Id<"comments">;
    edited: boolean;
    createdAt: number;
    updatedAt: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
    _id: Id<"notifications">;
    _creationTime: number;
    userId: string;
    type: string;
    title: string;
    message: string;
    linkUrl?: string;
    read: boolean;
    createdAt: number;
}

// ============================================
// MEMBER TYPES
// ============================================

export interface BoardMember {
    _id: Id<"boardMembers">;
    _creationTime: number;
    boardId: Id<"boards">;
    userId: string;
    role: BoardRole;
    addedAt: number;
    addedBy: string;
}

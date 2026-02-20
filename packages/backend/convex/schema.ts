import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // CORE TABLES
  // ============================================

  boards: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()), // Hex color or preset name
    backgroundUrl: v.optional(v.string()),
    visibility: v.union(
      v.literal("private"),
      v.literal("team"),
      v.literal("public")
    ),
    workspaceId: v.optional(v.id("workspaces")),
    createdBy: v.string(), // User ID from Better Auth
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_workspace", ["workspaceId"])
    .index("by_archived", ["archived"]),

  lists: defineTable({
    boardId: v.id("boards"),
    title: v.string(),
    position: v.number(), // For ordering
    cardLimit: v.optional(v.number()),
    archived: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_board_position", ["boardId", "position"]),

  cards: defineTable({
    listId: v.id("lists"),
    boardId: v.id("boards"), // Denormalized for easier queries
    title: v.string(),
    description: v.optional(v.string()), // Rich text/markdown
    position: v.number(), // For ordering within list
    coverImage: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    dueDate: v.optional(v.number()),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    createdBy: v.string(), // User ID
    archived: v.boolean(),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_board", ["boardId"])
    .index("by_list_position", ["listId", "position"])
    .index("by_creator", ["createdBy"])
    .index("by_due_date", ["dueDate"]),

  // ============================================
  // COLLABORATION & PERMISSIONS
  // ============================================

  boardMembers: defineTable({
    boardId: v.id("boards"),
    userId: v.string(), // User ID from Better Auth
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
    addedAt: v.number(),
    addedBy: v.string(), // User ID
  })
    .index("by_board", ["boardId"])
    .index("by_user", ["userId"])
    .index("by_board_user", ["boardId", "userId"]),

  // ============================================
  // LABELS & ASSIGNMENTS
  // ============================================

  labels: defineTable({
    boardId: v.id("boards"),
    name: v.string(),
    color: v.string(), // Hex color
  }).index("by_board", ["boardId"]),

  cardLabels: defineTable({
    cardId: v.id("cards"),
    labelId: v.id("labels"),
  })
    .index("by_card", ["cardId"])
    .index("by_label", ["labelId"]),

  cardAssignments: defineTable({
    cardId: v.id("cards"),
    userId: v.string(), // User ID
    assignedAt: v.number(),
    assignedBy: v.string(), // User ID
  })
    .index("by_card", ["cardId"])
    .index("by_user", ["userId"]),

  // ============================================
  // CARD DETAILS
  // ============================================

  checklists: defineTable({
    cardId: v.id("cards"),
    title: v.string(),
    position: v.number(),
  }).index("by_card", ["cardId"]),

  checklistItems: defineTable({
    checklistId: v.id("checklists"),
    title: v.string(),
    completed: v.boolean(),
    assignedTo: v.optional(v.string()), // User ID
    dueDate: v.optional(v.number()),
    position: v.number(),
  }).index("by_checklist", ["checklistId"]),

  comments: defineTable({
    cardId: v.id("cards"),
    userId: v.string(), // User ID
    content: v.string(), // Rich text/markdown
    parentCommentId: v.optional(v.id("comments")), // For threading
    edited: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_card", ["cardId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentCommentId"]),

  attachments: defineTable({
    cardId: v.id("cards"),
    uploadedBy: v.string(), // User ID
    fileName: v.string(),
    storageId: v.id("_storage"), // Convex file storage ID
    fileSize: v.number(), // Bytes
    mimeType: v.string(),
    createdAt: v.number(),
  })
    .index("by_card", ["cardId"])
    .index("by_uploader", ["uploadedBy"]),

  // ============================================
  // NOTIFICATIONS & INVITES
  // ============================================

  boardInvites: defineTable({
    boardId: v.id("boards"),
    invitedUserId: v.optional(v.string()), // optional: not set for unregistered users
    invitedEmail: v.optional(v.string()),  // for unregistered users
    invitedByUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    token: v.optional(v.string()),         // secure token for email link acceptance
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_user_status", ["invitedUserId", "status"])
    .index("by_board", ["boardId"])
    .index("by_email", ["invitedEmail"])
    .index("by_token", ["token"]),

  notifications: defineTable({
    userId: v.string(), // Recipient user ID
    type: v.string(), // e.g., "mention", "assignment", "due_date", "comment"
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()), // Deep link to relevant item
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_user_time", ["userId", "createdAt"]),

  // ============================================
  // PRESENCE & SYNC
  // ============================================

  presence: defineTable({
    boardId: v.id("boards"),
    userId: v.string(),
    updatedAt: v.number(),
    cursor: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        cardId: v.optional(v.id("cards")),
      })
    ),
  })
    .index("by_board", ["boardId"])
    .index("by_user", ["userId"])
    .index("by_board_user", ["boardId", "userId"])
    .index("by_updated", ["updatedAt"]),

  // ============================================
  // WORKSPACES (Future feature)
  // ============================================

  workspaces: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.string(), // User ID
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(), // User ID
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    addedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),
});

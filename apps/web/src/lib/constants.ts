// ============================================
// BOARD COLORS
// ============================================

export const BOARD_COLORS = [
    { name: "Blue", value: "#0079BF", light: "#E4F0F6" },
    { name: "Green", value: "#61BD4F", light: "#E8F5E3" },
    { name: "Orange", value: "#FF9F1A", light: "#FFF4E5" },
    { name: "Red", value: "#EB5A46", light: "#FDECEA" },
    { name: "Purple", value: "#C377E0", light: "#F5EDF8" },
    { name: "Pink", value: "#FF78CB", light: "#FFF0F9" },
    { name: "Lime", value: "#51E898", light: "#E8F9F0" },
    { name: "Sky", value: "#00C2E0", light: "#E0F7FB" },
    { name: "Gray", value: "#838C91", light: "#F4F5F7" },
] as const;

export const DEFAULT_BOARD_COLOR = BOARD_COLORS[0].value;

// ============================================
// PRIORITY COLORS & LABELS
// ============================================

export const PRIORITY_CONFIG = {
    low: {
        label: "Low",
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgLight: "bg-blue-50",
    },
    medium: {
        label: "Medium",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        bgLight: "bg-yellow-50",
    },
    high: {
        label: "High",
        color: "bg-orange-500",
        textColor: "text-orange-700",
        bgLight: "bg-orange-50",
    },
    urgent: {
        label: "Urgent",
        color: "bg-red-500",
        textColor: "text-red-700",
        bgLight: "bg-red-50",
    },
} as const;

// ============================================
// LABEL COLORS
// ============================================

export const LABEL_COLORS = [
    "#61BD4F", // Green
    "#F2D600", // Yellow
    "#FF9F1A", // Orange
    "#EB5A46", // Red
    "#C377E0", // Purple
    "#0079BF", // Blue
    "#00C2E0", // Sky
    "#51E898", // Lime
    "#FF78CB", // Pink
    "#344563", // Dark Gray
] as const;

// ============================================
// ROLE PERMISSIONS
// ============================================

export const ROLE_PERMISSIONS = {
    owner: {
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
        canArchive: true,
        canChangeSettings: true,
    },
    admin: {
        canEdit: true,
        canDelete: true,
        canManageMembers: true,
        canArchive: true,
        canChangeSettings: true,
    },
    member: {
        canEdit: true,
        canDelete: false,
        canManageMembers: false,
        canArchive: false,
        canChangeSettings: false,
    },
    viewer: {
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
        canArchive: false,
        canChangeSettings: false,
    },
} as const;

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

export const KEYBOARD_SHORTCUTS = {
    NEW_CARD: "n",
    SEARCH: "/",
    CLOSE_MODAL: "Escape",
    SAVE: "mod+Enter", // Cmd+Enter on Mac, Ctrl+Enter on Windows
} as const;

// ============================================
// UI CONSTANTS
// ============================================

export const CARD_WIDTH = 272; // pixels
export const LIST_WIDTH = 272; // pixels
export const LIST_GAP = 12; // pixels
export const CARD_GAP = 8; // pixels

export const MAX_BOARD_TITLE_LENGTH = 100;
export const MAX_LIST_TITLE_LENGTH = 100;
export const MAX_CARD_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;

// ============================================
// DATE FORMATS
// ============================================

export const DATE_FORMAT = "MMM d, yyyy";
export const DATE_TIME_FORMAT = "MMM d, yyyy 'at' h:mm a";
export const RELATIVE_TIME_THRESHOLD = 7; // days

// ============================================
// NOTIFICATION TYPES
// ============================================

export const NOTIFICATION_TYPES = {
    MENTION: "mention",
    ASSIGNMENT: "assignment",
    DUE_DATE: "due_date",
    COMMENT: "comment",
    MEMBER_ADDED: "member_added",
    CARD_MOVED: "card_moved",
} as const;

// ============================================
// ACTIVITY ACTION TYPES
// ============================================

export const ACTIVITY_ACTIONS = {
    BOARD_CREATED: "board_created",
    BOARD_UPDATED: "board_updated",
    BOARD_ARCHIVED: "board_archived",
    BOARD_RESTORED: "board_restored",
    LIST_CREATED: "list_created",
    LIST_UPDATED: "list_updated",
    LIST_MOVED: "list_moved",
    LIST_ARCHIVED: "list_archived",
    LIST_DELETED: "list_deleted",
    CARD_CREATED: "card_created",
    CARD_UPDATED: "card_updated",
    CARD_MOVED: "card_moved",
    CARD_ARCHIVED: "card_archived",
    CARD_RESTORED: "card_restored",
    CARD_DUPLICATED: "card_duplicated",
    CARD_DELETED: "card_deleted",
    MEMBER_ADDED: "member_added",
    MEMBER_REMOVED: "member_removed",
    MEMBER_ROLE_UPDATED: "member_role_updated",
    USER_ASSIGNED: "user_assigned",
    USER_UNASSIGNED: "user_unassigned",
    LABEL_ADDED: "label_added",
    LABEL_REMOVED: "label_removed",
    COMMENT_ADDED: "comment_added",
    COMMENT_DELETED: "comment_deleted",
} as const;

export interface BoardTransferPayload {
    board: {
        title: string;
        description?: string;
        color?: string;
        backgroundUrl?: string;
    };
    lists: Array<{
        _id: string;
        title: string;
        position: number;
        cardLimit?: number;
        archived?: boolean;
    }>;
    cards: Array<{
        _id: string;
        listId: string;
        title: string;
        description?: string;
        position: number;
        coverImage?: string;
        dueDate?: number;
        priority?: "low" | "medium" | "high" | "urgent";
        estimatedHours?: number;
        actualHours?: number;
        archived?: boolean;
        completed?: boolean;
    }>;
    labels?: Array<{ _id: string; name: string; color: string }>;
    cardLabels?: Array<{ cardId: string; labelId: string }>;
    checklists?: Array<{ _id: string; cardId: string; title: string; position: number }>;
    checklistItems?: Array<{
        checklistId: string;
        title: string;
        completed: boolean;
        assignedTo?: string;
        dueDate?: number;
        position: number;
    }>;
    comments?: Array<{ cardId: string; content: string }>;
    customFields?: Array<{
        _id: string;
        name: string;
        type: "text" | "number" | "date" | "select" | "checkbox";
        required?: boolean;
        options?: string[];
        position: number;
    }>;
    customFieldValues?: Array<{
        cardId: string;
        fieldId: string;
        textValue?: string;
        numberValue?: number;
        dateValue?: number;
        checkboxValue?: boolean;
        selectValue?: string;
    }>;
    automations?: Array<{
        trigger: "due_date_reminder";
        name: string;
        enabled: boolean;
        config?: { hoursBefore?: number };
    }>;
}

export function parseBoardTransferPayload(payload: string): BoardTransferPayload {
    const parsed = JSON.parse(payload);

    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid payload root");
    }

    if (!parsed.board || typeof parsed.board.title !== "string") {
        throw new Error("Missing board title");
    }

    if (!Array.isArray(parsed.lists)) {
        throw new Error("Missing lists array");
    }

    if (!Array.isArray(parsed.cards)) {
        throw new Error("Missing cards array");
    }

    return parsed as BoardTransferPayload;
}

export function createImportedBoardTitle(sourceTitle: string, override?: string) {
    if (override && override.trim().length > 0) return override.trim();
    return `${sourceTitle} (Imported)`;
}

export function normalizeExportFileName(boardTitle: string) {
    return `${
        boardTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "board"
    }-export.json`;
}

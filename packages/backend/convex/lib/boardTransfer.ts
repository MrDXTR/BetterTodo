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

/**
 * Strips copy suffix from title to get the original base title.
 * Handles "Title copy", "Title copy 1", "Title copy 2", "Title (copy)", "Title (copy 1)"
 */
export function getBaseBoardTitle(title: string): string {
    const trimmed = title.trim();
    const match = trimmed.match(
        /^(.*?)(?: \((?:copy|Copy)(?: (\d+))?\)| (?:copy|Copy)(?: (\d+))?)$/,
    );
    if (match && match[1].trim().length > 0) {
        return match[1].trim();
    }
    return trimmed;
}

/**
 * Extracts the copy number from a title if present:
 * "Board" -> null
 * "Board copy" / "Board (copy)" -> 0
 * "Board copy 1" / "Board (copy 1)" -> 1
 * "Board copy 2" -> 2
 */
export function getCopyNumber(title: string): number | null {
    const trimmed = title.trim();
    const match = trimmed.match(
        /^(?:.*?)(?: \((?:copy|Copy)(?: (\d+))?\)| (?:copy|Copy)(?: (\d+))?)$/,
    );
    if (!match) return null;
    const numStr = match[1] !== undefined ? match[1] : match[2];
    if (numStr === undefined) return 0;
    const parsed = parseInt(numStr, 10);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a copy title given base title and copy index.
 * index 0: `${base} copy`
 * index 1: `${base} copy 1`
 * index 2: `${base} copy 2`
 * index 3: `${base} copy 3`
 */
export function formatCopyTitle(baseTitle: string, index: number): string {
    if (index <= 0) {
        return `${baseTitle} copy`;
    }
    return `${baseTitle} copy ${index}`;
}

/**
 * Generates the next copy title following the sequence:
 * 1st copy: "<title> copy"
 * 2nd copy: "<title> copy 1"
 * 3rd copy: "<title> copy 2"
 * ...
 */
export function generateCopyBoardTitle(sourceTitle: string, existingTitles: string[] = []): string {
    const base = getBaseBoardTitle(sourceTitle);
    const currentCopyNum = getCopyNumber(sourceTitle);

    let startIndex = 0;
    if (currentCopyNum !== null) {
        startIndex = currentCopyNum + 1;
    }

    const lowerExisting = new Set(existingTitles.map((t) => t.trim().toLowerCase()));

    let index = startIndex;
    while (true) {
        const candidate = formatCopyTitle(base, index);
        if (!lowerExisting.has(candidate.toLowerCase())) {
            return candidate;
        }
        index++;
    }
}

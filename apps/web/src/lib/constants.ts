export const WORKSPACE_PALETTE = [
    "#0079BF",
    "#D29034",
    "#519839",
    "#B04632",
    "#89609E",
    "#CD5A91",
    "#4BBF6B",
    "#00AECC",
    "#E6492D",
    "#838C91",
];

export const BOARD_COLORS = [
    { name: "Blue", value: "#0079BF", light: "#E4F0F6" },
    { name: "Green", value: "#61BD4F", light: "#E3F6DB" },
    { name: "Orange", value: "#FF9F1A", light: "#FFF4E5" },
    { name: "Red", value: "#EB5A46", light: "#FDECEA" },
    { name: "Purple", value: "#C377E0", light: "#F7ECFC" },
    { name: "Pink", value: "#FF78CB", light: "#FFF0F9" },
    { name: "Lime", value: "#51E898", light: "#E8FCF1" },
    { name: "Sky", value: "#00C2E0", light: "#E0F9FD" },
    { name: "Grey", value: "#838C91", light: "#F4F5F7" },
];

export const DEFAULT_BOARD_COLOR = BOARD_COLORS[0].value; // Blue

export const LABEL_COLORS = [
    { name: "Green", value: "#61BD4F", light: "#E3F6DB" },
    { name: "Yellow", value: "#F2D600", light: "#FEF9E5" },
    { name: "Orange", value: "#FF9F1A", light: "#FFF4E5" },
    { name: "Red", value: "#EB5A46", light: "#FDECEA" },
    { name: "Purple", value: "#C377E0", light: "#F7ECFC" },
    { name: "Blue", value: "#0079BF", light: "#E4F0F6" },
    { name: "Sky", value: "#00C2E0", light: "#E0F9FD" },
    { name: "Lime", value: "#51E898", light: "#E8FCF1" },
    { name: "Pink", value: "#FF78CB", light: "#FFF0F9" },
    { name: "Black", value: "#344563", light: "#E8EAED" },
];

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

export const CARD_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

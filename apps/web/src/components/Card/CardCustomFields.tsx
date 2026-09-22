import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Info, Loader2, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CardCustomFieldsProps {
    cardId: Id<"cards">;
    isEditable: boolean;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
    text: "Text field",
    number: "Number field",
    date: "Date field",
    checkbox: "Checkbox (Yes/No)",
    select: "Dropdown selection",
};

export function CardCustomFields({ cardId, isEditable }: CardCustomFieldsProps) {
    const fields = useQuery(api.customFields.getForCard, { cardId });
    const setValue = useMutation(api.customFields.setCardValue);
    const [savingFieldId, setSavingFieldId] = useState<string | null>(null);

    // If still loading or there are no custom fields on this board/card, render nothing
    if (fields === undefined || fields.length === 0) {
        return null;
    }

    const save = async (
        fieldId: Id<"customFields">,
        value:
            | { textValue: string | undefined }
            | { numberValue: number | undefined }
            | { dateValue: number | undefined }
            | { checkboxValue: boolean | undefined }
            | { selectValue: string | undefined },
    ) => {
        setSavingFieldId(fieldId);
        try {
            await setValue({
                cardId,
                fieldId,
                ...value,
            });
        } finally {
            setSavingFieldId(null);
        }
    };

    return (
        <TooltipProvider delayDuration={150}>
            <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Custom Fields</span>
                </div>

                <div className="space-y-1.5 text-xs">
                    {fields.map((field) => {
                        const value = field.value;
                        const isSaving = savingFieldId === field._id;
                        const typeLabel = FIELD_TYPE_LABELS[field.type] || `${field.type} field`;

                        return (
                            <div
                                key={field._id}
                                className="flex items-center justify-between gap-2 py-1 px-1 rounded-md hover:bg-muted/30 transition-colors"
                            >
                                {/* Property Label with Tooltips */}
                                <div className="flex items-center gap-1.5 min-w-0 max-w-[110px] shrink-0 text-muted-foreground">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="truncate text-xs font-medium text-foreground/85 cursor-default">
                                                {field.name}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="text-xs max-w-[200px] break-words"
                                        >
                                            {field.name}
                                        </TooltipContent>
                                    </Tooltip>
                                    {field.required && (
                                        <span className="text-destructive font-bold text-xs">
                                            *
                                        </span>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors cursor-help p-0.5 rounded-sm hover:bg-muted/80">
                                                <Info className="h-3 w-3 shrink-0" />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs py-1 px-2.5">
                                            <p className="font-semibold">{typeLabel}</p>
                                            {field.required && (
                                                <p className="text-[10px] text-destructive mt-0.5">
                                                    Required
                                                </p>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                    {isSaving && (
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0 ml-auto" />
                                    )}
                                </div>

                                {/* Property Control (Right) */}
                                <div className="flex-1 min-w-0 flex justify-end">
                                    {field.type === "text" && (
                                        <Input
                                            disabled={!isEditable || isSaving}
                                            defaultValue={value?.textValue ?? ""}
                                            placeholder="Empty"
                                            onBlur={(e) =>
                                                save(field._id, {
                                                    textValue: e.target.value.trim() || undefined,
                                                })
                                            }
                                            className="h-7 text-xs bg-background/80 border-border/60 hover:border-border focus:border-ring rounded-md px-2 max-w-[140px]"
                                        />
                                    )}

                                    {field.type === "number" && (
                                        <Input
                                            type="number"
                                            disabled={!isEditable || isSaving}
                                            defaultValue={value?.numberValue ?? ""}
                                            placeholder="Empty"
                                            onBlur={(e) => {
                                                const raw = e.target.value.trim();
                                                save(field._id, {
                                                    numberValue:
                                                        raw === "" ? undefined : Number(raw),
                                                });
                                            }}
                                            className="h-7 text-xs bg-background/80 border-border/60 hover:border-border focus:border-ring rounded-md px-2 max-w-[140px]"
                                        />
                                    )}

                                    {field.type === "date" && (
                                        <div className="flex items-center gap-1 max-w-[140px] w-full">
                                            <DatePicker
                                                disabled={!isEditable || isSaving}
                                                date={
                                                    value?.dateValue
                                                        ? new Date(value.dateValue)
                                                        : undefined
                                                }
                                                onDateChange={(date) =>
                                                    save(field._id, {
                                                        dateValue: date
                                                            ? date.getTime()
                                                            : undefined,
                                                    })
                                                }
                                                placeholder="No date"
                                                className="h-7 text-xs px-2 bg-background/80 border-border/60 hover:border-border focus:border-ring rounded-md w-full"
                                                align="end"
                                            />
                                            {isEditable && value?.dateValue && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                                                            onClick={() =>
                                                                save(field._id, {
                                                                    dateValue: undefined,
                                                                })
                                                            }
                                                            aria-label="Clear date"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="text-xs">
                                                        Clear
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    )}

                                    {field.type === "checkbox" && (
                                        <div className="flex items-center gap-2 px-1 py-0.5">
                                            <Checkbox
                                                disabled={!isEditable || isSaving}
                                                checked={value?.checkboxValue ?? false}
                                                onCheckedChange={(checked) =>
                                                    save(field._id, {
                                                        checkboxValue: checked === true,
                                                    })
                                                }
                                            />
                                            <span className="text-[11px] text-muted-foreground">
                                                {value?.checkboxValue ? "Yes" : "No"}
                                            </span>
                                        </div>
                                    )}

                                    {field.type === "select" && (
                                        <div className="flex items-center gap-1 max-w-[140px] w-full">
                                            <Select
                                                disabled={!isEditable || isSaving}
                                                value={value?.selectValue}
                                                onValueChange={(next) =>
                                                    save(field._id, {
                                                        selectValue: next || undefined,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-7 text-xs bg-background/80 border-border/60 hover:border-border focus:border-ring rounded-md px-2 w-full">
                                                    <SelectValue placeholder="Empty" />
                                                </SelectTrigger>
                                                <SelectContent className="text-xs">
                                                    {(field.options ?? []).map((option) => (
                                                        <SelectItem
                                                            key={option}
                                                            value={option}
                                                            className="text-xs"
                                                        >
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isEditable && value?.selectValue && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                                                            onClick={() =>
                                                                save(field._id, {
                                                                    selectValue: undefined,
                                                                })
                                                            }
                                                            aria-label="Clear selection"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="text-xs">
                                                        Clear
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}

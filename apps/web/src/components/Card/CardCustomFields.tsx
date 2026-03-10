import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, ListChecks, Loader2, ToggleRight, Type, WholeWord } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CardCustomFieldsProps {
    cardId: Id<"cards">;
    isEditable: boolean;
}

export function CardCustomFields({ cardId, isEditable }: CardCustomFieldsProps) {
    const fields = useQuery(api.customFields.getForCard, { cardId });
    const setValue = useMutation(api.customFields.setCardValue);
    const [savingFieldId, setSavingFieldId] = useState<string | null>(null);

    if (fields === undefined) {
        return <p className="text-sm text-muted-foreground">Loading custom fields...</p>;
    }

    if (!fields.length) {
        return <p className="text-sm text-muted-foreground">No custom fields configured.</p>;
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
        <div className="space-y-3">
            {fields.map((field) => {
                const value = field.value;
                const isSaving = savingFieldId === field._id;

                return (
                    <div key={field._id} className="rounded-md border p-2.5">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <label className="text-xs font-medium text-foreground/90">
                                {field.name}
                                {field.required ? " *" : ""}
                            </label>
                            {isSaving && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {field.type === "text" && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Type className="h-3 w-3" /> Text
                                </div>
                                <Input
                                    disabled={!isEditable || isSaving}
                                    defaultValue={value?.textValue ?? ""}
                                    placeholder="Enter value"
                                    onBlur={(e) =>
                                        save(field._id, {
                                            textValue: e.target.value.trim() || undefined,
                                        })
                                    }
                                />
                            </div>
                        )}

                        {field.type === "number" && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <WholeWord className="h-3 w-3" /> Number
                                </div>
                                <Input
                                    type="number"
                                    disabled={!isEditable || isSaving}
                                    defaultValue={value?.numberValue ?? ""}
                                    placeholder="Enter number"
                                    onBlur={(e) => {
                                        const raw = e.target.value.trim();
                                        save(field._id, {
                                            numberValue: raw === "" ? undefined : Number(raw),
                                        });
                                    }}
                                />
                            </div>
                        )}

                        {field.type === "date" && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CalendarDays className="h-3 w-3" /> Date
                                </div>
                                <Input
                                    type="date"
                                    disabled={!isEditable || isSaving}
                                    defaultValue={
                                        value?.dateValue
                                            ? new Date(value.dateValue).toISOString().slice(0, 10)
                                            : ""
                                    }
                                    onBlur={(e) => {
                                        const nextDate = e.target.value
                                            ? new Date(e.target.value).getTime()
                                            : undefined;
                                        save(field._id, { dateValue: nextDate });
                                    }}
                                />
                            </div>
                        )}

                        {field.type === "checkbox" && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ToggleRight className="h-3 w-3" /> Checkbox
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <Checkbox
                                        disabled={!isEditable || isSaving}
                                        checked={value?.checkboxValue ?? false}
                                        onCheckedChange={(checked) =>
                                            save(field._id, {
                                                checkboxValue: checked === true,
                                            })
                                        }
                                    />
                                    <span className="text-sm text-muted-foreground">Checked</span>
                                </div>
                            </div>
                        )}

                        {field.type === "select" && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ListChecks className="h-3 w-3" /> Select
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        disabled={!isEditable || isSaving}
                                        value={value?.selectValue}
                                        onValueChange={(next) =>
                                            save(field._id, {
                                                selectValue: next || undefined,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choose option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(field.options ?? []).map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {isEditable && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                save(field._id, { selectValue: undefined })
                                            }
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CUSTOM_FIELD_TYPES = ["text", "number", "date", "select", "checkbox"] as const;

type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

interface CustomFieldManagerProps {
    boardId: Id<"boards">;
}

export function CustomFieldManager({ boardId }: CustomFieldManagerProps) {
    const fields = useQuery(api.customFields.getByBoard, { boardId });
    const createField = useMutation(api.customFields.create);
    const removeField = useMutation(api.customFields.remove);

    const [name, setName] = useState("");
    const [type, setType] = useState<CustomFieldType>("text");
    const [required, setRequired] = useState(false);
    const [options, setOptions] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createField({
                boardId,
                name: name.trim(),
                type,
                required,
                options:
                    type === "select"
                        ? options
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean)
                        : undefined,
            });
            setName("");
            setOptions("");
            setRequired(false);
            setType("text");
            toast.success("Custom field created");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create custom field");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (fieldId: Id<"customFields">) => {
        try {
            await removeField({ fieldId });
            toast.success("Custom field removed");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove custom field");
        }
    };

    return (
        <section className="rounded-xl border border-border/70 bg-card/40 p-3.5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-semibold text-foreground">Custom fields</h3>

            <div className="space-y-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Field name"
                    maxLength={60}
                    className="h-8 text-xs bg-background"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreate();
                        }
                    }}
                />
                <div className="grid grid-cols-2 gap-2">
                    <Select value={type} onValueChange={(next) => setType(next as CustomFieldType)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            {CUSTOM_FIELD_TYPES.map((fieldType) => (
                                <SelectItem
                                    key={fieldType}
                                    value={fieldType}
                                    className="capitalize text-xs"
                                >
                                    {fieldType}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox
                            checked={required}
                            onCheckedChange={(checked) => setRequired(checked === true)}
                        />
                        <span>Required</span>
                    </label>
                </div>
                {type === "select" && (
                    <Input
                        value={options}
                        onChange={(e) => setOptions(e.target.value)}
                        placeholder="Options (comma-separated)"
                        className="h-8 text-xs bg-background"
                    />
                )}
                <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSubmitting || !name.trim()}
                    className="w-full h-8 text-xs gap-1.5"
                    size="sm"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>Add field</span>
                </Button>
            </div>

            <TooltipProvider delayDuration={150}>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {(fields ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 text-center">
                            No custom fields yet.
                        </p>
                    ) : (
                        fields!.map((field) => (
                            <div
                                key={field._id}
                                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 shadow-2xs"
                            >
                                <div className="min-w-0">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="truncate text-xs font-medium text-foreground cursor-default">
                                                {field.name}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="text-xs max-w-[200px] break-words"
                                        >
                                            {field.name}
                                        </TooltipContent>
                                    </Tooltip>
                                    <p className="text-[10px] text-muted-foreground capitalize">
                                        {field.type}
                                        {field.required ? " · required" : ""}
                                    </p>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(field._id)}
                                            aria-label={`Delete ${field.name}`}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                        Delete field
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ))
                    )}
                </div>
            </TooltipProvider>
        </section>
    );
}

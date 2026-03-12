import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
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
        <section className="rounded-lg border border-border/60 bg-card p-3 space-y-3">
            <h3 className="text-sm font-semibold">Custom fields</h3>

            <div className="space-y-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Field name"
                    maxLength={60}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreate();
                        }
                    }}
                />
                <div className="grid grid-cols-2 gap-2">
                    <Select value={type} onValueChange={(next) => setType(next as CustomFieldType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CUSTOM_FIELD_TYPES.map((fieldType) => (
                                <SelectItem
                                    key={fieldType}
                                    value={fieldType}
                                    className="capitalize"
                                >
                                    {fieldType}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
                        <Checkbox
                            checked={required}
                            onCheckedChange={(checked) => setRequired(checked === true)}
                        />
                        Required
                    </label>
                </div>
                {type === "select" && (
                    <Input
                        value={options}
                        onChange={(e) => setOptions(e.target.value)}
                        placeholder="Options (comma-separated)"
                    />
                )}
                <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSubmitting || !name.trim()}
                    className="w-full"
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-1" /> Add field
                </Button>
            </div>

            <div className="space-y-2">
                {(fields ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No custom fields yet.</p>
                ) : (
                    fields!.map((field) => (
                        <div
                            key={field._id}
                            className="flex items-center justify-between rounded-md border px-2.5 py-2"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{field.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {field.type}
                                    {field.required ? " · required" : ""}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(field._id)}
                                aria-label={`Delete ${field.name}`}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

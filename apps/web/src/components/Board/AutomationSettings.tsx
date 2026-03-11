import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Bot, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AutomationSettingsProps {
    boardId: Id<"boards">;
}

export function AutomationSettings({ boardId }: AutomationSettingsProps) {
    const rules = useQuery(api.automations.getByBoard, { boardId });
    const upsert = useMutation(api.automations.upsertDueDateReminder);
    const [isSaving, setIsSaving] = useState(false);

    const reminderRule = useMemo(
        () => rules?.find((rule) => rule.trigger === "due_date_reminder"),
        [rules],
    );

    const isEnabled = reminderRule?.enabled ?? false;
    const hoursBefore = reminderRule?.config.hoursBefore ?? 24;

    const save = async (next: { enabled: boolean; hoursBefore: number }) => {
        setIsSaving(true);
        try {
            await upsert({
                boardId,
                enabled: next.enabled,
                hoursBefore: next.hoursBefore,
                name: "Due date reminder",
            });
            toast.success("Automation updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update automation");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="rounded-lg border border-border/60 bg-card p-3 space-y-3">
            <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Automation rules</h3>
            </div>

            <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium">Due date reminder</p>
                        <p className="text-xs text-muted-foreground">
                            Notify assigned members before a card is due.
                        </p>
                    </div>
                    <Checkbox
                        checked={isEnabled}
                        disabled={isSaving}
                        onCheckedChange={(checked) =>
                            save({ enabled: checked === true, hoursBefore })
                        }
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Lead time</Label>
                    <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={String(hoursBefore)}
                            disabled={isSaving}
                            onValueChange={(next) =>
                                save({
                                    enabled: isEnabled,
                                    hoursBefore: Number(next),
                                })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 hour before</SelectItem>
                                <SelectItem value="6">6 hours before</SelectItem>
                                <SelectItem value="12">12 hours before</SelectItem>
                                <SelectItem value="24">24 hours before</SelectItem>
                                <SelectItem value="48">48 hours before</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => save({ enabled: true, hoursBefore })}
                    className="w-full"
                >
                    Save automation
                </Button>
            </div>
        </section>
    );
}

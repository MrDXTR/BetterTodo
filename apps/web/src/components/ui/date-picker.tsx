import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date;
    onDateChange: (date: Date | undefined) => void;
    placeholder?: string;
    formatStr?: string;
    className?: string;
    disabled?: boolean;
    align?: "start" | "center" | "end";
}

export function DatePicker({
    date,
    onDateChange,
    placeholder = "Pick a date",
    formatStr = "MMM d, yyyy",
    className,
    disabled = false,
    align = "start",
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal overflow-hidden max-w-full",
                        !date && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1 text-xs">
                        {date ? format(date, formatStr) : placeholder}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align={align}>
                <Calendar mode="single" selected={date} onSelect={onDateChange} initialFocus />
            </PopoverContent>
        </Popover>
    );
}

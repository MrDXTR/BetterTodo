import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { useMutation, useConvex } from "convex/react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

interface ImportExportPanelProps {
    boardId: Id<"boards">;
    boardTitle: string;
}

export function ImportExportPanel({ boardId, boardTitle }: ImportExportPanelProps) {
    const convex = useConvex();
    const navigate = useNavigate();
    const importBoard = useMutation(api.importExport.importBoard);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exported = await convex.query(api.importExport.exportBoard, { boardId });
            const blob = new Blob([JSON.stringify(exported, null, 2)], {
                type: "application/json",
            });
            const fileName = `${boardTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-export.json`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("Board exported");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export board");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportFile = async (file: File) => {
        setIsImporting(true);
        try {
            const payload = await file.text();
            const result = await importBoard({ payload });
            toast.success("Board imported");

            if (result?.boardId) {
                navigate({ to: "/boards/$boardId", params: { boardId: result.boardId } });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to import board file");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <section className="rounded-lg border border-border/60 bg-card p-3 space-y-2.5">
            <h3 className="text-sm font-semibold">Import / Export</h3>
            <p className="text-xs text-muted-foreground">
                Export this board as JSON or import a board backup file.
            </p>
            <div className="flex flex-col gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleExport}
                    disabled={isExporting || isImporting}
                    className="w-full justify-start gap-2"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Export board JSON
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            void handleImportFile(file);
                        }
                    }}
                />

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExporting || isImporting}
                    className="w-full justify-start gap-2"
                >
                    {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileUp className="h-4 w-4" />
                    )}
                    Import board JSON
                </Button>
            </div>
        </section>
    );
}

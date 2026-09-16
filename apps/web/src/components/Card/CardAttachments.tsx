import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    Download,
    File as FileIcon,
    FileText,
    Film,
    Image as ImageIcon,
    Loader2,
    Music,
    Trash2,
    Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CardAttachmentsProps {
    cardId: Id<"cards">;
    isReadOnly?: boolean;
}

const FILE_ICONS: Record<string, typeof FileIcon> = {
    image: ImageIcon,
    video: Film,
    audio: Music,
    text: FileText,
    application: FileIcon,
};

function getFileIcon(mimeType: string) {
    const category = mimeType.split("/")[0];
    return FILE_ICONS[category] || FileIcon;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CardAttachments({ cardId, isReadOnly = false }: CardAttachmentsProps) {
    const attachments = useQuery(api.attachments.getByCard, { cardId });
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addAttachment = useMutation(api.attachments.addAttachment);
    const deleteAttachment = useMutation(api.attachments.deleteAttachment);
    const setAsCover = useMutation(api.attachments.setAsCover);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [deletingId, setDeletingId] = useState<Id<"attachments"> | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (files: FileList | File[]) => {
        setIsUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress(`Uploading ${file.name}...`);

                const uploadUrl = await generateUploadUrl();

                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                if (!result.ok) {
                    throw new Error(`Upload failed for ${file.name}`);
                }

                const { storageId } = await result.json();

                await addAttachment({
                    cardId,
                    storageId,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || "application/octet-stream",
                });
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
            setUploadProgress("");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDelete = async (attachmentId: Id<"attachments">) => {
        setDeletingId(attachmentId);
        try {
            await deleteAttachment({ attachmentId });
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetAsCover = async (storageId: Id<"_storage">) => {
        try {
            await setAsCover({ cardId, storageId });
        } catch (error) {
            console.error("Set cover error:", error);
        }
    };

    if (attachments === undefined) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={120}>
            <div className="space-y-2.5">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleUpload(e.target.files);
                        }
                    }}
                />

                {/* Dropzone / Upload button */}
                {!isReadOnly && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleUpload(e.dataTransfer.files);
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed text-xs text-muted-foreground transition-[background-color,border-color] cursor-pointer",
                            isDragOver
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border/70 bg-card/40 hover:bg-muted/40 hover:text-foreground",
                            isUploading && "pointer-events-none opacity-60",
                        )}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                <span className="text-xs">{uploadProgress}</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-3.5 w-3.5" />
                                <span>Drop files here or click to upload</span>
                            </>
                        )}
                    </div>
                )}

                {/* Attachment list */}
                {attachments.length > 0 && (
                    <div className="space-y-1.5">
                        {attachments.map((attachment) => {
                            const Icon = getFileIcon(attachment.mimeType);
                            const isImage = attachment.mimeType.startsWith("image/");
                            const isDeleting = deletingId === attachment._id;

                            return (
                                <div
                                    key={attachment._id}
                                    className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/40 p-2 transition-colors hover:bg-muted/40 shadow-2xs"
                                >
                                    {isImage && attachment.url ? (
                                        <div className="relative h-9 w-12 shrink-0 rounded overflow-hidden">
                                            <img
                                                src={attachment.url}
                                                alt={attachment.fileName}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded bg-muted/60">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-foreground">
                                            {attachment.fileName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatFileSize(attachment.fileSize)} •{" "}
                                            {new Date(attachment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        {isImage && !isReadOnly && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                        onClick={() =>
                                                            handleSetAsCover(attachment.storageId)
                                                        }
                                                    >
                                                        <ImageIcon className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px]">
                                                    Set as cover
                                                </TooltipContent>
                                            </Tooltip>
                                        )}

                                        {attachment.url && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                        asChild
                                                    >
                                                        <a
                                                            href={attachment.url}
                                                            download={attachment.fileName}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </a>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px]">
                                                    Download
                                                </TooltipContent>
                                            </Tooltip>
                                        )}

                                        {!isReadOnly && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDelete(attachment._id)}
                                                        disabled={isDeleting}
                                                    >
                                                        {isDeleting ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px]">
                                                    Delete
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

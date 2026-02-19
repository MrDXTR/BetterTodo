import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import {
    Paperclip,
    Upload,
    Trash2,
    Download,
    Image as ImageIcon,
    FileText,
    File as FileIcon,
    Film,
    Music,
    Loader2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CardAttachmentsProps {
    cardId: Id<"cards">;
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

export function CardAttachments({ cardId }: CardAttachmentsProps) {
    const attachments = useQuery(api.attachments.getByCard, { cardId });
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addAttachment = useMutation(api.attachments.addAttachment);
    const deleteAttachment = useMutation(api.attachments.deleteAttachment);
    const setAsCover = useMutation(api.attachments.setAsCover);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [deletingId, setDeletingId] = useState<Id<"attachments"> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (files: FileList) => {
        setIsUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

                // Step 1: Get upload URL
                const uploadUrl = await generateUploadUrl();

                // Step 2: Upload the file
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                if (!result.ok) {
                    throw new Error(`Upload failed for ${file.name}`);
                }

                const { storageId } = await result.json();

                // Step 3: Save to database
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
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Upload button */}
            <div>
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
                <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {uploadProgress}
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Add Attachment
                        </>
                    )}
                </Button>
            </div>

            {/* Attachment list */}
            {attachments.length === 0 && !isUploading && (
                <p className="text-xs text-muted-foreground">No attachments yet.</p>
            )}

            {attachments.map((attachment) => {
                const Icon = getFileIcon(attachment.mimeType);
                const isImage = attachment.mimeType.startsWith("image/");
                const isDeleting = deletingId === attachment._id;

                return (
                    <div
                        key={attachment._id}
                        className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                        {/* Thumbnail or icon */}
                        {isImage && attachment.url ? (
                            <img
                                src={attachment.url}
                                alt={attachment.fileName}
                                className="h-12 w-16 shrink-0 rounded object-cover"
                            />
                        ) : (
                            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-muted">
                                <Icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate break-words">
                                {attachment.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.fileSize)} •{" "}
                                {new Date(attachment.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isImage && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    title="Set as cover"
                                    onClick={() => handleSetAsCover(attachment.storageId)}
                                >
                                    <ImageIcon className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            {attachment.url && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    title="Download"
                                    asChild
                                >
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.fileName}>
                                        <Download className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => handleDelete(attachment._id)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

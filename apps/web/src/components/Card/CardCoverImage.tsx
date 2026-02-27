import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CardCoverImageProps {
    cardId: Id<"cards">;
    coverImage?: string;
}

export function CardCoverImage({ cardId, coverImage }: CardCoverImageProps) {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const setAsCover = useMutation(api.attachments.setAsCover);
    const removeCover = useMutation(api.attachments.removeCover);

    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadCover = async (file: File) => {
        setIsUploading(true);
        try {
            // Step 1: Get upload URL
            const uploadUrl = await generateUploadUrl();

            // Step 2: Upload the file
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            // Step 3: Set as cover
            await setAsCover({ cardId, storageId });
        } catch (error) {
            console.error("Cover upload error:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveCover = async () => {
        setIsRemoving(true);
        try {
            await removeCover({ cardId });
        } catch (error) {
            console.error("Remove cover error:", error);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className="space-y-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        handleUploadCover(e.target.files[0]);
                    }
                }}
            />

            {coverImage ? (
                <>
                    <div className="relative rounded-md overflow-hidden">
                        <img src={coverImage} alt="Cover" className="h-20 w-full object-cover" />
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-7 text-xs gap-1"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Upload className="w-3 h-3" />
                            )}
                            Change
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-7 text-xs gap-1"
                            onClick={handleRemoveCover}
                            disabled={isRemoving}
                        >
                            {isRemoving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <X className="w-3 h-3" />
                            )}
                            Remove
                        </Button>
                    </div>
                </>
            ) : (
                <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Cover"}
                </Button>
            )}
        </div>
    );
}

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@BetterTodo/backend/convex/_generated/api";
import type { Id } from "@BetterTodo/backend/convex/_generated/dataModel";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CardCoverImageProps {
    cardId: Id<"cards">;
    coverImage?: string;
    variant?: "banner" | "button";
}

export function CardCoverImage({ cardId, coverImage, variant = "banner" }: CardCoverImageProps) {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const setAsCover = useMutation(api.attachments.setAsCover);
    const removeCover = useMutation(api.attachments.removeCover);

    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadCover = async (file: File) => {
        setIsUploading(true);
        try {
            const uploadUrl = await generateUploadUrl();

            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();
            await setAsCover({ cardId, storageId });
            toast.success("Cover image updated!");
        } catch (error) {
            console.error("Cover upload error:", error);
            toast.error("Failed to upload cover image");
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
            toast.success("Cover image removed");
        } catch (error) {
            console.error("Remove cover error:", error);
            toast.error("Failed to remove cover image");
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div>
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

            {coverImage && variant === "banner" ? (
                <div className="relative group w-full h-36 sm:h-44 overflow-hidden rounded-t-xl bg-muted">
                    <img
                        src={coverImage}
                        alt="Card cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none rounded-t-xl" />
                    
                    {/* Floating action pill on hover */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-background/80 backdrop-blur-md border border-border/60 rounded-lg p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[11px] px-2 gap-1"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Upload className="w-3 h-3" />
                            )}
                            <span>Change</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="xs"
                            className="h-6 text-[11px] px-1.5 text-destructive hover:text-destructive"
                            onClick={handleRemoveCover}
                            disabled={isRemoving}
                            title="Remove cover"
                        >
                            {isRemoving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <X className="w-3 h-3" />
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-8 text-xs font-normal"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : (
                        <ImageIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    )}
                    <span>{coverImage ? "Change Cover" : "Add Cover"}</span>
                </Button>
            )}
        </div>
    );
}

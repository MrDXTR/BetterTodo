import React, { useState, useRef, useCallback } from "react";
import { Streamdown } from "streamdown";
import {
    AlignLeft,
    Check,
    Copy,
    Edit3,
    Eye,
    FileCode,
    FileText,
    Upload,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CardDescriptionProps {
    cardDescription: string;
    description: string;
    setDescription: (val: string) => void;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
    onSave: () => Promise<void>;
    isReadOnly?: boolean;
}

const markdownComponents = {
    h1: ({ children, ...props }: any) => (
        <h1
            className="text-base md:text-lg font-bold text-foreground mt-3 mb-1.5 pb-1 border-b border-border/50 first:mt-0"
            {...props}
        >
            {children}
        </h1>
    ),
    h2: ({ children, ...props }: any) => (
        <h2
            className="text-sm md:text-base font-semibold text-foreground mt-2.5 mb-1 pb-0.5 border-b border-border/30 first:mt-0"
            {...props}
        >
            {children}
        </h2>
    ),
    h3: ({ children, ...props }: any) => (
        <h3
            className="text-xs md:text-sm font-semibold text-foreground mt-2 mb-1 first:mt-0"
            {...props}
        >
            {children}
        </h3>
    ),
    h4: ({ children, ...props }: any) => (
        <h4
            className="text-xs font-semibold text-foreground mt-1.5 mb-0.5 first:mt-0"
            {...props}
        >
            {children}
        </h4>
    ),
    h5: ({ children, ...props }: any) => (
        <h5
            className="text-xs font-medium text-foreground mt-1 mb-0.5 first:mt-0"
            {...props}
        >
            {children}
        </h5>
    ),
    h6: ({ children, ...props }: any) => (
        <h6
            className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mt-1 mb-0.5 first:mt-0"
            {...props}
        >
            {children}
        </h6>
    ),
    p: ({ children, ...props }: any) => (
        <p
            className="text-xs leading-relaxed text-foreground/90 my-1.5 [word-break:break-word] first:mt-0 last:mb-0"
            {...props}
        >
            {children}
        </p>
    ),
    ul: ({ children, ...props }: any) => (
        <ul className="list-disc pl-5 my-1.5 space-y-0.5 text-xs text-foreground/90" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }: any) => (
        <ol className="list-decimal pl-5 my-1.5 space-y-0.5 text-xs text-foreground/90" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }: any) => (
        <li className="py-0.5 text-xs text-foreground/90 [&>p]:inline" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ children, ...props }: any) => (
        <blockquote
            className="border-l-2 border-primary/50 bg-muted/20 pl-3 py-1 my-2 italic text-muted-foreground text-xs rounded-r"
            {...props}
        >
            {children}
        </blockquote>
    ),
    hr: ({ ...props }: any) => <hr className="my-3 border-border/60" {...props} />,
    a: ({ href, children, ...props }: any) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors inline-block"
            onClick={(e) => e.stopPropagation()}
            {...props}
        >
            {children}
        </a>
    ),
};

export function CardDescription({
    cardDescription,
    description,
    setDescription,
    isEditing,
    setIsEditing,
    onSave,
    isReadOnly = false,
}: CardDescriptionProps) {
    const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
    const [isSaving, setIsSaving] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave();
            setIsEditing(false);
            setActiveTab("write");
        } catch (error) {
            console.error("Failed to save description:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDescription(cardDescription);
        setIsEditing(false);
        setActiveTab("write");
    };

    const handleCopyMarkdown = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!cardDescription) return;
        try {
            await navigator.clipboard.writeText(cardDescription);
            setCopied(true);
            toast.success("Markdown copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy markdown");
        }
    };

    const handleImportMdFile = useCallback(
        (file: File) => {
            if (
                !file.name.endsWith(".md") &&
                !file.name.endsWith(".markdown") &&
                !file.type.includes("text")
            ) {
                toast.error("Please select a markdown (.md) or text file");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (typeof content === "string") {
                    setDescription(content);
                    toast.success(`Loaded "${file.name}"`);
                }
            };
            reader.onerror = () => {
                toast.error("Failed to read markdown file");
            };
            reader.readAsText(file);
        },
        [setDescription],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImportMdFile(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isReadOnly && !isDraggingFile) {
            setIsDraggingFile(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);

        if (isReadOnly) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (!isEditing) {
                setIsEditing(true);
            }
            handleImportMdFile(file);
        }
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Cmd+Enter or Ctrl+Enter to save
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave();
            return;
        }

        // Escape to cancel
        if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
            return;
        }

        // Tab key support for normal md file editing
        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            // Insert 2 spaces
            const updated = description.substring(0, start) + "  " + description.substring(end);
            setDescription(updated);

            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            });
        }
    };

    // When clicking the rendered markdown view (unless clicking interactive children)
    const handleMarkdownViewClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("a, button, input, [role='button'], pre, code")) {
            return;
        }
        if (!isReadOnly) {
            setIsEditing(true);
        }
    };

    return (
        <section
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative space-y-2 rounded-xl border border-border/60 bg-card/40 p-4 shadow-2xs transition-all",
                isDraggingFile && "border-primary ring-2 ring-primary/20 bg-primary/5",
            )}
        >
            {/* Hidden file input for importing .md files */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Drag drop overlay indicator */}
            {isDraggingFile && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/90 backdrop-blur-xs border-2 border-dashed border-primary pointer-events-none p-4 text-center">
                    <FileCode className="h-8 w-8 text-primary animate-bounce mb-2" />
                    <p className="text-xs font-semibold text-foreground">
                        Drop markdown (.md) file here
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Content will be loaded into description
                    </p>
                </div>
            )}

            {/* Header: Title + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Description</span>
                    <span className="rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-mono font-normal text-muted-foreground border border-border/40">
                        .md
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* In View Mode: Copy MD and Edit Button */}
                    {!isEditing && !isReadOnly && (
                        <>
                            {cardDescription && (
                                <button
                                    type="button"
                                    onClick={handleCopyMarkdown}
                                    title="Copy raw markdown"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3 w-3 text-emerald-500" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit</span>
                            </button>
                        </>
                    )}

                    {/* In Edit Mode: Write / Preview Tabs & Import Button */}
                    {isEditing && !isReadOnly && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Import .md file"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-border/50 bg-background/60"
                            >
                                <Upload className="h-3 w-3" />
                                <span>Import .md</span>
                            </button>

                            <div className="inline-flex rounded-md border border-border/60 bg-muted/40 p-0.5 text-[11px]">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("write")}
                                    className={cn(
                                        "px-2 py-0.5 rounded transition-all cursor-pointer",
                                        activeTab === "write"
                                            ? "bg-background text-foreground shadow-2xs font-medium"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("preview")}
                                    className={cn(
                                        "px-2 py-0.5 rounded transition-all cursor-pointer",
                                        activeTab === "preview"
                                            ? "bg-background text-foreground shadow-2xs font-medium"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Editing State: Normal MD File Format in Textarea or Live Preview */}
            {isEditing && !isReadOnly ? (
                <div className="space-y-2 pt-1">
                    {activeTab === "write" ? (
                        <div className="relative">
                            <Textarea
                                ref={textareaRef}
                                autoFocus
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onKeyDown={handleTextareaKeyDown}
                                placeholder={`# Description\n\nAdd details using Markdown (.md format)...\n\n- [ ] Checklist items\n- **Bold text**, _italics_, \`inline code\`\n- [Link](https://example.com)\n\nTip: You can also drag & drop or import a .md file!`}
                                className="min-h-[140px] text-xs font-mono leading-relaxed bg-background/90 resize-y border-border/70 focus-visible:ring-1"
                                spellCheck={false}
                            />
                        </div>
                    ) : (
                        <div className="min-h-[140px] max-h-[300px] overflow-y-auto rounded-md border border-border/60 bg-background/60 p-3 text-xs">
                            {description.trim() ? (
                                <Streamdown mode="static" components={markdownComponents}>
                                    {description}
                                </Streamdown>
                            ) : (
                                <p className="text-xs italic text-muted-foreground">
                                    Nothing to preview
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer Controls: Save, Cancel & Shortcut Hint */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            <Button
                                size="xs"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-7 text-xs px-3"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save</span>
                                )}
                            </Button>
                            <Button
                                size="xs"
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="h-7 text-xs px-2"
                            >
                                Cancel
                            </Button>
                        </div>

                        <span className="text-[10px] text-muted-foreground/80 font-mono">
                            ⌘↵ to save • Esc to cancel
                        </span>
                    </div>
                </div>
            ) : cardDescription ? (
                /* Saved State: Show in MD View! */
                <div
                    onClick={handleMarkdownViewClick}
                    className={cn(
                        "group/desc relative rounded-lg p-2.5 -m-1 transition-all border border-transparent",
                        !isReadOnly && "hover:border-border/60 hover:bg-muted/30 cursor-pointer",
                    )}
                >
                    <div className="text-xs leading-relaxed text-foreground/90 overflow-x-auto">
                        <Streamdown mode="static" components={markdownComponents}>
                            {cardDescription}
                        </Streamdown>
                    </div>

                    {!isReadOnly && (
                        <div className="opacity-0 group-hover/desc:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1 rounded bg-background/80 backdrop-blur-xs px-1.5 py-0.5 border border-border/60 text-[10px] text-muted-foreground shadow-2xs pointer-events-none">
                            <Edit3 className="h-2.5 w-2.5" />
                            <span>Click to edit</span>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <button
                    type="button"
                    onClick={() => {
                        if (!isReadOnly) setIsEditing(true);
                    }}
                    disabled={isReadOnly}
                    className="w-full text-left rounded-lg p-3 border border-dashed border-border/70 text-xs text-muted-foreground hover:bg-muted/30 hover:border-border transition-all cursor-pointer flex items-center justify-between group"
                >
                    <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                        <span>Add a detailed description in Markdown (.md)...</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/50 border border-border/50 rounded px-1 py-0.2">
                        .md supported
                    </span>
                </button>
            )}
        </section>
    );
}

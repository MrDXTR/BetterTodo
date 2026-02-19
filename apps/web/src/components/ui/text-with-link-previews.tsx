"use client";

import React from "react";
import { LinkPreview } from "./link-preview";

interface TextWithLinkPreviewsProps {
    text: string;
    className?: string;
}

/**
 * A component that parses text for URLs and wraps them in LinkPreview.
 * It handles plain text and URLs separately to allow for rich link previews.
 */
export function TextWithLinkPreviews({ text, className }: TextWithLinkPreviewsProps) {
    if (!text) return null;

    // Regular expression to match URLs starting with http:// or https://
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    // Split the text by URLs while keeping the URLs in the resulting array
    const parts = text.split(urlRegex);

    return (
        <div className={className}>
            {parts.map((part, index) => {
                // If the part matches the URL regex, wrap it in LinkPreview
                if (part.match(urlRegex)) {
                    return (
                        <LinkPreview
                            key={index}
                            url={part}
                            className="inline-block text-primary hover:underline"
                        >
                            {part}
                        </LinkPreview>
                    );
                }
                // Otherwise, it's just plain text (or whitespace/punctuation)
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
}

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BoardBackgroundGraphicProps {
    color?: string;
    className?: string;
}

/**
 * Parses a hex color (e.g. #0079BF) and returns a secondary shifted hue for gradients
 */
function getSecondaryColor(hex: string): string {
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return hex;

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    // Subtle hue rotation & lightness shift for rich dual-tone gradients
    const shiftedR = Math.min(255, Math.max(0, Math.round(r * 0.8 + b * 0.2)));
    const shiftedG = Math.min(255, Math.max(0, Math.round(g * 0.7 + r * 0.3)));
    const shiftedB = Math.min(255, Math.max(0, Math.round(b * 0.85 + g * 0.2)));

    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(shiftedR)}${toHex(shiftedG)}${toHex(shiftedB)}`;
}

export function BoardBackgroundGraphic({
    color = "#0079BF",
    className,
}: BoardBackgroundGraphicProps) {
    const uid = useMemo(() => `art-${Math.random().toString(36).slice(2, 8)}`, []);
    const secondaryColor = useMemo(() => getSecondaryColor(color), [color]);

    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden select-none",
                className,
            )}
            aria-hidden="true"
        >
            {/* Ambient radiant glow anchored firmly at the bottom */}
            <div
                className="absolute -bottom-24 inset-x-0 h-[65vh] blur-[140px] opacity-[0.16] dark:opacity-[0.12] transition-all duration-1000"
                style={{
                    background: `radial-gradient(ellipse 90% 75% at 50% 100%, ${color} 0%, ${secondaryColor} 40%, transparent 80%)`,
                }}
            />
            <div
                className="absolute -bottom-36 right-0 w-[55vw] h-[55vw] max-w-[900px] max-h-[900px] rounded-full blur-[150px] opacity-[0.12] dark:opacity-[0.09] transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle at 70% 80%, ${secondaryColor} 0%, transparent 70%)`,
                }}
            />

            {/* Seamless Bottom-Anchored Generative Vector Art */}
            <svg
                viewBox="0 0 1440 900"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMax slice"
                className="absolute inset-0 w-full h-full opacity-65 dark:opacity-45 transition-opacity duration-700"
            >
                <defs>
                    {/* Primary bottom-up wave gradient */}
                    <linearGradient id={`${uid}-wave1`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                        <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.09" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>

                    {/* Secondary counter-flow wave gradient */}
                    <linearGradient id={`${uid}-wave2`} x1="100%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.18" />
                        <stop offset="55%" stopColor={color} stopOpacity="0.06" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.01" />
                    </linearGradient>

                    {/* Deep foundation wave anchored to bottom floor */}
                    <linearGradient id={`${uid}-wave-base`} x1="50%" y1="100%" x2="50%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.16" />
                        <stop offset="70%" stopColor={secondaryColor} stopOpacity="0.04" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>

                    {/* Topmost airy wave crest */}
                    <linearGradient id={`${uid}-wave-crest`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.12" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.01" />
                    </linearGradient>

                    {/* Contour line gradients */}
                    <linearGradient id={`${uid}-contour`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.08" />
                        <stop offset="35%" stopColor={color} stopOpacity="0.34" />
                        <stop offset="70%" stopColor={secondaryColor} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.06" />
                    </linearGradient>

                    <linearGradient id={`${uid}-hairline`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.05" />
                        <stop offset="50%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.04" />
                    </linearGradient>

                    {/* Vertical fade mask: full opacity at bottom (y=100%), smooth dissolve towards top */}
                    <linearGradient id={`${uid}-bottom-fade`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="white" stopOpacity="1" />
                        <stop offset="55%" stopColor="white" stopOpacity="0.9" />
                        <stop offset="85%" stopColor="white" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* ============================================================ */}
                {/* 1. ORGANIC SILK WAVES (Anchored at Bottom Edge y=900) */}
                {/* ============================================================ */}
                <g mask={`url(#${uid}-bottom-fade)`}>
                    {/* Bottom-most foundational wave */}
                    <path
                        d="M -50 920 L -50 780 C 260 710 560 840 920 750 C 1180 690 1340 760 1490 730 L 1490 920 Z"
                        fill={`url(#${uid}-wave-base)`}
                    />

                    {/* Middle sweeping wave */}
                    <path
                        d="M -50 920 L -50 670 C 280 580 620 740 1000 640 C 1240 570 1380 650 1490 610 L 1490 920 Z"
                        fill={`url(#${uid}-wave1)`}
                    />

                    {/* Upper counter-flow wave */}
                    <path
                        d="M -50 920 L -50 560 C 320 460 680 620 1060 520 C 1280 450 1400 530 1490 490 L 1490 920 Z"
                        fill={`url(#${uid}-wave2)`}
                    />

                    {/* Soft topmost crest wave */}
                    <path
                        d="M -50 920 L -50 460 C 360 350 720 520 1120 410 C 1300 350 1410 420 1490 380 L 1490 920 Z"
                        fill={`url(#${uid}-wave-crest)`}
                    />
                </g>

                {/* ============================================================ */}
                {/* 2. TOPOGRAPHIC CONTOUR RIBBONS (Anchored to Bottom Waves) */}
                {/* ============================================================ */}
                <g mask={`url(#${uid}-bottom-fade)`}>
                    {/* Crest contour line */}
                    <path
                        d="M -50 460 C 360 350 720 520 1120 410 C 1300 350 1410 420 1490 380"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1.25"
                    />
                    <path
                        d="M -50 510 C 340 405 700 570 1090 465 C 1290 400 1405 475 1490 435"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.85"
                    />
                    <path
                        d="M -50 560 C 320 460 680 620 1060 520 C 1280 450 1400 530 1490 490"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.7"
                    />
                    <path
                        d="M -50 615 C 300 520 650 680 1030 580 C 1260 510 1390 590 1490 550"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.55"
                        strokeDasharray="4 6"
                    />
                    <path
                        d="M -50 670 C 280 580 620 740 1000 640 C 1240 570 1380 650 1490 610"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1.25"
                    />
                    <path
                        d="M -50 725 C 270 645 600 790 960 695 C 1210 630 1360 705 1490 670"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1"
                        strokeOpacity="0.75"
                        strokeDasharray="6 8"
                    />
                    <path
                        d="M -50 780 C 260 710 560 840 920 750 C 1180 690 1340 760 1490 730"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1"
                        strokeOpacity="0.6"
                    />
                </g>

                {/* ============================================================ */}
                {/* 3. SUBTLE BOTTOM-REGION GEOMETRIC ACCENTS */}
                {/* ============================================================ */}
                <g mask={`url(#${uid}-bottom-fade)`}>
                    {/* Low celestial orbital curve anchored in the bottom right */}
                    <circle
                        cx="1260"
                        cy="820"
                        r="340"
                        stroke={color}
                        strokeWidth="1"
                        strokeOpacity="0.14"
                        strokeDasharray="5 7"
                    />
                    <circle
                        cx="1260"
                        cy="820"
                        r="220"
                        stroke={secondaryColor}
                        strokeWidth="1"
                        strokeOpacity="0.09"
                    />

                    {/* Precision crosshairs in lower field */}
                    <g stroke={color} strokeOpacity="0.25" strokeWidth="1">
                        <path d="M 280 685 L 280 695 M 275 690 L 285 690" />
                        <path d="M 860 635 L 860 645 M 855 640 L 865 640" />
                        <path d="M 1240 675 L 1240 685 M 1235 680 L 1245 680" />
                        <path d="M 460 775 L 460 785 M 455 780 L 465 780" />
                    </g>

                    {/* Accent nodes along wave crests */}
                    <circle cx="720" cy="520" r="3" fill={color} fillOpacity="0.4" />
                    <circle cx="720" cy="520" r="7" stroke={color} strokeOpacity="0.2" strokeWidth="1" />

                    <circle cx="1120" cy="410" r="2.5" fill={secondaryColor} fillOpacity="0.45" />
                    <circle cx="1120" cy="410" r="6" stroke={secondaryColor} strokeOpacity="0.2" strokeWidth="1" />

                    <circle cx="360" cy="350" r="2" fill={color} fillOpacity="0.35" />
                    <circle cx="1000" cy="640" r="2.5" fill={color} fillOpacity="0.35" />
                </g>
            </svg>
        </div>
    );
}

export function BoardEmptyStateGraphic({
    color = "#0079BF",
    className,
}: BoardBackgroundGraphicProps) {
    const uid = useMemo(() => `empty-${Math.random().toString(36).slice(2, 8)}`, []);
    const secondaryColor = useMemo(() => getSecondaryColor(color), [color]);

    return (
        <div className={cn("flex flex-col items-center justify-center select-none", className)}>
            <svg
                viewBox="0 0 160 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-32 h-auto mb-3"
            >
                <defs>
                    <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id={`${uid}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.12" />
                    </linearGradient>
                </defs>

                <rect
                    x="12"
                    y="12"
                    width="136"
                    height="86"
                    rx="12"
                    fill={`url(#${uid}-grad)`}
                    stroke={`url(#${uid}-stroke)`}
                    strokeWidth="1"
                />

                <path
                    d="M 12 62 C 45 42 75 74 110 52 C 128 41 140 50 148 46 L 148 98 L 12 98 Z"
                    fill={color}
                    fillOpacity="0.12"
                />
                <path
                    d="M 14 52 C 46 34 76 64 112 44 C 130 34 142 42 148 38"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeOpacity="0.45"
                />
                <path
                    d="M 14 62 C 46 44 76 74 112 54 C 130 44 142 52 148 48"
                    stroke={secondaryColor}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    strokeDasharray="3 3"
                />

                <circle cx="112" cy="44" r="3" fill={color} fillOpacity="0.6" />
                <circle cx="112" cy="44" r="6" stroke={color} strokeOpacity="0.25" strokeWidth="1" />
            </svg>
        </div>
    );
}

export default BoardBackgroundGraphic;

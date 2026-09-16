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
            {/* Seamless full-page ambient color wash */}
            <div
                className="absolute -top-[25%] -right-[15%] w-[85vw] h-[85vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[140px] opacity-[0.14] dark:opacity-[0.09] transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle, ${color} 0%, ${secondaryColor} 45%, transparent 75%)`,
                }}
            />
            <div
                className="absolute -bottom-[30%] -left-[15%] w-[90vw] h-[90vw] max-w-[1200px] max-h-[1200px] rounded-full blur-[160px] opacity-[0.10] dark:opacity-[0.07] transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle, ${secondaryColor} 0%, ${color} 50%, transparent 75%)`,
                }}
            />

            {/* Seamless Full-Page Abstract Vector Art */}
            <svg
                viewBox="0 0 1440 900"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full opacity-60 dark:opacity-40 transition-opacity duration-700"
            >
                <defs>
                    {/* Primary flowing wave gradient */}
                    <linearGradient id={`${uid}-wave1`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                        <stop offset="45%" stopColor={secondaryColor} stopOpacity="0.08" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>

                    {/* Secondary counter-wave gradient */}
                    <linearGradient id={`${uid}-wave2`} x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.14" />
                        <stop offset="55%" stopColor={color} stopOpacity="0.05" />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.01" />
                    </linearGradient>

                    {/* Deep atmospheric layer */}
                    <linearGradient id={`${uid}-wave3`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.09" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>

                    {/* Contour line gradient */}
                    <linearGradient id={`${uid}-contour`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.06" />
                        <stop offset="30%" stopColor={color} stopOpacity="0.32" />
                        <stop offset="70%" stopColor={secondaryColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>

                    {/* Hairline stroke gradient */}
                    <linearGradient id={`${uid}-hairline`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.04" />
                        <stop offset="50%" stopColor={color} stopOpacity="0.24" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.03" />
                    </linearGradient>

                    {/* Mask for soft edge feathering */}
                    <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                        <stop offset="90%" stopColor="white" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* ============================================================ */}
                {/* 1. BROAD ORGANIC SILK WAVES (Atmospheric Fills) */}
                {/* ============================================================ */}
                <g mask={`url(#${uid}-fade)`}>
                    {/* Background deep wave */}
                    <path
                        d="M -100 320 Q 320 180 720 380 T 1540 260 L 1540 950 L -100 950 Z"
                        fill={`url(#${uid}-wave3)`}
                    />

                    {/* Middle sweeping silk wave */}
                    <path
                        d="M -100 480 C 260 340 580 620 960 420 C 1220 280 1380 440 1540 380 L 1540 950 L -100 950 Z"
                        fill={`url(#${uid}-wave1)`}
                    />

                    {/* Foreground counter-flow wave */}
                    <path
                        d="M -100 680 C 340 820 680 540 1080 660 C 1320 730 1440 600 1540 560 L 1540 950 L -100 950 Z"
                        fill={`url(#${uid}-wave2)`}
                    />
                </g>

                {/* ============================================================ */}
                {/* 2. TOPOGRAPHIC & GENERATIVE CONTOUR RIBBONS (Precision Lines) */}
                {/* ============================================================ */}
                <g>
                    {/* Primary flow contour bundle */}
                    <path
                        d="M -50 210 C 380 90 740 360 1140 220 C 1320 160 1420 230 1500 200"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1.25"
                    />
                    <path
                        d="M -50 255 C 370 140 730 400 1130 270 C 1310 210 1410 275 1500 248"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.85"
                    />
                    <path
                        d="M -50 305 C 360 195 720 445 1120 325 C 1300 265 1400 325 1500 300"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.7"
                    />
                    <path
                        d="M -50 360 C 350 255 710 495 1110 385 C 1290 325 1390 380 1500 355"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.55"
                        strokeDasharray="4 6"
                    />
                    <path
                        d="M -50 420 C 340 320 700 550 1100 450 C 1280 390 1380 440 1500 415"
                        stroke={`url(#${uid}-contour)`}
                        strokeWidth="1"
                        strokeOpacity="0.45"
                    />

                    {/* Lower harmonic wave bundle */}
                    <path
                        d="M -50 560 C 280 430 640 680 1020 540 C 1260 450 1390 530 1500 490"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1.25"
                    />
                    <path
                        d="M -50 610 C 290 485 650 730 1030 595 C 1270 505 1400 580 1500 545"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1"
                        strokeOpacity="0.8"
                    />
                    <path
                        d="M -50 665 C 300 545 660 785 1040 655 C 1280 565 1410 635 1500 605"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1"
                        strokeOpacity="0.65"
                    />
                    <path
                        d="M -50 725 C 310 610 670 845 1050 720 C 1290 630 1420 695 1500 670"
                        stroke={`url(#${uid}-hairline)`}
                        strokeWidth="1"
                        strokeOpacity="0.5"
                        strokeDasharray="6 8"
                    />
                </g>

                {/* ============================================================ */}
                {/* 3. GENERATIVE ARCHITECTURAL ARCS & HORIZON ACCENTS */}
                {/* ============================================================ */}
                <g>
                    {/* Vast celestial orbital curve */}
                    <circle
                        cx="1200"
                        cy="120"
                        r="380"
                        stroke={color}
                        strokeWidth="1"
                        strokeOpacity="0.12"
                        strokeDasharray="5 7"
                    />
                    <circle
                        cx="1200"
                        cy="120"
                        r="240"
                        stroke={secondaryColor}
                        strokeWidth="1"
                        strokeOpacity="0.08"
                    />

                    {/* Delicate precision crosshairs & micro-constellation nodes */}
                    <g stroke={color} strokeOpacity="0.25" strokeWidth="1">
                        <path d="M 280 145 L 280 155 M 275 150 L 285 150" />
                        <path d="M 860 115 L 860 125 M 855 120 L 865 120" />
                        <path d="M 1240 465 L 1240 475 M 1235 470 L 1245 470" />
                        <path d="M 460 625 L 460 635 M 455 630 L 465 630" />
                    </g>

                    {/* Soft glowing accent nodes on intersection ridges */}
                    <circle cx="740" cy="360" r="3" fill={color} fillOpacity="0.35" />
                    <circle cx="740" cy="360" r="7" stroke={color} strokeOpacity="0.18" strokeWidth="1" />

                    <circle cx="1140" cy="220" r="2.5" fill={secondaryColor} fillOpacity="0.4" />
                    <circle cx="1140" cy="220" r="6" stroke={secondaryColor} strokeOpacity="0.2" strokeWidth="1" />

                    <circle cx="370" cy="140" r="2" fill={color} fillOpacity="0.3" />
                    <circle cx="1020" cy="540" r="2.5" fill={color} fillOpacity="0.3" />
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

                {/* Minimalist modern generative art badge */}
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

                {/* Fluid art curves inside badge */}
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

                {/* Floating focus node */}
                <circle cx="112" cy="44" r="3" fill={color} fillOpacity="0.6" />
                <circle cx="112" cy="44" r="6" stroke={color} strokeOpacity="0.25" strokeWidth="1" />
            </svg>
        </div>
    );
}

export default BoardBackgroundGraphic;

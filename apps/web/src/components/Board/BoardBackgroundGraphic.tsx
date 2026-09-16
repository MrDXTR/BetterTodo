import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BoardBackgroundGraphicProps {
    color?: string;
    className?: string;
}

/**
 * Parses hex color and generates harmonic secondary and glow color variants
 */
function getHarmonicColors(hex: string) {
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) {
        return {
            primary: hex,
            secondary: hex,
            accent: hex,
        };
    }

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    // Warm/cool harmonic shift
    const r2 = Math.min(255, Math.max(0, Math.round(r * 0.85 + b * 0.2)));
    const g2 = Math.min(255, Math.max(0, Math.round(g * 0.75 + r * 0.25)));
    const b2 = Math.min(255, Math.max(0, Math.round(b * 0.9 + g * 0.15)));

    // Brighter accent for hairlines & crest nodes
    const r3 = Math.min(255, Math.round(r * 1.15 + 20));
    const g3 = Math.min(255, Math.round(g * 1.15 + 20));
    const b3 = Math.min(255, Math.round(b * 1.15 + 20));

    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return {
        primary: hex,
        secondary: `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`,
        accent: `#${toHex(r3)}${toHex(g3)}${toHex(b3)}`,
    };
}

export function BoardBackgroundGraphic({
    color = "#0079BF",
    className,
}: BoardBackgroundGraphicProps) {
    const uid = useMemo(() => `art-${Math.random().toString(36).slice(2, 8)}`, []);
    const { primary, secondary, accent } = useMemo(() => getHarmonicColors(color), [color]);

    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden select-none",
                className,
            )}
            aria-hidden="true"
        >
            {/* ============================================================ */}
            {/* 1. SEAMLESS FULL-CANVAS AMBIENT RADIANT ATMOSPHERE */}
            {/* ============================================================ */}
            {/* Soft full-page atmospheric color wash */}
            <div
                className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05] transition-opacity duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${primary} 0%, transparent 65%)`,
                }}
            />

            {/* Deep luminous ambient glow rising from the bottom floor */}
            <div
                className="absolute inset-x-0 bottom-0 h-[60vh] opacity-25 dark:opacity-20 transition-opacity duration-1000"
                style={{
                    background: `radial-gradient(ellipse 110% 80% at 50% 100%, ${primary} 0%, ${secondary} 45%, transparent 75%)`,
                }}
            />

            {/* Secondary warm accent glow off-center at bottom right */}
            <div
                className="absolute -bottom-20 right-0 w-[55vw] h-[45vh] rounded-full blur-[130px] opacity-20 dark:opacity-15 transition-opacity duration-1000"
                style={{
                    background: `radial-gradient(circle at 60% 80%, ${secondary} 0%, transparent 70%)`,
                }}
            />

            {/* ============================================================ */}
            {/* 2. ARTISTIC HORIZON DUNES & CONTOUR RIBBONS (Anchored to Bottom) */}
            {/* ============================================================ */}
            <div className="absolute inset-x-0 bottom-0 h-[52vh] min-h-[340px] max-h-[580px] w-full overflow-hidden">
                <svg
                    viewBox="0 0 1440 500"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    className="w-full h-full opacity-70 dark:opacity-50 transition-opacity duration-700"
                >
                    <defs>
                        {/* Smooth vertical fade mask: ensures 0% cutoff at top */}
                        <linearGradient id={`${uid}-vmask`} x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="65%" stopColor="white" stopOpacity="0.85" />
                            <stop offset="90%" stopColor="white" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </linearGradient>

                        {/* Back wave gradient */}
                        <linearGradient id={`${uid}-grad-back`} x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={primary} stopOpacity="0.18" />
                            <stop offset="50%" stopColor={secondary} stopOpacity="0.08" />
                            <stop offset="100%" stopColor={primary} stopOpacity="0.01" />
                        </linearGradient>

                        {/* Mid wave gradient */}
                        <linearGradient id={`${uid}-grad-mid`} x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor={secondary} stopOpacity="0.22" />
                            <stop offset="60%" stopColor={primary} stopOpacity="0.10" />
                            <stop offset="100%" stopColor={secondary} stopOpacity="0.02" />
                        </linearGradient>

                        {/* Front base wave gradient */}
                        <linearGradient id={`${uid}-grad-front`} x1="50%" y1="100%" x2="50%" y2="0%">
                            <stop offset="0%" stopColor={primary} stopOpacity="0.28" />
                            <stop offset="40%" stopColor={secondary} stopOpacity="0.14" />
                            <stop offset="100%" stopColor={primary} stopOpacity="0.02" />
                        </linearGradient>

                        {/* Glowing contour line gradient */}
                        <linearGradient id={`${uid}-grad-line`} x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor={primary} stopOpacity="0.08" />
                            <stop offset="25%" stopColor={accent} stopOpacity="0.45" />
                            <stop offset="70%" stopColor={secondary} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={primary} stopOpacity="0.06" />
                        </linearGradient>

                        {/* Subtle secondary hairline gradient */}
                        <linearGradient id={`${uid}-grad-hairline`} x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor={secondary} stopOpacity="0.05" />
                            <stop offset="50%" stopColor={primary} stopOpacity="0.30" />
                            <stop offset="100%" stopColor={secondary} stopOpacity="0.04" />
                        </linearGradient>
                    </defs>

                    <g mask={`url(#${uid}-vmask)`}>
                        {/* -------------------------------------------------- */}
                        {/* LAYER 1: Deep Background Rolling Wave (Highest Crest) */}
                        {/* -------------------------------------------------- */}
                        <path
                            d="M 0 500 L 0 160 C 240 70 540 240 880 130 C 1140 45 1320 140 1440 95 L 1440 500 Z"
                            fill={`url(#${uid}-grad-back)`}
                        />

                        {/* Crest hairline */}
                        <path
                            d="M 0 160 C 240 70 540 240 880 130 C 1140 45 1320 140 1440 95"
                            stroke={`url(#${uid}-grad-line)`}
                            strokeWidth="1.25"
                        />
                        <path
                            d="M 0 190 C 240 105 540 270 880 165 C 1140 85 1320 175 1440 130"
                            stroke={`url(#${uid}-grad-hairline)`}
                            strokeWidth="1"
                            strokeOpacity="0.75"
                            strokeDasharray="4 6"
                        />

                        {/* -------------------------------------------------- */}
                        {/* LAYER 2: Middle Harmonized Swell Wave */}
                        {/* -------------------------------------------------- */}
                        <path
                            d="M 0 500 L 0 250 C 300 340 660 190 1020 280 C 1220 330 1360 270 1440 240 L 1440 500 Z"
                            fill={`url(#${uid}-grad-mid)`}
                        />

                        {/* Middle wave contour lines */}
                        <path
                            d="M 0 250 C 300 340 660 190 1020 280 C 1220 330 1360 270 1440 240"
                            stroke={`url(#${uid}-grad-line)`}
                            strokeWidth="1.5"
                        />
                        <path
                            d="M 0 280 C 300 365 660 225 1020 310 C 1220 355 1360 300 1440 270"
                            stroke={`url(#${uid}-grad-hairline)`}
                            strokeWidth="1"
                            strokeOpacity="0.8"
                        />
                        <path
                            d="M 0 315 C 300 395 660 265 1020 345 C 1220 385 1360 335 1440 305"
                            stroke={`url(#${uid}-grad-hairline)`}
                            strokeWidth="1"
                            strokeOpacity="0.6"
                            strokeDasharray="5 7"
                        />

                        {/* -------------------------------------------------- */}
                        {/* LAYER 3: Foreground Base Dune (Anchored Solid to Bottom) */}
                        {/* -------------------------------------------------- */}
                        <path
                            d="M 0 500 L 0 370 C 260 310 580 410 940 340 C 1180 290 1340 360 1440 330 L 1440 500 Z"
                            fill={`url(#${uid}-grad-front)`}
                        />

                        <path
                            d="M 0 370 C 260 310 580 410 940 340 C 1180 290 1340 360 1440 330"
                            stroke={`url(#${uid}-grad-line)`}
                            strokeWidth="1.25"
                        />
                        <path
                            d="M 0 405 C 260 350 580 445 940 380 C 1180 335 1340 400 1440 370"
                            stroke={`url(#${uid}-grad-hairline)`}
                            strokeWidth="1"
                            strokeOpacity="0.7"
                        />
                        <path
                            d="M 0 440 C 260 395 580 475 940 420 C 1180 380 1340 440 1440 415"
                            stroke={`url(#${uid}-grad-hairline)`}
                            strokeWidth="1"
                            strokeOpacity="0.5"
                            strokeDasharray="6 8"
                        />

                        {/* -------------------------------------------------- */}
                        {/* LAYER 4: Generative Accent Nodes & Celestial Orbit */}
                        {/* -------------------------------------------------- */}
                        {/* Rising horizon orbit arc at bottom-right */}
                        <ellipse
                            cx="1260"
                            cy="460"
                            rx="320"
                            ry="180"
                            stroke={primary}
                            strokeWidth="1"
                            strokeOpacity="0.2"
                            strokeDasharray="4 6"
                        />
                        <ellipse
                            cx="1260"
                            cy="460"
                            rx="220"
                            ry="120"
                            stroke={secondary}
                            strokeWidth="1"
                            strokeOpacity="0.14"
                        />

                        {/* Delicate precision crosshairs */}
                        <g stroke={accent} strokeOpacity="0.35" strokeWidth="1">
                            <path d="M 280 240 L 280 250 M 275 245 L 285 245" />
                            <path d="M 880 125 L 880 135 M 875 130 L 885 130" />
                            <path d="M 1180 285 L 1180 295 M 1175 290 L 1185 290" />
                        </g>

                        {/* Subtle glowing starlight nodes along wave crests */}
                        <circle cx="880" cy="130" r="3" fill={accent} fillOpacity="0.6" />
                        <circle cx="880" cy="130" r="7" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />

                        <circle cx="1020" cy="280" r="2.5" fill={primary} fillOpacity="0.5" />
                        <circle cx="1020" cy="280" r="6" stroke={primary} strokeOpacity="0.2" strokeWidth="1" />

                        <circle cx="940" cy="340" r="2.5" fill={secondary} fillOpacity="0.5" />
                    </g>
                </svg>
            </div>
        </div>
    );
}

export function BoardEmptyStateGraphic({
    color = "#0079BF",
    className,
}: BoardBackgroundGraphicProps) {
    const uid = useMemo(() => `empty-${Math.random().toString(36).slice(2, 8)}`, []);
    const { primary, secondary } = useMemo(() => getHarmonicColors(color), [color]);

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
                        <stop offset="0%" stopColor={primary} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={secondary} stopOpacity="0.06" />
                    </linearGradient>
                    <linearGradient id={`${uid}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primary} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={secondary} stopOpacity="0.12" />
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
                    fill={primary}
                    fillOpacity="0.12"
                />
                <path
                    d="M 14 52 C 46 34 76 64 112 44 C 130 34 142 42 148 38"
                    stroke={primary}
                    strokeWidth="1.2"
                    strokeOpacity="0.45"
                />
                <path
                    d="M 14 62 C 46 44 76 74 112 54 C 130 44 142 52 148 48"
                    stroke={secondary}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    strokeDasharray="3 3"
                />

                <circle cx="112" cy="44" r="3" fill={primary} fillOpacity="0.6" />
                <circle cx="112" cy="44" r="6" stroke={primary} strokeOpacity="0.25" strokeWidth="1" />
            </svg>
        </div>
    );
}

export default BoardBackgroundGraphic;

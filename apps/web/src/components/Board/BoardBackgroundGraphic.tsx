import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BoardBackgroundGraphicProps {
    color?: string;
    className?: string;
}

function hexToHsl(hex: string): [number, number, number] {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return [0, 0, l * 100];

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
        case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
        case g:
            h = (b - r) / d + 2;
            break;
        case b:
            h = (r - g) / d + 4;
            break;
    }
    return [h * 60, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360;
    s = Math.min(100, Math.max(0, s)) / 100;
    l = Math.min(100, Math.max(0, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let [r, g, b] = [0, 0, 0];
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const toHex = (n: number) =>
        Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getPalette(hex: string) {
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return { primary: hex, secondary: hex, accent: hex };

    const [h, s, l] = hexToHsl(hex);
    const secondary = hslToHex(h - 18, s, Math.max(20, Math.min(80, l * 0.9)));
    const accent = hslToHex(h + 6, Math.min(90, s + 20), 50);

    return { primary: hex, secondary, accent };
}

export function BoardBackgroundGraphic({
    color = "#0079BF",
    className,
}: BoardBackgroundGraphicProps) {
    const uid = useMemo(() => `art-${Math.random().toString(36).slice(2, 8)}`, []);
    const { primary, secondary, accent } = useMemo(() => getPalette(color), [color]);

    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden select-none",
                className,
            )}
            aria-hidden="true"
        >
            {/* Ambient wash, top */}
            <div
                className="absolute inset-x-0 top-0 h-full opacity-[0.04] dark:opacity-[0.035] sm:opacity-[0.05] sm:dark:opacity-[0.04] transition-opacity duration-700"
                style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${primary} 0%, transparent 70%)`,
                }}
            />

            {/* Ambient glow, anchored low */}
            <div
                className="absolute inset-x-0 bottom-0 h-[32vh] sm:h-[50vh] opacity-[0.12] dark:opacity-[0.08] sm:opacity-[0.16] sm:dark:opacity-[0.10] transition-opacity duration-700"
                style={{
                    background: `radial-gradient(ellipse 100% 75% at 50% 100%, ${primary} 0%, ${secondary} 45%, transparent 75%)`,
                }}
            />

            {/* Wave silhouette */}
            <div className="absolute inset-x-0 bottom-0 h-[30vh] min-h-[180px] max-h-[300px] sm:h-[46vh] sm:min-h-[300px] sm:max-h-[500px] w-full">
                <svg
                    viewBox="0 0 1440 440"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMax slice"
                    className="w-full h-full opacity-70 dark:opacity-55 sm:opacity-80 sm:dark:opacity-60 transition-opacity duration-700"
                >
                    <defs>
                        <linearGradient id={`${uid}-vmask`} x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="70%" stopColor="white" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                        <mask id={`${uid}-mask`}>
                            <rect width="1440" height="440" fill={`url(#${uid}-vmask)`} />
                        </mask>

                        <linearGradient id={`${uid}-grad-back`} x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={primary} stopOpacity="0.16" />
                            <stop offset="55%" stopColor={secondary} stopOpacity="0.07" />
                            <stop offset="100%" stopColor={primary} stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-grad-front`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor={secondary} stopOpacity="0.26" />
                            <stop offset="50%" stopColor={primary} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={secondary} stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id={`${uid}-grad-line`} x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
                            <stop offset="30%" stopColor={accent} stopOpacity="0.6" />
                            <stop offset="70%" stopColor={accent} stopOpacity="0.45" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
                        </linearGradient>
                    </defs>

                    <g mask={`url(#${uid}-mask)`}>
                        {/* Back wave */}
                        <path
                            d="M 0 440 L 0 190 C 260 100 560 250 900 150 C 1140 80 1310 170 1440 130 L 1440 440 Z"
                            fill={`url(#${uid}-grad-back)`}
                        />
                        <path
                            d="M 0 190 C 260 100 560 250 900 150 C 1140 80 1310 170 1440 130"
                            stroke={`url(#${uid}-grad-line)`}
                            strokeWidth="1.5"
                        />

                        {/* Front wave */}
                        <path
                            d="M 0 440 L 0 300 C 280 380 620 260 960 320 C 1180 360 1330 300 1440 280 L 1440 440 Z"
                            fill={`url(#${uid}-grad-front)`}
                        />
                        <path
                            d="M 0 300 C 280 380 620 260 960 320 C 1180 360 1330 300 1440 280"
                            stroke={`url(#${uid}-grad-line)`}
                            strokeWidth="1.75"
                        />

                        <circle cx="900" cy="150" r="3.5" fill={accent} fillOpacity="0.85" />
                        <circle
                            cx="900"
                            cy="150"
                            r="8"
                            stroke={accent}
                            strokeOpacity="0.3"
                            strokeWidth="1"
                        />
                        <circle cx="720" cy="255" r="3" fill={accent} fillOpacity="0.7" />
                        <circle cx="1180" cy="360" r="2.5" fill={accent} fillOpacity="0.55" />
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
    const { primary, secondary, accent } = useMemo(() => getPalette(color), [color]);

    return (
        <div className={cn("flex flex-col items-center justify-center select-none", className)}>
            <svg
                viewBox="0 0 160 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-24 sm:w-32 h-auto mb-3"
            >
                <defs>
                    <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primary} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={secondary} stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id={`${uid}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primary} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={secondary} stopOpacity="0.15" />
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

                <rect x="26" y="34" width="72" height="6" rx="3" fill={primary} fillOpacity="0.2" />
                <rect
                    x="26"
                    y="50"
                    width="48"
                    height="6"
                    rx="3"
                    fill={primary}
                    fillOpacity="0.13"
                />

                <path
                    d="M 14 66 C 46 48 76 78 112 58 C 128 49 140 55 148 52"
                    stroke={accent}
                    strokeWidth="1.2"
                    strokeOpacity="0.5"
                />
                <circle cx="112" cy="58" r="3" fill={accent} fillOpacity="0.8" />
                <circle
                    cx="112"
                    cy="58"
                    r="6.5"
                    stroke={accent}
                    strokeOpacity="0.3"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
}

export default BoardBackgroundGraphic;

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BoardBackgroundGraphicProps {
    color?: string;
    className?: string;
}

export function BoardBackgroundGraphic({
    color = "#0079BF",
    className,
}: BoardBackgroundGraphicProps) {
    // Unique ID prefix to prevent gradient collisions if multiple boards render
    const uid = useMemo(() => `bg-${Math.random().toString(36).slice(2, 8)}`, []);

    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden select-none",
                className,
            )}
            aria-hidden="true"
        >
            {/* Ambient corner gradient wash */}
            <div
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 dark:opacity-10 transition-opacity duration-700"
                style={{
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                }}
            />
            <div
                className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-10 dark:opacity-8 transition-opacity duration-700"
                style={{
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                }}
            />

            {/* Minimal SVG Kanban Illustration in bottom-right canvas */}
            <div className="absolute right-4 bottom-4 sm:right-12 sm:bottom-8 w-72 sm:w-96 md:w-[440px] opacity-40 dark:opacity-30 transition-opacity duration-500">
                <svg
                    viewBox="0 0 440 300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                >
                    <defs>
                        {/* Primary gradient fill */}
                        <linearGradient id={`${uid}-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
                        </linearGradient>

                        {/* Secondary soft gradient */}
                        <linearGradient id={`${uid}-soft`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.14" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                        </linearGradient>

                        {/* Border gradient */}
                        <linearGradient id={`${uid}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                            <stop offset="50%" stopColor={color} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.06" />
                        </linearGradient>

                        {/* Accent gradient for pills */}
                        <linearGradient id={`${uid}-accent`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.25" />
                        </linearGradient>
                    </defs>

                    {/* Subtle connecting dotted grid lines */}
                    <path
                        d="M 20 70 L 420 70 M 20 180 L 420 180"
                        stroke={color}
                        strokeOpacity="0.08"
                        strokeDasharray="4 6"
                        strokeWidth="1"
                    />

                    {/* ============================================================ */}
                    {/* COLUMN 1 (To Do) */}
                    {/* ============================================================ */}
                    <g className="transition-transform duration-500">
                        {/* Column Container */}
                        <rect
                            x="24"
                            y="40"
                            width="116"
                            height="240"
                            rx="14"
                            fill={`url(#${uid}-soft)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        {/* Column Header Pill */}
                        <rect
                            x="36"
                            y="54"
                            width="48"
                            height="8"
                            rx="4"
                            fill={`url(#${uid}-accent)`}
                        />
                        <circle cx="124" cy="58" r="3" fill={color} fillOpacity="0.3" />

                        {/* Card 1 */}
                        <rect
                            x="34"
                            y="74"
                            width="96"
                            height="52"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        <rect x="44" y="86" width="56" height="5" rx="2.5" fill={color} fillOpacity="0.4" />
                        <rect x="44" y="96" width="38" height="4" rx="2" fill={color} fillOpacity="0.2" />
                        <circle cx="48" cy="113" r="3.5" fill={color} fillOpacity="0.35" />
                        <circle cx="58" cy="113" r="3.5" fill={color} fillOpacity="0.25" />

                        {/* Card 2 */}
                        <rect
                            x="34"
                            y="136"
                            width="96"
                            height="60"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        <rect x="44" y="148" width="68" height="5" rx="2.5" fill={color} fillOpacity="0.4" />
                        <rect x="44" y="158" width="48" height="4" rx="2" fill={color} fillOpacity="0.2" />
                        <rect x="44" y="167" width="58" height="4" rx="2" fill={color} fillOpacity="0.15" />
                        <rect x="44" y="180" width="28" height="6" rx="3" fill={`url(#${uid}-accent)`} />

                        {/* Card 3 (Ghost outline) */}
                        <rect
                            x="34"
                            y="206"
                            width="96"
                            height="44"
                            rx="8"
                            stroke={color}
                            strokeOpacity="0.18"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                            fill="none"
                        />
                    </g>

                    {/* ============================================================ */}
                    {/* COLUMN 2 (In Progress - Floating / Elevated) */}
                    {/* ============================================================ */}
                    <g className="transition-transform duration-500">
                        {/* Column Container */}
                        <rect
                            x="162"
                            y="25"
                            width="116"
                            height="255"
                            rx="14"
                            fill={`url(#${uid}-soft)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        {/* Header Pill */}
                        <rect
                            x="174"
                            y="39"
                            width="58"
                            height="8"
                            rx="4"
                            fill={`url(#${uid}-accent)`}
                        />
                        <circle cx="262" cy="43" r="3" fill={color} fillOpacity="0.3" />

                        {/* Card 1 (Active / Highlighted with glow) */}
                        <rect
                            x="172"
                            y="59"
                            width="96"
                            height="74"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1.25"
                        />
                        {/* Card Cover Banner preview */}
                        <rect
                            x="173"
                            y="60"
                            width="94"
                            height="18"
                            rx="7"
                            fill={`url(#${uid}-accent)`}
                            fillOpacity="0.35"
                        />
                        <rect x="182" y="86" width="62" height="5" rx="2.5" fill={color} fillOpacity="0.45" />
                        <rect x="182" y="96" width="44" height="4" rx="2" fill={color} fillOpacity="0.25" />
                        {/* Checklist progress bar */}
                        <rect x="182" y="112" width="76" height="3.5" rx="1.75" fill={color} fillOpacity="0.15" />
                        <rect x="182" y="112" width="46" height="3.5" rx="1.75" fill={color} fillOpacity="0.6" />

                        {/* Card 2 */}
                        <rect
                            x="172"
                            y="143"
                            width="96"
                            height="54"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        <rect x="182" y="155" width="50" height="5" rx="2.5" fill={color} fillOpacity="0.4" />
                        <rect x="182" y="165" width="68" height="4" rx="2" fill={color} fillOpacity="0.2" />
                        <rect x="182" y="179" width="32" height="7" rx="3.5" fill={color} fillOpacity="0.25" />

                        {/* Card 3 */}
                        <rect
                            x="172"
                            y="207"
                            width="96"
                            height="48"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        <rect x="182" y="219" width="58" height="5" rx="2.5" fill={color} fillOpacity="0.35" />
                        <rect x="182" y="229" width="36" height="4" rx="2" fill={color} fillOpacity="0.18" />
                    </g>

                    {/* ============================================================ */}
                    {/* COLUMN 3 (Completed) */}
                    {/* ============================================================ */}
                    <g className="transition-transform duration-500">
                        {/* Column Container */}
                        <rect
                            x="300"
                            y="48"
                            width="116"
                            height="232"
                            rx="14"
                            fill={`url(#${uid}-soft)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        {/* Header Pill */}
                        <rect
                            x="312"
                            y="62"
                            width="44"
                            height="8"
                            rx="4"
                            fill={`url(#${uid}-accent)`}
                        />
                        <circle cx="400" cy="66" r="3" fill={color} fillOpacity="0.3" />

                        {/* Card 1 (Completed with Checkmark badge) */}
                        <rect
                            x="310"
                            y="82"
                            width="96"
                            height="56"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        <rect x="320" y="94" width="56" height="5" rx="2.5" fill={color} fillOpacity="0.35" />
                        <rect x="320" y="104" width="40" height="4" rx="2" fill={color} fillOpacity="0.18" />
                        {/* Mini checkmark circle */}
                        <circle cx="392" cy="122" r="5" fill={color} fillOpacity="0.35" />
                        <path
                            d="M 389.5 122 L 391.2 123.7 L 394.5 120.5"
                            stroke="white"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Card 2 */}
                        <rect
                            x="310"
                            y="148"
                            width="96"
                            height="50"
                            rx="8"
                            fill={`url(#${uid}-primary)`}
                            stroke={`url(#${uid}-stroke)`}
                            strokeWidth="1"
                        />
                        <rect x="320" y="160" width="64" height="5" rx="2.5" fill={color} fillOpacity="0.35" />
                        <rect x="320" y="170" width="34" height="4" rx="2" fill={color} fillOpacity="0.18" />
                        <circle cx="392" cy="184" r="5" fill={color} fillOpacity="0.3" />
                        <path
                            d="M 389.5 184 L 391.2 185.7 L 394.5 182.5"
                            stroke="white"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
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
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.08" />
                    </linearGradient>
                    <linearGradient id={`${uid}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.15" />
                    </linearGradient>
                </defs>

                {/* Left Mini Column */}
                <rect
                    x="15"
                    y="15"
                    width="38"
                    height="80"
                    rx="6"
                    fill={`url(#${uid}-grad)`}
                    stroke={`url(#${uid}-border)`}
                    strokeWidth="1"
                />
                <rect x="20" y="22" width="18" height="3" rx="1.5" fill={color} fillOpacity="0.5" />
                <rect x="19" y="30" width="30" height="18" rx="4" fill={color} fillOpacity="0.18" />
                <rect x="19" y="52" width="30" height="22" rx="4" fill={color} fillOpacity="0.18" />

                {/* Center Mini Column (Active / Raised) */}
                <rect
                    x="61"
                    y="8"
                    width="38"
                    height="94"
                    rx="6"
                    fill={`url(#${uid}-grad)`}
                    stroke={`url(#${uid}-border)`}
                    strokeWidth="1.25"
                />
                <rect x="66" y="16" width="22" height="3" rx="1.5" fill={color} fillOpacity="0.7" />
                <rect x="65" y="24" width="30" height="26" rx="4" fill={color} fillOpacity="0.25" />
                <rect x="65" y="54" width="30" height="20" rx="4" fill={color} fillOpacity="0.2" />
                <rect x="65" y="78" width="30" height="16" rx="4" fill={color} fillOpacity="0.15" />

                {/* Right Mini Column */}
                <rect
                    x="107"
                    y="15"
                    width="38"
                    height="80"
                    rx="6"
                    fill={`url(#${uid}-grad)`}
                    stroke={`url(#${uid}-border)`}
                    strokeWidth="1"
                />
                <rect x="112" y="22" width="16" height="3" rx="1.5" fill={color} fillOpacity="0.5" />
                <rect x="111" y="30" width="30" height="24" rx="4" fill={color} fillOpacity="0.18" />
                <circle cx="134" cy="46" r="2.5" fill={color} fillOpacity="0.5" />
            </svg>
        </div>
    );
}
export default BoardBackgroundGraphic;

"use client";

import React, { useEffect, useId, useState } from "react";
import { motion, useTime, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export interface SquigglyTextProps {
    /**
     * The text (or any node) to wrap with the squiggly effect.
     */
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /**
     * Number of distinct displacement frames to cycle through.
     * Higher = smoother wobble, more SVG filters in the DOM.
     * @default 5
     */
    steps?: number;
    /**
     * Time between filter swaps, in milliseconds.
     * Lower = more frantic; higher = lazier wave.
     * @default 80
     */
    stepDuration?: number;
    /**
     * Maximum displacement in px. Bigger = more squiggly.
     * Pass a single number for a constant scale, or a tuple to alternate
     * between two values per step (matches the original Lucas Bebber demo).
     * @default [6, 8]
     */
    scale?: number | [number, number];
    /**
     * Turbulence base frequency. Lower values produce longer, smoother waves;
     * higher values produce tighter, jitterier noise.
     * @default 0.02
     */
    baseFrequency?: number;
    /**
     * Number of turbulence octaves. Higher = more detailed noise.
     * @default 3
     */
    numOctaves?: number;
    /**
     * Render the wrapper as this element type.
     * @default "span"
     */
    as?: "span" | "div";
}

function DesktopSquigglyText({
    children,
    steps = 5,
    stepDuration = 80,
    scale = [6, 8],
    baseFrequency = 0.02,
    numOctaves = 3,
    as = "span",
    className,
    style,
}: SquigglyTextProps) {
    const reactId = useId();
    // useId can produce ":" / "_" which aren't valid in CSS url(#…) refs.
    const safeId = reactId.replace(/[:_]/g, "");
    const filterId = (i: number) => `squiggly-${safeId}-${i}`;

    const filters = React.useMemo(
        () => Array.from({ length: steps }, (_, i) => `url(#${filterId(i)})`),
        // filterId is stable per render
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [steps, safeId],
    );

    const time = useTime();
    const filter = useTransform(
        time,
        (t) => filters[Math.floor(t / stepDuration) % filters.length],
    );

    const scaleAt = (i: number) => (Array.isArray(scale) ? scale[i % scale.length] : scale);

    const Wrapper = as === "div" ? motion.div : motion.span;

    return (
        <Wrapper style={{ filter, ...style }} className={cn("inline-block", className)}>
            <svg
                aria-hidden
                className="pointer-events-none absolute h-0 w-0 overflow-hidden"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {Array.from({ length: steps }).map((_, i) => (
                        <filter id={filterId(i)} key={i}>
                            <feTurbulence
                                baseFrequency={baseFrequency}
                                numOctaves={numOctaves}
                                result="noise"
                                seed={i}
                            />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale={scaleAt(i)} />
                        </filter>
                    ))}
                </defs>
            </svg>
            {children}
        </Wrapper>
    );
}

export function SquigglyText(props: SquigglyTextProps) {
    const [isMobileOrReducedMotion, setIsMobileOrReducedMotion] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const check = () => {
            const isTouchOrSmall =
                typeof window !== "undefined" &&
                (window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
                    window.innerWidth < 768);
            const prefersReduced =
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            setIsMobileOrReducedMotion(Boolean(isTouchOrSmall || prefersReduced));
        };
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // On mobile screens, touch devices, or reduced motion preferences,
    // bypass the heavy SVG feTurbulence animation loop and use lightweight GPU-accelerated CSS shimmer.
    if (!isMounted || isMobileOrReducedMotion) {
        const Wrapper = props.as === "div" ? "div" : "span";
        return (
            <Wrapper
                className={cn("inline-block squiggly-mobile-shimmer", props.className)}
                style={props.style}
            >
                {props.children}
            </Wrapper>
        );
    }

    return <DesktopSquigglyText {...props} />;
}

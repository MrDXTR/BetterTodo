import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

export type TransitionVariant =
    "circle" | "square" | "triangle" | "diamond" | "hexagon" | "rectangle" | "star";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
    duration?: number;
    variant?: TransitionVariant;
    /** When true, the transition expands from the viewport center instead of the button center. */
    fromCenter?: boolean;
}

function polygonCollapsed(cx: number, cy: number, vertexCount: number): string {
    const pairs = Array.from({ length: vertexCount }, () => `${cx}px ${cy}px`).join(", ");
    return `polygon(${pairs})`;
}

function getThemeTransitionClipPaths(
    variant: TransitionVariant,
    cx: number,
    cy: number,
    maxRadius: number,
    viewportWidth: number,
    viewportHeight: number,
): [string, string] {
    switch (variant) {
        case "circle":
            return [`circle(0px at ${cx}px ${cy}px)`, `circle(${maxRadius}px at ${cx}px ${cy}px)`];
        case "square": {
            const halfW = Math.max(cx, viewportWidth - cx);
            const halfH = Math.max(cy, viewportHeight - cy);
            const halfSide = Math.max(halfW, halfH) * 1.05;
            const end = [
                `${cx - halfSide}px ${cy - halfSide}px`,
                `${cx + halfSide}px ${cy - halfSide}px`,
                `${cx + halfSide}px ${cy + halfSide}px`,
                `${cx - halfSide}px ${cy + halfSide}px`,
            ].join(", ");
            return [polygonCollapsed(cx, cy, 4), `polygon(${end})`];
        }
        case "triangle": {
            const scale = maxRadius * 2.2;
            const dx = (Math.sqrt(3) / 2) * scale;
            const verts = [
                `${cx}px ${cy - scale}px`,
                `${cx + dx}px ${cy + 0.5 * scale}px`,
                `${cx - dx}px ${cy + 0.5 * scale}px`,
            ].join(", ");
            return [polygonCollapsed(cx, cy, 3), `polygon(${verts})`];
        }
        case "diamond": {
            const verts = [
                `${cx}px ${cy - maxRadius}px`,
                `${cx + maxRadius}px ${cy}px`,
                `${cx}px ${cy + maxRadius}px`,
                `${cx - maxRadius}px ${cy}px`,
            ].join(", ");
            return [polygonCollapsed(cx, cy, 4), `polygon(${verts})`];
        }
        case "hexagon": {
            const verts = Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                return `${cx + maxRadius * Math.cos(angle)}px ${cy + maxRadius * Math.sin(angle)}px`;
            }).join(", ");
            return [polygonCollapsed(cx, cy, 6), `polygon(${verts})`];
        }
        case "rectangle": {
            const end = [
                `0px 0px`,
                `${viewportWidth}px 0px`,
                `${viewportWidth}px ${viewportHeight}px`,
                `0px ${viewportHeight}px`,
            ].join(", ");
            return [polygonCollapsed(cx, cy, 4), `polygon(${end})`];
        }
        case "star": {
            const points = 5;
            const innerRadius = maxRadius * 0.45;
            const verts = Array.from({ length: points * 2 }, (_, i) => {
                const r = i % 2 === 0 ? maxRadius : innerRadius;
                const angle = (Math.PI / points) * i - Math.PI / 2;
                return `${cx + r * Math.cos(angle)}px ${cy + r * Math.sin(angle)}px`;
            }).join(", ");
            return [polygonCollapsed(cx, cy, points * 2), `polygon(${verts})`];
        }
        default:
            return [`circle(0px at ${cx}px ${cy}px)`, `circle(${maxRadius}px at ${cx}px ${cy}px)`];
    }
}

export const AnimatedThemeToggler = ({
    className,
    duration = 400,
    variant,
    fromCenter = false,
    ...props
}: AnimatedThemeTogglerProps) => {
    const shape = variant ?? "circle";
    const [isDark, setIsDark] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const updateTheme = () => {
            setIsDark(document.documentElement.classList.contains("dark"));
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const toggleTheme = useCallback(() => {
        const button = buttonRef.current;
        if (!button) return;

        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

        let x: number;
        let y: number;
        if (fromCenter) {
            x = viewportWidth / 2;
            y = viewportHeight / 2;
        } else {
            const { top, left, width, height } = button.getBoundingClientRect();
            x = left + width / 2;
            y = top + height / 2;
        }

        const maxRadius = Math.hypot(
            Math.max(x, viewportWidth - x),
            Math.max(y, viewportHeight - y),
        );

        const applyTheme = () => {
            const newTheme = !isDark;
            setIsDark(newTheme);
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", newTheme ? "dark" : "light");
        };

        if (typeof document.startViewTransition !== "function") {
            applyTheme();
            return;
        }

        const clipPath = getThemeTransitionClipPaths(
            shape,
            x,
            y,
            maxRadius,
            viewportWidth,
            viewportHeight,
        );

        const root = document.documentElement;
        root.dataset.magicuiThemeVt = "active";
        root.style.setProperty("--magicui-theme-toggle-vt-duration", `${duration}ms`);
        root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
        const cleanup = () => {
            delete root.dataset.magicuiThemeVt;
            root.style.removeProperty("--magicui-theme-toggle-vt-duration");
            root.style.removeProperty("--magicui-theme-vt-clip-from");
        };

        const transition = document.startViewTransition(() => {
            flushSync(applyTheme);
        });
        if (typeof transition?.finished?.finally === "function") {
            transition.finished.finally(cleanup);
        } else {
            cleanup();
        }

        const ready = transition?.ready;
        if (ready && typeof ready.then === "function") {
            ready.then(() => {
                document.documentElement.animate(
                    {
                        clipPath,
                    },
                    {
                        duration,
                        easing: shape === "star" ? "linear" : "ease-in-out",
                        fill: "forwards",
                        pseudoElement: "::view-transition-new(root)",
                    },
                );
            });
        }
    }, [shape, fromCenter, duration, isDark]);

    return (
        <button
            type="button"
            ref={buttonRef}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-ui-tooltip="theme-toggle-tooltip"
            className={cn(className)}
            {...props}
        >
            {isDark ? (
                <Sun className="h-4 w-4 shrink-0 transition-transform duration-200" />
            ) : (
                <Moon className="h-4 w-4 shrink-0 transition-transform duration-200" />
            )}
            <span id="theme-toggle-tooltip" role="tooltip" className="hidden">
                Toggle theme
            </span>
        </button>
    );
};

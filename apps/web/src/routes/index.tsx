"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
    LayoutGrid,
    Users,
    Zap,
    Bell,
    Shield,
    Sparkles,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SquigglyText } from "@/components/ui/squiggly-text";
import Text3DFlip from "@/components/ui/text-3d-flip";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { ShineBorder } from "@/components/ui/shine-border";

export const Route = createFileRoute("/")({
    component: LandingPage,
});

function LandingPage() {
    return (
        <>
            <Authenticated>
                <RedirectToDashboard />
            </Authenticated>
            <AuthLoading>
                <LandingLoading />
            </AuthLoading>
            <Unauthenticated>
                <LandingContent />
            </Unauthenticated>
        </>
    );
}

function LandingLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
    );
}

/* ─── Fade-up animation wrapper ─── */
function FadeUp({
    children,
    delay = 0,
    className = "",
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

const features = [
    {
        title: "Kanban Boards",
        description:
            "Drag-and-drop cards across customisable lists. Visualise your entire workflow at a single glance.",
        link: "/sign-in",
    },
    {
        title: "Real-time Collaboration",
        description:
            "Invite teammates, assign cards, and watch changes appear instantly — no refresh needed.",
        link: "/sign-in",
    },
    {
        title: "Lightning Fast",
        description:
            "Built on Convex for sub-100 ms reactivity. Clean UI, keyboard shortcuts, built for speed.",
        link: "/sign-in",
    },
    {
        title: "Smart Notifications",
        description:
            "Stay in the loop with contextual alerts for mentions, due-dates, and board activity.",
        link: "/sign-in",
    },
    {
        title: "Workspace Security",
        description:
            "Role-based access control so the right people see the right boards — nothing more.",
        link: "/sign-in",
    },
    {
        title: "Powerful Checklists",
        description:
            "Break cards into steps with nested checklists, progress rings, and completion tracking.",
        link: "/sign-in",
    },
];

const perks = [
    { icon: CheckCircle2, label: "No credit card required" },
    { icon: CheckCircle2, label: "Free forever plan" },
    { icon: CheckCircle2, label: "Cancel anytime" },
];

function LandingContent() {
    return (
        <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">
            {/* ── NAV ── */}
            <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 backdrop-blur-md bg-black/30">
                <span className="text-lg font-bold tracking-tight">
                    <Text3DFlip
                        className="text-lg font-bold tracking-tight"
                        textClassName="text-white"
                        flipTextClassName="text-violet-400"
                        rotateDirection="top"
                        staggerDuration={0.03}
                    >
                        BetterTodo
                    </Text3DFlip>
                </span>
                <div className="flex items-center gap-3">
                    <Link to="/sign-in">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                            Sign In
                        </Button>
                    </Link>
                    <Link to="/sign-in">
                        <div className="relative rounded-full overflow-hidden">
                            <ShineBorder
                                shineColor={["#a855f7", "#6366f1", "#ec4899"]}
                                duration={6}
                                borderWidth={1.5}
                            />
                            <Button
                                size="sm"
                                className="relative bg-violet-600 hover:bg-violet-500 text-white rounded-full px-5 font-semibold transition-all duration-200"
                            >
                                Get Started
                            </Button>
                        </div>
                    </Link>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-16 text-center overflow-hidden">
                {/* Background hexagon grid */}
                <HexagonPattern
                    radius={48}
                    gap={4}
                    className="fill-violet-500/5 stroke-violet-500/10"
                    hexagons={[
                        [2, 2],
                        [4, 1],
                        [6, 3],
                        [1, 5],
                        [8, 2],
                        [3, 7],
                        [7, 5],
                        [5, 4],
                        [9, 6],
                        [0, 3],
                        [10, 4],
                    ]}
                />

                {/* Glow blobs */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

                {/* Badge */}
                <FadeUp delay={0.05}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8">
                        <Sparkles className="w-3.5 h-3.5" />
                        Powered by real-time sync
                    </div>
                </FadeUp>

                {/* Headline */}
                <FadeUp delay={0.1}>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">
                        Organise tasks. <br className="hidden sm:block" />
                        <SquigglyText
                            scale={[7, 10]}
                            stepDuration={70}
                            className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent"
                        >
                            Ship faster.
                        </SquigglyText>
                    </h1>
                </FadeUp>

                {/* Sub-headline */}
                <FadeUp delay={0.18}>
                    <p className="mt-6 text-lg md:text-xl text-white/50 max-w-xl leading-relaxed">
                        A beautiful Kanban board for makers who value clarity, speed, and seamless
                        team collaboration.
                    </p>
                </FadeUp>

                {/* CTAs */}
                <FadeUp
                    delay={0.26}
                    className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link to="/sign-in">
                        <div className="relative rounded-full overflow-hidden">
                            <ShineBorder
                                shineColor={["#a855f7", "#818cf8", "#ec4899"]}
                                duration={5}
                                borderWidth={1.5}
                            />
                            <Button
                                size="lg"
                                className="relative bg-violet-600 hover:bg-violet-500 text-white rounded-full px-8 text-base font-semibold gap-2 transition-all duration-200 group"
                            >
                                Start for free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </Link>
                    <Link to="/sign-in">
                        <Button
                            size="lg"
                            variant="ghost"
                            className="rounded-full px-8 text-base text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                        >
                            Sign in
                        </Button>
                    </Link>
                </FadeUp>

                {/* Social proof perks */}
                <FadeUp delay={0.34} className="mt-10 flex flex-wrap justify-center gap-6">
                    {perks.map(({ icon: Icon, label }) => (
                        <span
                            key={label}
                            className="flex items-center gap-1.5 text-sm text-white/40"
                        >
                            <Icon className="w-4 h-4 text-violet-400" />
                            {label}
                        </span>
                    ))}
                </FadeUp>

                {/* Hero visual — glowing board mockup */}
                <FadeUp delay={0.42} className="mt-20 w-full max-w-4xl mx-auto">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl shadow-violet-900/30">
                        <ShineBorder
                            shineColor={["#7c3aed", "#4f46e5", "#db2777"]}
                            duration={8}
                            borderWidth={1}
                        />
                        {/* Fake board UI */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                                <div className="ml-4 h-5 w-40 rounded bg-white/10" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { title: "Backlog", count: 4, color: "bg-white/10" },
                                    { title: "In Progress", count: 2, color: "bg-violet-500/20" },
                                    { title: "Done", count: 6, color: "bg-emerald-500/10" },
                                ].map((col) => (
                                    <div
                                        key={col.title}
                                        className={`rounded-xl p-3 ${col.color} border border-white/8`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                                                {col.title}
                                            </span>
                                            <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-white/40">
                                                {col.count}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {Array.from({
                                                length: col.count > 2 ? 2 : col.count,
                                            }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="rounded-lg bg-white/5 border border-white/8 p-2.5"
                                                >
                                                    <div className="h-2 w-3/4 rounded bg-white/20 mb-1.5" />
                                                    <div className="h-1.5 w-1/2 rounded bg-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </FadeUp>
            </section>

            {/* ── FEATURES ── */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <FadeUp className="text-center mb-4">
                        <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">
                            Features
                        </span>
                    </FadeUp>
                    <FadeUp delay={0.06} className="text-center mb-2">
                        <h2 className="text-3xl md:text-5xl font-bold">
                            <Text3DFlip
                                className="inline-flex text-3xl md:text-5xl font-bold"
                                textClassName="text-white"
                                flipTextClassName="text-violet-400"
                                staggerDuration={0.04}
                            >
                                Everything you need
                            </Text3DFlip>
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.1} className="text-center mb-12">
                        <p className="text-white/40 text-lg max-w-xl mx-auto">
                            Powerful tools that stay out of your way.
                        </p>
                    </FadeUp>
                    <FadeUp delay={0.14}>
                        <HoverEffect
                            items={features}
                            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        />
                    </FadeUp>
                </div>
            </section>

            {/* ── ICON STATS ── */}
            <section className="py-20 px-4 border-t border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { icon: LayoutGrid, label: "Boards", value: "Unlimited" },
                        { icon: Users, label: "Teammates", value: "∞" },
                        { icon: Zap, label: "Latency", value: "< 100 ms" },
                        { icon: Bell, label: "Uptime", value: "99.9 %" },
                    ].map(({ icon: Icon, label, value }, i) => (
                        <FadeUp key={label} delay={i * 0.08}>
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <Icon className="w-6 h-6 text-violet-400" />
                                </div>
                                <span className="text-2xl font-bold text-white">{value}</span>
                                <span className="text-sm text-white/40">{label}</span>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-28 px-4">
                <FadeUp className="max-w-lg mx-auto">
                    <NeonGradientCard
                        neonColors={{ firstColor: "#7c3aed", secondColor: "#4f46e5" }}
                        borderSize={2}
                        borderRadius={24}
                        className="w-full"
                    >
                        <div className="flex flex-col items-center text-center gap-5 py-4">
                            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-400/20">
                                <Shield className="w-7 h-7 text-violet-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                                Ready to{" "}
                                <SquigglyText
                                    scale={[5, 8]}
                                    stepDuration={75}
                                    className="text-violet-400"
                                >
                                    get organised?
                                </SquigglyText>
                            </h2>
                            <p className="text-white/50 text-sm max-w-xs">
                                Create your first board in seconds. No setup, no friction.
                            </p>
                            <Link to="/sign-in">
                                <Button
                                    size="lg"
                                    className="bg-violet-600 hover:bg-violet-500 text-white rounded-full px-8 font-semibold gap-2 group transition-all duration-200"
                                >
                                    Create your first board
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </NeonGradientCard>
                </FadeUp>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 py-8 px-6 text-center text-white/30 text-sm">
                © {new Date().getFullYear()} BetterTodo. Built with ❤️ and Convex.
            </footer>
        </div>
    );
}

function RedirectToDashboard() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate({ to: "/dashboard", replace: true });
    }, [navigate]);
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050507]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
    );
}

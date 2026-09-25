import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize2,
    RotateCcw,
    X,
    Sparkles,
    Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShineBorder } from "@/components/ui/shine-border";

export interface HeroVideoDialogProps {
    videoSrc: string;
    videoMp4Src?: string;
    thumbnailSrc?: string;
    thumbnailAlt?: string;
    title?: string;
    className?: string;
    autoPlay?: boolean;
    isModalOpen?: boolean;
    onModalOpenChange?: (open: boolean) => void;
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HeroVideoDialog({
    videoSrc,
    videoMp4Src,
    thumbnailSrc,
    thumbnailAlt = "BetterTodo product demo video",
    title = "BetterTodo • Real-time Collaboration Demo",
    className,
    autoPlay = true,
    isModalOpen: controlledModalOpen,
    onModalOpenChange,
}: HeroVideoDialogProps) {
    const [internalModalOpen, setInternalModalOpen] = useState(false);
    const isModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen;
    const setIsModalOpen = useCallback(
        (open: boolean) => {
            if (controlledModalOpen === undefined) {
                setInternalModalOpen(open);
            }
            onModalOpenChange?.(open);
        },
        [controlledModalOpen, onModalOpenChange]
    );

    // Inline video state
    const inlineVideoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isHovered, setIsHovered] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    // Modal video state
    const modalVideoRef = useRef<HTMLVideoElement>(null);
    const [isModalPlaying, setIsModalPlaying] = useState(true);
    const [isModalMuted, setIsModalMuted] = useState(false);
    const [modalTime, setModalTime] = useState(0);
    const [modalDuration, setModalDuration] = useState(0);
    const [modalRate, setModalRate] = useState(1);
    const [showModalSpeedMenu, setShowModalSpeedMenu] = useState(false);

    // Synchronize inline video time
    const handleTimeUpdate = useCallback(() => {
        if (inlineVideoRef.current) {
            setCurrentTime(inlineVideoRef.current.currentTime);
            setDuration(inlineVideoRef.current.duration || 0);
        }
    }, []);

    const handleModalTimeUpdate = useCallback(() => {
        if (modalVideoRef.current) {
            setModalTime(modalVideoRef.current.currentTime);
            setModalDuration(modalVideoRef.current.duration || 0);
        }
    }, []);

    // Toggle inline play/pause
    const togglePlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!inlineVideoRef.current) return;
        if (inlineVideoRef.current.paused) {
            inlineVideoRef.current.play().catch(() => {});
            setIsPlaying(true);
        } else {
            inlineVideoRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    // Toggle modal play/pause
    const toggleModalPlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!modalVideoRef.current) return;
        if (modalVideoRef.current.paused) {
            modalVideoRef.current.play().catch(() => {});
            setIsModalPlaying(true);
        } else {
            modalVideoRef.current.pause();
            setIsModalPlaying(false);
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!inlineVideoRef.current) return;
        const nextMuted = !inlineVideoRef.current.muted;
        inlineVideoRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
    }, []);

    const toggleModalMute = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!modalVideoRef.current) return;
        const nextMuted = !modalVideoRef.current.muted;
        modalVideoRef.current.muted = nextMuted;
        setIsModalMuted(nextMuted);
    }, []);

    // Restart
    const handleRestart = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (inlineVideoRef.current) {
            inlineVideoRef.current.currentTime = 0;
            inlineVideoRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    }, []);

    const handleModalRestart = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (modalVideoRef.current) {
            modalVideoRef.current.currentTime = 0;
            modalVideoRef.current.play().catch(() => {});
            setIsModalPlaying(true);
        }
    }, []);

    // Seek
    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const targetPercent = parseFloat(e.target.value);
        if (inlineVideoRef.current && inlineVideoRef.current.duration) {
            const nextTime = (targetPercent / 100) * inlineVideoRef.current.duration;
            inlineVideoRef.current.currentTime = nextTime;
            setCurrentTime(nextTime);
        }
    }, []);

    const handleModalSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const targetPercent = parseFloat(e.target.value);
        if (modalVideoRef.current && modalVideoRef.current.duration) {
            const nextTime = (targetPercent / 100) * modalVideoRef.current.duration;
            modalVideoRef.current.currentTime = nextTime;
            setModalTime(nextTime);
        }
    }, []);

    // Set speed
    const changeSpeed = useCallback((speed: number) => {
        if (inlineVideoRef.current) {
            inlineVideoRef.current.playbackRate = speed;
            setPlaybackRate(speed);
            setShowSpeedMenu(false);
        }
    }, []);

    const changeModalSpeed = useCallback((speed: number) => {
        if (modalVideoRef.current) {
            modalVideoRef.current.playbackRate = speed;
            setModalRate(speed);
            setShowModalSpeedMenu(false);
        }
    }, []);

    // Open lightbox modal
    const openModal = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            const currentPos = inlineVideoRef.current?.currentTime || 0;
            // Pause inline video
            inlineVideoRef.current?.pause();
            setIsPlaying(false);
            setIsModalOpen(true);

            // Wait for modal mount to set time and play
            setTimeout(() => {
                if (modalVideoRef.current) {
                    modalVideoRef.current.currentTime = currentPos;
                    modalVideoRef.current.muted = false; // unmute in cinema mode if user wants
                    setIsModalMuted(false);
                    modalVideoRef.current.play().catch(() => {
                        // In case browser autoplay policy blocks unmuted play
                        if (modalVideoRef.current) {
                            modalVideoRef.current.muted = true;
                            setIsModalMuted(true);
                            modalVideoRef.current.play().catch(() => {});
                        }
                    });
                    setIsModalPlaying(true);
                }
            }, 100);
        },
        [setIsModalOpen]
    );

    // Close lightbox modal
    const closeModal = useCallback(() => {
        const modalPos = modalVideoRef.current?.currentTime || 0;
        setIsModalOpen(false);
        // Resume inline video at current position
        if (inlineVideoRef.current) {
            inlineVideoRef.current.currentTime = modalPos;
            inlineVideoRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    }, [setIsModalOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isModalOpen) {
                closeModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen, closeModal]);

    // Initial play event handlers
    useEffect(() => {
        const video = inlineVideoRef.current;
        if (!video) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onLoaded = () => setDuration(video.duration || 0);

        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("loadedmetadata", onLoaded);

        if (autoPlay) {
            video.play().catch(() => {
                setIsPlaying(false);
            });
        }

        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("loadedmetadata", onLoaded);
        };
    }, [autoPlay]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const modalProgressPercent = modalDuration > 0 ? (modalTime / modalDuration) * 100 : 0;

    return (
        <div className={cn("relative w-full group/video", className)}>
            {/* macOS Browser Mockup Container */}
            <div
                className="relative rounded-2xl overflow-hidden border border-border/80 bg-card shadow-2xl shadow-violet-500/10 dark:shadow-violet-950/40 transition-all duration-300 group-hover/video:shadow-violet-500/20"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                    setIsHovered(false);
                    setShowSpeedMenu(false);
                }}
            >
                {/* Animated Shine Border */}
                <ShineBorder
                    shineColor={["#7c3aed", "#4f46e5", "#db2777"]}
                    duration={8}
                    borderWidth={1.5}
                />

                {/* Window Chrome Header */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/60 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border/70 select-none">
                    {/* Traffic Lights */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/40 shadow-xs" />
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/40 shadow-xs" />
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/40 shadow-xs" />
                    </div>

                    {/* Window Controls */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        {/* Audio Toggle */}
                        <button
                            type="button"
                            onClick={toggleMute}
                            title={isMuted ? "Unmute" : "Mute"}
                            aria-label={isMuted ? "Unmute video" : "Mute video"}
                            className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors active:scale-95"
                        >
                            {isMuted ? (
                                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            ) : (
                                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
                            )}
                        </button>

                        {/* Expand to Cinema Mode */}
                        <button
                            type="button"
                            onClick={openModal}
                            title="Expand to Cinema Mode"
                            aria-label="Expand video to cinema mode"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground/80 hover:text-foreground bg-background/50 hover:bg-background/90 border border-border/60 transition-all active:scale-95"
                        >
                            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-500" />
                            <span className="hidden md:inline text-[11px]">Cinema</span>
                        </button>
                    </div>
                </div>

                {/* Video Container */}
                <div
                    className="relative aspect-video w-full bg-zinc-950 overflow-hidden cursor-pointer"
                    onClick={togglePlay}
                >
                    <video
                        ref={inlineVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        autoPlay={autoPlay}
                        muted={isMuted}
                        loop
                        poster={thumbnailSrc}
                        onTimeUpdate={handleTimeUpdate}
                    >
                        <source src={videoSrc} type="video/webm" />
                        {videoMp4Src && <source src={videoMp4Src} type="video/mp4" />}
                        Your browser does not support the video tag.
                    </video>

                    {/* Big Center Play / Pause Indicator on Pause or Hover */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
                            !isPlaying || isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <motion.div
                            initial={false}
                            animate={{ scale: !isPlaying ? 1.05 : 0.95, opacity: !isPlaying ? 1 : 0.8 }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            className="p-3.5 sm:p-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl text-white group-hover/video:bg-violet-600/80 transition-colors"
                        >
                            {!isPlaying ? (
                                <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-0.5 text-white" />
                            ) : (
                                <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current text-white" />
                            )}
                        </motion.div>
                    </div>

                    {/* Bottom Floating Control Bar (Shows on Hover or when Paused) */}
                    <div
                        className={cn(
                            "absolute bottom-0 inset-x-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 pointer-events-auto",
                            isHovered || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Progress Scrubber */}
                        <div className="relative flex items-center w-full group/slider mb-2">
                            <div className="relative w-full h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer group-hover/slider:h-2.5 transition-all">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={progressPercent || 0}
                                onChange={handleSeek}
                                aria-label="Seek video"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between text-white text-xs">
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Play / Pause */}
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                    className="p-1 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4 fill-current" />
                                    ) : (
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                    )}
                                </button>

                                {/* Restart */}
                                <button
                                    type="button"
                                    onClick={handleRestart}
                                    title="Replay from start"
                                    aria-label="Replay from start"
                                    className="p-1 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                {/* Volume / Mute */}
                                <button
                                    type="button"
                                    onClick={toggleMute}
                                    aria-label={isMuted ? "Unmute" : "Mute"}
                                    className="p-1 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-4 h-4 text-white/70" />
                                    ) : (
                                        <Volume2 className="w-4 h-4 text-violet-400" />
                                    )}
                                </button>

                                {/* Time Display */}
                                <span className="text-[11px] sm:text-xs font-mono text-white/80 select-none">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Speed Selector */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                        aria-label="Playback speed"
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-mono transition-colors active:scale-95"
                                    >
                                        <Gauge className="w-3 h-3 text-white/70" />
                                        <span>{playbackRate}x</span>
                                    </button>

                                    {showSpeedMenu && (
                                        <div className="absolute bottom-full mb-1 right-0 bg-zinc-900 border border-white/15 rounded-lg py-1 shadow-xl z-20 flex flex-col min-w-[70px]">
                                            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                                <button
                                                    key={rate}
                                                    type="button"
                                                    onClick={() => changeSpeed(rate)}
                                                    className={cn(
                                                        "px-3 py-1 text-left text-xs font-mono hover:bg-violet-600/30 transition-colors",
                                                        playbackRate === rate
                                                            ? "text-violet-400 font-semibold"
                                                            : "text-white/80"
                                                    )}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Fullscreen Modal Trigger */}
                                <button
                                    type="button"
                                    onClick={openModal}
                                    title="Open Cinema Mode"
                                    aria-label="Open Cinema Mode"
                                    className="p-1 rounded-md hover:bg-white/10 transition-colors active:scale-95 flex items-center gap-1 text-[11px]"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-bar Feature Callout */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-card/90 border-t border-border/60 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                        <span className="font-medium text-foreground">{title}</span>
                    </div>
                    <button
                        type="button"
                        onClick={openModal}
                        className="text-violet-600 dark:text-violet-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                        <span>Watch in Cinema Mode</span>
                        <Maximize2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Cinema Lightbox Modal Dialog */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeModal}
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 16 }}
                            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                                    <span className="text-sm font-semibold text-white truncate">
                                        {title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-400 hidden sm:inline">
                                        Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Esc</kbd> to close
                                    </span>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        aria-label="Close modal"
                                        className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Video Player */}
                            <div className="relative aspect-video w-full bg-black">
                                <video
                                    ref={modalVideoRef}
                                    className="w-full h-full object-contain"
                                    playsInline
                                    autoPlay
                                    muted={isModalMuted}
                                    loop
                                    onTimeUpdate={handleModalTimeUpdate}
                                    onClick={toggleModalPlay}
                                >
                                    <source src={videoSrc} type="video/webm" />
                                    {videoMp4Src && <source src={videoMp4Src} type="video/mp4" />}
                                </video>

                                {/* Modal Controls HUD */}
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                    {/* Scrubber */}
                                    <div className="relative flex items-center w-full group/modalSlider mb-3">
                                        <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer group-hover/modalSlider:h-3 transition-all">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 rounded-full"
                                                style={{ width: `${modalProgressPercent}%` }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={modalProgressPercent || 0}
                                            onChange={handleModalSeek}
                                            aria-label="Seek video"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-between text-white text-sm">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={toggleModalPlay}
                                                aria-label={isModalPlaying ? "Pause" : "Play"}
                                                className="p-1.5 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                            >
                                                {isModalPlaying ? (
                                                    <Pause className="w-5 h-5 fill-current" />
                                                ) : (
                                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleModalRestart}
                                                title="Replay from start"
                                                aria-label="Replay from start"
                                                className="p-1.5 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={toggleModalMute}
                                                aria-label={isModalMuted ? "Unmute" : "Mute"}
                                                className="p-1.5 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                            >
                                                {isModalMuted ? (
                                                    <VolumeX className="w-5 h-5 text-white/70" />
                                                ) : (
                                                    <Volume2 className="w-5 h-5 text-violet-400" />
                                                )}
                                            </button>

                                            <span className="font-mono text-xs text-white/80 select-none">
                                                {formatTime(modalTime)} / {formatTime(modalDuration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Speed Selector */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowModalSpeedMenu(!showModalSpeedMenu)}
                                                    aria-label="Playback speed"
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-white/10 text-xs font-mono transition-colors active:scale-95"
                                                >
                                                    <Gauge className="w-3.5 h-3.5 text-white/70" />
                                                    <span>{modalRate}x</span>
                                                </button>

                                                {showModalSpeedMenu && (
                                                    <div className="absolute bottom-full mb-1 right-0 bg-zinc-900 border border-white/15 rounded-lg py-1 shadow-xl z-20 flex flex-col min-w-[80px]">
                                                        {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                                            <button
                                                                key={rate}
                                                                type="button"
                                                                onClick={() => changeModalSpeed(rate)}
                                                                className={cn(
                                                                    "px-3 py-1.5 text-left text-xs font-mono hover:bg-violet-600/30 transition-colors",
                                                                    modalRate === rate
                                                                        ? "text-violet-400 font-semibold"
                                                                        : "text-white/80"
                                                                )}
                                                            >
                                                                {rate}x
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Fullscreen browser API */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (modalVideoRef.current) {
                                                        if (document.fullscreenElement) {
                                                            document.exitFullscreen().catch(() => {});
                                                        } else {
                                                            modalVideoRef.current.requestFullscreen().catch(() => {});
                                                        }
                                                    }
                                                }}
                                                aria-label="Full screen"
                                                className="p-1.5 rounded-md hover:bg-white/10 transition-colors active:scale-95"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

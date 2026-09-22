let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    try {
        if (!audioCtx) {
            const AudioContextClass =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }

        if (audioCtx && audioCtx.state === "suspended") {
            void audioCtx.resume();
        }

        return audioCtx;
    } catch {
        return null;
    }
}

/**
 * Play a subtle, elegant chime using the Web Audio API
 */
export function playNotificationChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const now = ctx.currentTime;

        // Note 1: Gentle primary tone (D5 sliding smoothly to A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.36);

        // Note 2: Delicate harmonic shimmer (D6)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6

        gain2.gain.setValueAtTime(0.001, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + 0.08);
        osc2.stop(now + 0.46);
    } catch {
        // Silently fail if blocked by browser policy
    }
}

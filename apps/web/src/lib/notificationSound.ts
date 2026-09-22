/**
 * Play a crisp notification chime using Web Audio API (matching aluxbound-web)
 */
export function playNotificationChime() {
    if (typeof window === "undefined") return;

    try {
        const AudioContextConstructor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextConstructor) return;

        const context = new AudioContextConstructor();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(740, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.16);

        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        oscillator.addEventListener("ended", () => void context.close());
    } catch {
        // Silently ignore if blocked by browser policy
    }
}

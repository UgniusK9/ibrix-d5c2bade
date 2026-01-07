import { useCallback, useRef } from "react";

/**
 * Simple beep sound for notifications (no external assets).
 * Note: Most browsers require a prior user interaction before audio can play.
 */
export function useNotificationSound() {
  const lastPlayedAtRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const play = useCallback((opts?: { frequency?: number; durationMs?: number; volume?: number }) => {
    const now = Date.now();
    // throttle to avoid rapid-fire beeps
    if (now - lastPlayedAtRef.current < 800) return;
    lastPlayedAtRef.current = now;

    try {
      const AudioContextImpl = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextImpl) return;

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextImpl();
      const ctx = audioCtxRef.current;

      // resume if suspended
      void ctx.resume?.();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      const frequency = opts?.frequency ?? 880;
      const durationMs = opts?.durationMs ?? 140;
      const volume = opts?.volume ?? 0.06;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      // quick attack/decay envelope
      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(t0);
      oscillator.stop(t0 + durationMs / 1000 + 0.02);

      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      // ignore audio errors
    }
  }, []);

  return { play };
}

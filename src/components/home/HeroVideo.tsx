import { useEffect, useRef, useState } from "react";

export const HERO_VIDEO_MP4 = "/videos/hero.mp4";
export const HERO_VIDEO_WEBM = "/videos/hero.webm";
export const HERO_VIDEO_POSTER = "/videos/hero-poster.jpg";

interface HeroVideoProps {
  className?: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  return reduced;
}

/**
 * Probe for /videos/hero.mp4. Shared by HeroSection (layout switch)
 * and HeroVideo (background layer).
 */
export function useHeroVideoAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(HERO_VIDEO_MP4, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}

/**
 * Full-bleed cinematic hero video (Daylight-style).
 *
 * - Plays muted + looped + inline so browsers allow autoplay.
 * - Renders nothing when the mp4 is missing or the user prefers
 *   reduced motion — the caller shows its classic hero instead.
 * - Poster image doubles as the paint before video frames arrive.
 */
export function HeroVideo({ className }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const available = useHeroVideoAvailable();
  const reducedMotion = usePrefersReducedMotion();

  // Keep autoplay resilient: some browsers pause backgrounded videos.
  useEffect(() => {
    if (!available || reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      video.play().catch(() => {
        /* autoplay blocked — poster stays visible, hero still complete */
      });
    };
    play();
    document.addEventListener("visibilitychange", play);
    return () => document.removeEventListener("visibilitychange", play);
  }, [available, reducedMotion]);

  if (!available || reducedMotion) return null;

  return (
    <div className={className} aria-hidden="true">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_VIDEO_POSTER}
        tabIndex={-1}
      >
        <source src={HERO_VIDEO_WEBM} type="video/webm" />
        <source src={HERO_VIDEO_MP4} type="video/mp4" />
      </video>
      {/* Readability scrim — keeps the overlaid copy legible over any footage */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--background) / 0.95) 0%, hsl(var(--background) / 0.9) 26%, hsl(var(--background) / 0.5) 38%, hsl(var(--background) / 0.12) 48%, hsl(var(--background) / 0) 56%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

/**
 * AmbientSpaceMusic — loopable ambient track for the intro cinematic.
 *
 * ASSET REQUIRED:
 *   Place a loopable MP3 at:  frontend/public/assets/audio/space-ambient.mp3
 *
 *   Recommended free sources (no attribution required):
 *   • Pixabay: https://pixabay.com/music/search/space%20ambient/
 *   • Mixkit:  https://mixkit.co/free-stock-music/  (sci-fi / ambient)
 *   • Uppbeat: https://uppbeat.io/browse/music/space
 *
 * FALLBACK: If the file is missing the component renders null silently.
 *
 * Features:
 *   • Volume 0.3, loop true
 *   • Gentle fade-in on mount  (4 s)
 *   • Gentle fade-out when introPlaying turns false  (2 s)
 *   • Browser autoplay handled: starts on first user interaction if
 *     the initial play() is blocked by the browser policy.
 *   • Respects the audioMuted flag from useGameState — toggling mute
 *     in the menu will suppress playback on next intro launch too.
 *
 * Caffeine-safe: additive, no Caffeine config touched.
 */
import { useEffect, useRef } from "react";
import { useIntroStore } from "./useIntroStore";
import { useGameState } from "../state/useGameState";

const MUSIC_SRC = "/assets/audio/space-ambient.mp3";
const TARGET_VOLUME = 0.3;
const FADE_IN_MS = 4_000;
const FADE_OUT_MS = 2_000;
const TICK_MS = 50;

// ── Smooth volume ramp helpers ────────────────────────────────────────────

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  onDone?: () => void,
): ReturnType<typeof setInterval> {
  const steps = Math.max(1, Math.round(durationMs / TICK_MS));
  const delta = (to - from) / steps;
  let step = 0;
  audio.volume = Math.max(0, Math.min(1, from));

  const id = setInterval(() => {
    step++;
    const next = from + delta * step;
    audio.volume = Math.max(0, Math.min(1, next));
    if (step >= steps) {
      audio.volume = Math.max(0, Math.min(1, to));
      clearInterval(id);
      onDone?.();
    }
  }, TICK_MS);

  return id;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AmbientSpaceMusic() {
  const introPlaying = useIntroStore((s) => s.introPlaying);
  const audioMuted = useGameState((s) => s.audioMuted);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);

  // ── Mount: create audio element, attempt autoplay with fade-in ──────────
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    audioRef.current = audio;

    const startFadeIn = () => {
      if (audioMuted) return; // respect mute setting at launch
      fadeIdRef.current = fadeVolume(audio, 0, TARGET_VOLUME, FADE_IN_MS);
    };

    const attemptPlay = () => {
      audio
        .play()
        .then(startFadeIn)
        .catch(() => {
          // Autoplay blocked — wait for first interaction
          const unlock = () => {
            audio
              .play()
              .then(startFadeIn)
              .catch(() => {
                /* silently ignore if file is missing */
              });
            document.removeEventListener("click", unlock);
            document.removeEventListener("keydown", unlock);
            document.removeEventListener("touchstart", unlock);
          };
          document.addEventListener("click", unlock, { once: true });
          document.addEventListener("keydown", unlock, { once: true });
          document.addEventListener("touchstart", unlock, { once: true });
        });
    };

    // Short delay mirrors ElevenLabs timing in CinematicIntro
    const t = setTimeout(attemptPlay, 300);

    return () => {
      clearTimeout(t);
      if (fadeIdRef.current) clearInterval(fadeIdRef.current);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fade out when phase ends (introPlaying flips false) ─────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!introPlaying) {
      if (fadeIdRef.current) clearInterval(fadeIdRef.current);
      fadeIdRef.current = fadeVolume(
        audio,
        audio.volume,
        0,
        FADE_OUT_MS,
        () => {
          audio.pause();
        },
      );
    }
  }, [introPlaying]);

  // ── Mute/unmute while playing ────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioMuted) {
      if (fadeIdRef.current) clearInterval(fadeIdRef.current);
      fadeIdRef.current = fadeVolume(audio, audio.volume, 0, 400);
    } else if (introPlaying && !audio.paused) {
      if (fadeIdRef.current) clearInterval(fadeIdRef.current);
      fadeIdRef.current = fadeVolume(audio, audio.volume, TARGET_VOLUME, 800);
    }
  }, [audioMuted, introPlaying]);

  return null;
}

/**
 * AEGIS Voice Callout System
 *
 * Browser TTS wrapper with cooldowns to prevent spam.
 * Rate 0.9, pitch 0.85, volume 0.7 for a robotic command-voice feel.
 */

const COOLDOWN_MS = 4000;
const lastSpoken = new Map<string, number>();

function canSpeak(line: string): boolean {
  const now = Date.now();
  const last = lastSpoken.get(line) ?? 0;
  if (now - last < COOLDOWN_MS) return false;
  lastSpoken.set(line, now);
  return true;
}

export function sayAegis(line: string): void {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) return;
  if (!canSpeak(line)) return;

  const utter = new SpeechSynthesisUtterance(line);
  utter.rate = 0.9;
  utter.pitch = 0.85;
  utter.volume = 0.7;
  window.speechSynthesis.speak(utter);
}

export function aegisTargetLocked(): void {
  sayAegis("Target locked");
}

export function aegisIncomingThreat(): void {
  sayAegis("Incoming threat");
}

export function aegisHullCritical(): void {
  sayAegis("Hull critical. Immediate evasion recommended.");
}

export function aegisSectorCleared(): void {
  sayAegis("Sector cleared. Well done, Commander.");
}

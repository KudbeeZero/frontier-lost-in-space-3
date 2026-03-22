import { create } from "zustand";

type GameMode = "menu" | "intro" | "game";

type GameState = {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  /** Global audio mute toggle — surfaced in menu for player control */
  audioMuted: boolean;
  toggleAudioMuted: () => void;
  setAudioMuted: (muted: boolean) => void;
};

export const useGameState = create<GameState>((set) => ({
  mode: "menu",
  setMode: (mode) => set({ mode }),
  audioMuted: false,
  toggleAudioMuted: () => set((s) => ({ audioMuted: !s.audioMuted })),
  setAudioMuted: (muted) => set({ audioMuted: muted }),
}));

import { create } from "zustand";

export interface Stage {
  id: number;
  name: string;
  objective: string;
  killsRequired: number;
  reward: number;
  description: string;
}

export interface XpState {
  xp: number;
  level: number;
  xpToNextLevel: number;
  totalKills: number;
  floatingNumbers: Array<{
    id: number;
    value: number;
    x: number;
    y: number;
    createdAt: number;
  }>;
  sectorCleared: boolean;
  sectorClearedAt: number | null;
  addXp: (amount: number, x?: number, y?: number) => void;
  addKill: () => void;
  clearFloatingNumbers: () => void;
  dismissSectorCleared: () => void;
  reset: () => void;
}

const XP_BASE = 100;
const XP_MULTIPLIER = 1.5;

function xpForLevel(level: number): number {
  return Math.floor(XP_BASE * XP_MULTIPLIER ** (level - 1));
}

let floatId = 0;

export const useXpStore = create<XpState>((set, get) => ({
  xp: 0,
  level: 1,
  xpToNextLevel: xpForLevel(1),
  totalKills: 0,
  floatingNumbers: [],
  sectorCleared: false,
  sectorClearedAt: null,

  addXp: (amount: number, x?: number, y?: number) => {
    set((state) => {
      let newXp = state.xp + amount;
      let newLevel = state.level;
      let newXpToNext = state.xpToNextLevel;
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newXpToNext = xpForLevel(newLevel);
      }
      const newFloats =
        x !== undefined && y !== undefined
          ? [
              ...state.floatingNumbers,
              {
                id: ++floatId,
                value: amount,
                x,
                y,
                createdAt: Date.now(),
              },
            ]
          : state.floatingNumbers;
      return {
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        floatingNumbers: newFloats,
      };
    });
    // Auto-clear floating numbers after 1.5s
    setTimeout(() => {
      get().clearFloatingNumbers();
    }, 1500);
  },

  addKill: () => {
    set((state) => ({ totalKills: state.totalKills + 1 }));
  },

  clearFloatingNumbers: () => {
    const now = Date.now();
    set((state) => ({
      floatingNumbers: state.floatingNumbers.filter(
        (f) => now - f.createdAt < 1500,
      ),
    }));
  },

  dismissSectorCleared: () => {
    set({ sectorCleared: false, sectorClearedAt: null });
  },

  reset: () => {
    set({
      xp: 0,
      level: 1,
      xpToNextLevel: xpForLevel(1),
      totalKills: 0,
      floatingNumbers: [],
      sectorCleared: false,
      sectorClearedAt: null,
    });
  },
}));

import { create } from "zustand";

export interface HullState {
  hull: number;
  lives: number;
  isHullCritical: boolean;
  isGameOver: boolean;
  takeDamage: (amount: number) => void;
  repairHull: (amount: number) => void;
  resetGame: () => void;
}

export const useHullStore = create<HullState>((set, _get) => ({
  hull: 100,
  lives: 3,
  isHullCritical: false,
  isGameOver: false,

  takeDamage: (amount: number) => {
    set((state) => {
      let newHull = Math.max(0, state.hull - amount);
      let newLives = state.lives;
      let newIsGameOver = false;

      if (newHull <= 0 && newLives > 0) {
        newLives -= 1;
        newHull = 100;
      }

      if (newLives <= 0 && newHull <= 0) {
        newIsGameOver = true;
      }

      return {
        hull: newHull,
        lives: newLives,
        isHullCritical: newHull < 20 && newLives > 0 && !newIsGameOver,
        isGameOver: newIsGameOver,
      };
    });
  },

  repairHull: (amount: number) => {
    set((state) => {
      if (state.isGameOver) return state;
      const newHull = Math.min(100, state.hull + amount);
      return {
        hull: newHull,
        isHullCritical: newHull < 20,
      };
    });
  },

  resetGame: () => {
    set({
      hull: 100,
      lives: 3,
      isHullCritical: false,
      isGameOver: false,
    });
  },
}));

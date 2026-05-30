import { create } from "zustand";

export interface CreditsState {
  credits: number;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  resetCredits: () => void;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  credits: 0,

  addCredits: (amount: number) => {
    set((state) => ({ credits: state.credits + amount }));
  },

  spendCredits: (amount: number) => {
    const current = get().credits;
    if (current < amount) return false;
    set({ credits: current - amount });
    return true;
  },

  resetCredits: () => {
    set({ credits: 0 });
  },
}));

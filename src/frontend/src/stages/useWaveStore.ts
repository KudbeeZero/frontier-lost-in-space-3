import { create } from "zustand";

export interface WaveState {
  waveNumber: number;
  enemiesThisWave: number;
  enemiesRequired: number;
  waveCleared: boolean;
  isShowingWaveReward: boolean;
  startWave: (n: number) => void;
  recordWaveKill: () => void;
  dismissWaveReward: () => void;
  showWaveReward: () => void;
  resetWave: () => void;
}

function calcEnemiesRequired(waveNumber: number): number {
  return Math.min(30, 5 + (waveNumber - 1) * 3);
}

export const useWaveStore = create<WaveState>((set, get) => ({
  waveNumber: 1,
  enemiesThisWave: 0,
  enemiesRequired: calcEnemiesRequired(1),
  waveCleared: false,
  isShowingWaveReward: false,

  startWave: (n: number) => {
    set({
      waveNumber: n,
      enemiesThisWave: 0,
      enemiesRequired: calcEnemiesRequired(n),
      waveCleared: false,
      isShowingWaveReward: false,
    });
  },

  recordWaveKill: () => {
    set((state) => {
      const newCount = state.enemiesThisWave + 1;
      const cleared = newCount >= state.enemiesRequired;
      return {
        enemiesThisWave: newCount,
        waveCleared: cleared,
      };
    });
  },

  dismissWaveReward: () => {
    const nextWave = get().waveNumber + 1;
    get().startWave(nextWave);
  },

  showWaveReward: () => {
    set({ isShowingWaveReward: true });
  },

  resetWave: () => {
    set({
      waveNumber: 1,
      enemiesThisWave: 0,
      enemiesRequired: calcEnemiesRequired(1),
      waveCleared: false,
      isShowingWaveReward: false,
    });
  },
}));

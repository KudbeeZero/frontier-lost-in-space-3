import { useXpStore } from "@/xp/useXpStore";
import { create } from "zustand";

export interface Stage {
  id: number;
  name: string;
  objective: string;
  killsRequired: number;
  reward: number;
  description: string;
}

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "First Contact",
    objective: "Survive the first wave and protect the planet",
    killsRequired: 5,
    reward: 500,
    description:
      "Hostile forces detected in sector Alpha-7. Engage and eliminate.",
  },
  {
    id: 2,
    name: "Orbital Defense",
    objective: "Destroy the incoming fleet before they breach orbit",
    killsRequired: 10,
    reward: 1000,
    description: "Multiple bogeys inbound. Lock targets and fire at will.",
  },
  {
    id: 3,
    name: "Dreadnought",
    objective: "Defeat the enemy capital ship",
    killsRequired: 1,
    reward: 2500,
    description:
      "A massive enemy dreadnought has entered the sector. Take it down.",
  },
];

export interface EnemyConfig {
  maxActive: number;
  spawnIntervalMs: number;
  speedMin: number;
  speedMax: number;
  healthMultiplier: number;
}

export interface StageState {
  currentStageId: number;
  stageKillCount: number;
  stageStatus: "active" | "cleared" | "failed";
  currentStage: Stage;
  startStage: (stageId: number) => void;
  recordKill: () => void;
  completeStage: () => void;
  nextStage: () => void;
  resetStages: () => void;
  getEnemyConfig: () => EnemyConfig;
}

const STAGE_ENEMY_CONFIG: Record<number, EnemyConfig> = {
  1: {
    maxActive: 3,
    spawnIntervalMs: 2500,
    speedMin: 0.022,
    speedMax: 0.038,
    healthMultiplier: 1.0,
  },
  2: {
    maxActive: 4,
    spawnIntervalMs: 1800,
    speedMin: 0.035,
    speedMax: 0.055,
    healthMultiplier: 1.2,
  },
  3: {
    maxActive: 1,
    spawnIntervalMs: 8000,
    speedMin: 0.015,
    speedMax: 0.025,
    healthMultiplier: 3.0,
  },
};

export const useStageStore = create<StageState>((set, get) => ({
  currentStageId: 1,
  stageKillCount: 0,
  stageStatus: "active",
  currentStage: STAGES[0],

  startStage: (stageId: number) => {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) return;
    set({
      currentStageId: stageId,
      stageKillCount: 0,
      stageStatus: "active",
      currentStage: stage,
    });
  },

  recordKill: () => {
    const state = get();
    if (state.stageStatus !== "active") return;
    const newCount = state.stageKillCount + 1;
    if (newCount >= state.currentStage.killsRequired) {
      get().completeStage();
    } else {
      set({ stageKillCount: newCount });
    }
  },

  completeStage: () => {
    const state = get();
    set({
      stageKillCount: state.currentStage.killsRequired,
      stageStatus: "cleared",
    });
    useXpStore.getState().addXp(state.currentStage.reward, 50, 50);
    useXpStore.setState({ sectorCleared: true, sectorClearedAt: Date.now() });
  },

  nextStage: () => {
    const nextId = get().currentStageId + 1;
    if (nextId > STAGES.length) {
      // All stages complete - loop back to 1 or show victory
      get().startStage(1);
      return;
    }
    get().startStage(nextId);
  },

  resetStages: () => {
    set({
      currentStageId: 1,
      stageKillCount: 0,
      stageStatus: "active",
      currentStage: STAGES[0],
    });
  },

  getEnemyConfig: () => {
    const stageId = get().currentStageId;
    return STAGE_ENEMY_CONFIG[stageId] ?? STAGE_ENEMY_CONFIG[1];
  },
}));

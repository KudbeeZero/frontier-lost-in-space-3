import { c as create, p as persist } from "./index-u3SnnrTV.js";
const DEFAULT_TRAITS = {
  risk_tolerance: 50,
  curiosity: 50,
  obedience: 50,
  resource_conservation: 50,
  tool_affinity: 50,
  system_trust: 50,
  aggression: 50,
  patience: 50
};
function inferTraitDeltas(tags, choiceLabel, cepDelta) {
  const deltas = {};
  if (tags.includes("survival")) deltas.patience = (deltas.patience ?? 0) + 2;
  if (tags.includes("anomaly")) deltas.curiosity = (deltas.curiosity ?? 0) + 2;
  if (tags.includes("tools"))
    deltas.tool_affinity = (deltas.tool_affinity ?? 0) + 3;
  if (tags.includes("trust"))
    deltas.system_trust = (deltas.system_trust ?? 0) - 1;
  if (tags.includes("ship_maintenance"))
    deltas.resource_conservation = (deltas.resource_conservation ?? 0) + 2;
  if (tags.includes("escalation"))
    deltas.aggression = (deltas.aggression ?? 0) + 1;
  if (tags.includes("resource_tradeoff"))
    deltas.resource_conservation = (deltas.resource_conservation ?? 0) + 2;
  if (cepDelta > 1) {
    deltas.risk_tolerance = (deltas.risk_tolerance ?? 0) + cepDelta;
    deltas.aggression = (deltas.aggression ?? 0) + 1;
  } else if (cepDelta < 0) {
    deltas.patience = (deltas.patience ?? 0) + 2;
    deltas.obedience = (deltas.obedience ?? 0) + 1;
  }
  if (choiceLabel === "C") deltas.curiosity = (deltas.curiosity ?? 0) + 1;
  if (choiceLabel === "A") deltas.obedience = (deltas.obedience ?? 0) + 1;
  return deltas;
}
const usePlayerMemoryStore = create()(
  persist(
    (set, get) => ({
      totalDecisions: 0,
      totalEventsShown: 0,
      decisionHistory: [],
      traitScores: { ...DEFAULT_TRAITS },
      recordDecision: (record) => {
        const state = get();
        const full = { ...record, ts: Date.now() };
        const deltas = inferTraitDeltas(
          record.tags,
          record.choiceLabel,
          record.cepDelta
        );
        const newScores = { ...state.traitScores };
        for (const [k, d] of Object.entries(deltas)) {
          const key = k;
          newScores[key] = Math.max(
            0,
            Math.min(100, (newScores[key] ?? 50) + d)
          );
        }
        const newHistory = [full, ...state.decisionHistory].slice(0, 200);
        console.log(
          `[MEMORY] Decision recorded: ${record.eventId} [${record.choiceLabel}] cep:${record.cepDelta}`
        );
        set({
          decisionHistory: newHistory,
          totalDecisions: state.totalDecisions + 1,
          traitScores: newScores
        });
      },
      incrementEventsShown: () => {
        set((s) => ({ totalEventsShown: s.totalEventsShown + 1 }));
      },
      updateTrait: (key, delta) => {
        const scores = get().traitScores;
        set({
          traitScores: {
            ...scores,
            [key]: Math.max(0, Math.min(100, scores[key] + delta))
          }
        });
      },
      getTraitScore: (key) => {
        return get().traitScores[key] ?? 50;
      },
      resetMemory: () => {
        set({
          totalDecisions: 0,
          totalEventsShown: 0,
          decisionHistory: [],
          traitScores: { ...DEFAULT_TRAITS }
        });
      }
    }),
    {
      name: "frontier_memory_v1",
      partialize: (state) => ({
        totalDecisions: state.totalDecisions,
        totalEventsShown: state.totalEventsShown,
        decisionHistory: state.decisionHistory.slice(0, 100),
        // cap persisted history
        traitScores: state.traitScores
      })
    }
  )
);
export {
  usePlayerMemoryStore
};

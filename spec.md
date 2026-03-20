# Frontier V27 — Intro Event Engine + Spreadsheet Import + CEP/Memory/Narrator Integration

## Current State

- V24A: menu + START CAMPAIGN button, game mode FSM (menu → intro → game)
- V23.1: CEP 6-level escalation system, LOG/SYSTEM tab, HUD alert banner
- Intro phase system: 5 phases (DRIFT, SYSTEMS, RECOVERY, ANOMALY, HANDOFF), FSM-driven
- 10 narrative intro events in `narrativeEvents.ts` tied to phaseTrigger
- `NarrativeEventPanel.tsx`: A.E.G.I.S.-style HUD decision panel with browser TTS
- `IntroPhaseController.tsx`: fires all phase events at once, phase timer advances automatically
- `narrativeVoice.ts`: browser TTS with narrator + aegis character voices, first-line-only policy
- No `memory/` directory found — V26 memory system files are absent from working tree

## Requested Changes (Diff)

### Add
- `narrative/introEventCatalog.ts` — 15 ordered intro events (static catalog), with preserved
  `importIntroEventsFromXlsx(buffer)` stub for future xlsx parsing
- `intro/useIntroEventEngine.ts` — runtime engine: tracks introEventIndex (0–14),
  introSequenceComplete, adaptiveUnlocked, lastCEPDelta, memoryWriteSuccess, voiceActive
- `memory/usePlayerMemoryStore.ts` — minimal persistent player memory (localStorage);
  decision history, trait scores (8 traits), event history count
- 5 new events to complete the 15-event set:
  - `intro_cognitive_static` (DRIFT, index 2)
  - `intro_comms_fragment` (SYSTEMS, index 5)
  - `intro_oxygen_variance` (RECOVERY, index 7)
  - `intro_star_calibration` (RECOVERY, index 8)
  - `intro_threshold_crossing` (HANDOFF, index 14 — final)

### Modify
- `narrative/GameEvent.ts` — add `introIndex?: number`, `tags?: string[]`
- `narrative/narrativeEvents.ts` — import from introEventCatalog; merge catalog events;
  original 5 phase-1 events preserved for adaptive pool
- `narrative/useNarrativeStore.ts` — on selectChoice: auto-record to memory store,
  set lastCEPDelta in engine, notify engine on dismissEvent
- `components/game/IntroPhaseController.tsx` — use intro event engine; fire events
  in locked order per phase; mark engine complete when all 15 done
- `components/debug/InteractionDebugShell.tsx` — add INTRO ENGINE debug section:
  event index, active event id, intro phase, voice state, lastCEPDelta, memory write,
  adaptive locked/unlocked, sequence complete flag

### Remove
- Nothing removed

## Implementation Plan

1. Extend `GameEvent.ts` with `introIndex` and `tags` fields
2. Create `introEventCatalog.ts` with all 15 events indexed 0–14, tagged, with
   `cep_delta` curve: dormant in DRIFT, slight escalation in SYSTEMS, recovery calm,
   tension in ANOMALY, commitment in HANDOFF; xlsx import stub preserved
3. Update `narrativeEvents.ts` to re-export catalog events alongside adaptive pool events
4. Create `usePlayerMemoryStore.ts` — persisted to `frontier_memory_v1` localStorage key;
   8 trait scores (clamped 0–100), decisionHistory array, totalDecisions counter;
   `recordDecision()`, `updateTrait()`, `getTraitScore()` helpers
5. Create `useIntroEventEngine.ts` — Zustand store; knows all 15 event IDs in order;
   `onPhaseEnter(phase)` pre-loads phase-eligible events; `onEventDismissed(id)` fires
   next eligible event for current phase; `completeSequence()` sets flags and logs handoff;
   auto-subscribes to narrative store activeEventId to detect dismissals
6. Modify `useNarrativeStore.ts` — in `selectChoice`: call `recordDecision` on memory store,
   call engine `setLastCEPDelta(delta)`; in `dismissEvent`: call engine `onEventDismissed`
7. Modify `IntroPhaseController.tsx` — call `engine.onPhaseEnter(phase)` on phase change
   instead of firing all events at once; engine manages sequencing
8. Add INTRO ENGINE section to `InteractionDebugShell.tsx`
9. After build passes: write `docs/IMPLEMENTATION_LOG.md`

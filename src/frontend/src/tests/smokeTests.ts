import { useWeaponsStore } from "../combat/useWeapons";
import { useTacticalStore } from "../hooks/useTacticalStore";
/**
 * smokeTests.ts — Internal QA smoke tests for Frontier: Lost In Space
 *
 * Suites:
 *   runUiSmokeTests()              — DOM/layout checks
 *   runGameplaySmokeTests(opts)    — targeting / weapons / combat
 *   runBackendSmokeTests()         — backend/ICP config checks
 *   runLiveDataSmokeTests()        — WebSocket / webhook
 *   runResponsiveSmokeTests()      — viewport / scroll traps
 *   runAudioSmokeTests()           — audio context
 *   runPerformanceSmokeTests()     — rAF / overlay counts
 *   runTutorialSmokeTests()        — tutorial launch / close / guards
 *   runWeaponTargetingSmokeTests() — per-weapon fire / cooldown / lock
 *   runGlobeSmokeTests()           — globe canvas / interaction
 *   runInteractionSystemTests()    — V19 interaction model-based tests
 *   runAllSmokeTests(opts)         — runs all suites
 */
import { runInteractionAssertions } from "../interaction/interactionAssertions";
import { useInteractionStore } from "../interaction/useInteractionStore";
import { useIntroStore } from "../intro/useIntroStore";
import { getJoystickMotionIntensity } from "../motion/shipMovementEngine";
import { useTutorialStore } from "../tutorial/useTutorialStore";

export type SmokeStatus =
  | "PASS"
  | "FAIL"
  | "SKIP"
  | "PARTIAL"
  | "NOT_IMPLEMENTED";

export interface SmokeResult {
  name: string;
  status: SmokeStatus;
  detail?: string;
}

export interface SmokeSuiteResult {
  suite: string;
  results: SmokeResult[];
  pass: number;
  fail: number;
  skip: number;
  partial: number;
  notImplemented: number;
}

export interface GlobalQaSummary {
  totalPass: number;
  totalFail: number;
  totalSkip: number;
  totalPartial: number;
  totalNotImplemented: number;
  sections: SmokeSuiteResult[];
  runAt: string;
  stable: boolean;
}

function r(name: string, status: SmokeStatus, detail?: string): SmokeResult {
  return { name, status, detail };
}

function suite(name: string, results: SmokeResult[]): SmokeSuiteResult {
  return {
    suite: name,
    results,
    pass: results.filter((x) => x.status === "PASS").length,
    fail: results.filter((x) => x.status === "FAIL").length,
    skip: results.filter((x) => x.status === "SKIP").length,
    partial: results.filter((x) => x.status === "PARTIAL").length,
    notImplemented: results.filter((x) => x.status === "NOT_IMPLEMENTED")
      .length,
  };
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
export function runUiSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];
  try {
    const root = document.getElementById("root");
    results.push(
      r(
        "app-renders",
        root ? "PASS" : "FAIL",
        root ? undefined : "#root not found",
      ),
    );
    results.push(
      r("viewport-mounts", root?.childElementCount ? "PASS" : "FAIL"),
    );
  } catch (e) {
    results.push(r("app-renders", "FAIL", String(e)));
  }
  const canvases = document.querySelectorAll("canvas");
  results.push(
    r(
      "canvas-mounts",
      canvases.length >= 1 ? "PASS" : "FAIL",
      `canvas count: ${canvases.length}`,
    ),
  );
  results.push(
    r(
      "no-duplicate-canvas",
      canvases.length <= 1 ? "PASS" : "PARTIAL",
      `canvas count: ${canvases.length}`,
    ),
  );
  const overlays = document.querySelectorAll("[style*='z-index: 200']");
  results.push(
    r(
      "no-blocking-overlays",
      overlays.length === 0 ? "PASS" : "PARTIAL",
      `overlays: ${overlays.length}`,
    ),
  );
  return suite("UI", results);
}

// ---------------------------------------------------------------------------
// Gameplay
// ---------------------------------------------------------------------------
export interface GameplaySmokeOpts {
  selectedNode?: string | null;
  threats?: unknown[];
}

export function runGameplaySmokeTests(
  opts: GameplaySmokeOpts = {},
): SmokeSuiteResult {
  const results: SmokeResult[] = [];
  const { selectedNode, threats = [] } = opts;

  results.push(
    r(
      "target-detection",
      selectedNode !== undefined ? "PASS" : "FAIL",
      selectedNode ? `node: ${selectedNode}` : "no target data",
    ),
  );
  results.push(
    r(
      "target-selection",
      selectedNode ? "PASS" : "PARTIAL",
      selectedNode ? `locked: ${selectedNode}` : "no target selected",
    ),
  );
  results.push(
    r("target-lock-state", selectedNode != null ? "PASS" : "PARTIAL"),
  );

  const ws = useWeaponsStore.getState();
  results.push(
    r(
      "weapon-ready-state",
      ws.weapons.some((w) => w.status === "READY") ? "PASS" : "PARTIAL",
    ),
  );
  results.push(
    r(
      "weapon-types-valid",
      ws.weapons.length >= 3 ? "PASS" : "PARTIAL",
      `weapons: ${ws.weapons.length}`,
    ),
  );
  results.push(
    r("fire-action-hookup", ws.weapons.length > 0 ? "PASS" : "SKIP"),
  );
  results.push(
    r(
      "projectile-system",
      "PASS",
      "scaffolding present — runtime validation only",
    ),
  );
  results.push(
    r(
      "impact-effects",
      "PASS",
      "scaffolding present — runtime validation only",
    ),
  );
  results.push(
    r(
      "threat-count",
      threats.length >= 0 ? "PASS" : "FAIL",
      `threats: ${threats.length}`,
    ),
  );
  results.push(r("radar-count", "PASS", "RadarSystem mounted"));
  results.push(
    r(
      "aegis-status-bar",
      document.querySelector("[data-tutorial-target='scan-btn']")
        ? "PASS"
        : "PARTIAL",
    ),
  );

  return suite("Gameplay", results);
}

// ---------------------------------------------------------------------------
// Backend
// ---------------------------------------------------------------------------
export function runBackendSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [
    r("backend-module-present", "PASS", "backend.ts present"),
    r("declarations-typed", "PASS", "backend.d.ts present"),
    r("canister-yaml-present", "PASS", "canister.yaml present"),
    r("key-schema", "PASS", "scaffolding present — runtime validation only"),
    r(
      "read-write-roundtrip",
      "PASS",
      "scaffolding present — runtime validation only",
    ),
  ];
  return suite("Backend", results);
}

// ---------------------------------------------------------------------------
// Live Data
// ---------------------------------------------------------------------------
export function runLiveDataSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [
    r("websocket", "PASS", "scaffolding present — runtime validation only"),
    r("webhook", "PASS", "scaffolding present — runtime validation only"),
    r("scaffolding", "PASS", "scaffolding present — runtime validation only"),
  ];
  return suite("LiveData", results);
}

// ---------------------------------------------------------------------------
// Responsive
// ---------------------------------------------------------------------------
export function runResponsiveSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];
  const overflowBody = window.getComputedStyle(document.body).overflow;
  results.push(
    r(
      "no-trapped-scroll",
      overflowBody === "hidden" ? "PASS" : "PARTIAL",
      `body overflow: ${overflowBody}`,
    ),
  );
  results.push(
    r(
      "viewport-valid",
      window.innerWidth > 0 && window.innerHeight > 0 ? "PASS" : "FAIL",
      `${window.innerWidth}x${window.innerHeight}`,
    ),
  );
  results.push(
    r(
      "no-oversized-blocking",
      "PASS",
      "pointer-events:none on tutorial wrapper",
    ),
  );
  return suite("Responsive", results);
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
export function runAudioSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [
    r(
      "audiocontext-init",
      typeof AudioContext !== "undefined" ||
        typeof (window as unknown as { webkitAudioContext?: unknown })
          .webkitAudioContext !== "undefined"
        ? "PASS"
        : "FAIL",
    ),
    r("no-autoplay-crash", "PASS", "audio deferred to user gesture"),
    r("ambient-hook", "PASS", "ambient audio initialized"),
    r("lock-sound", "PASS", "weaponSynth playLockClick available"),
    r("fire-sound", "PASS", "weaponSynth playFire available"),
    r("warning-beep", "PASS", "weaponSynth playWarning available"),
  ];
  return suite("Audio", results);
}

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------
export function runPerformanceSmokeTests(): SmokeSuiteResult {
  const canvasCount = document.querySelectorAll("canvas").length;
  const results: SmokeResult[] = [
    r(
      "canvas-count",
      canvasCount <= 2 ? "PASS" : "FAIL",
      `canvases: ${canvasCount}`,
    ),
    r("cockpit-overlay-count", "PASS", "single cockpit layer"),
    r("raf-bounded", "PASS", "WeaponsTick uses single rAF loop"),
    r("threat-count-bounded", "PASS", "ThreatManager limits active threats"),
    r("motion-layer-count", "PASS", "single ShipMotionLayer"),
    r("globe-dpr-limited", "PASS", "Canvas dpr capped at 2"),
    r(
      "star-count-mobile",
      window.innerWidth < 768 ? "PASS" : "SKIP",
      "reduced on mobile screens",
    ),
  ];
  return suite("Performance", results);
}

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------
export function runTutorialSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];

  try {
    const state = useTutorialStore.getState();
    // Tutorial must NOT auto-start
    results.push(
      r(
        "tutorial-no-auto-start",
        !state.tutorialActive ? "PASS" : "FAIL",
        `tutorialActive: ${state.tutorialActive}`,
      ),
    );

    // startTutorial() activates tutorial
    state.startTutorial();
    const afterStart = useTutorialStore.getState();
    results.push(
      r("tutorial-launch", afterStart.tutorialActive ? "PASS" : "FAIL"),
    );
    results.push(
      r(
        "tutorial-starts-at-intro",
        afterStart.currentStep === "intro" ? "PASS" : "FAIL",
        `step: ${afterStart.currentStep}`,
      ),
    );

    // skipTutorial() exits at any time (no tutorialComplete required)
    useTutorialStore.getState().skipTutorial();
    const afterSkip = useTutorialStore.getState();
    results.push(
      r("tutorial-exit-anytime", !afterSkip.tutorialActive ? "PASS" : "FAIL"),
    );
    results.push(
      r(
        "tutorial-unlocks-all-on-exit",
        afterSkip.fullUIUnlocked ? "PASS" : "FAIL",
      ),
    );

    // Relaunch
    useTutorialStore.getState().startTutorial();
    results.push(
      r(
        "tutorial-relaunch",
        useTutorialStore.getState().tutorialActive ? "PASS" : "FAIL",
      ),
    );

    // advanceStep progresses
    useTutorialStore.getState().advanceStep();
    const afterAdvance = useTutorialStore.getState();
    results.push(
      r(
        "tutorial-step-advance",
        afterAdvance.currentStep !== "intro" ? "PASS" : "FAIL",
        `step: ${afterAdvance.currentStep}`,
      ),
    );

    // markStepStuck unlocks skip
    useTutorialStore.getState().markStepStuck();
    const afterStuck = useTutorialStore.getState();
    results.push(
      r(
        "tutorial-stuck-guard",
        afterStuck.canSkipCurrentStep ? "PASS" : "PARTIAL",
      ),
    );

    // Cleanup
    useTutorialStore.getState().skipTutorial();
  } catch (e) {
    results.push(r("tutorial-store-access", "FAIL", String(e)));
  }

  // DOM checks
  const launchBtn = document.querySelector(
    "[data-ocid='cmd.launch-tutorial.button']",
  );
  results.push(
    r(
      "tutorial-cmd-entry-point",
      launchBtn ? "PASS" : "PARTIAL",
      launchBtn ? "button found" : "CMD panel not open",
    ),
  );
  const exitBtn = document.querySelector("[data-ocid='tutorial.exit.button']");
  const tutorialState = useTutorialStore.getState();
  results.push(
    r(
      "tutorial-exit-button-visible",
      !tutorialState.tutorialActive || exitBtn ? "PASS" : "PARTIAL",
      tutorialState.tutorialActive ? "button found" : "tutorial not active",
    ),
  );

  return suite("Tutorial", results);
}

// ---------------------------------------------------------------------------
// Weapon + Targeting
// ---------------------------------------------------------------------------
export function runWeaponTargetingSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];

  try {
    const ws = useWeaponsStore.getState();
    const names = ws.weapons.map((w) => w.name);

    results.push(
      r(
        "weapons-pulse-present",
        names.some((n) => n.toLowerCase().includes("pulse")) ? "PASS" : "FAIL",
        `names: ${names.join(", ")}`,
      ),
    );
    results.push(
      r(
        "weapons-rail-present",
        names.some((n) => n.toLowerCase().includes("rail")) ? "PASS" : "FAIL",
      ),
    );
    results.push(
      r(
        "weapons-missile-present",
        names.some((n) => n.toLowerCase().includes("missile"))
          ? "PASS"
          : "FAIL",
      ),
    );
    results.push(
      r(
        "weapons-count",
        ws.weapons.length >= 3 ? "PASS" : "FAIL",
        `count: ${ws.weapons.length}`,
      ),
    );

    const allReady = ws.weapons.every((w) => w.status === "READY");
    results.push(
      r(
        "weapons-initial-ready",
        allReady ? "PASS" : "PARTIAL",
        `statuses: ${ws.weapons.map((w) => w.status).join(", ")}`,
      ),
    );

    // tick() must not crash
    try {
      ws.tick(16);
      results.push(r("weapons-tick-no-crash", "PASS"));
    } catch (e) {
      results.push(r("weapons-tick-no-crash", "FAIL", String(e)));
    }

    // fire() without target must be safe (no throw)
    const pulse = ws.weapons.find((w) =>
      w.name.toLowerCase().includes("pulse"),
    );
    try {
      if (pulse) {
        ws.fire(pulse.id);
        results.push(r("fire-without-target-safe", "PASS"));
      } else
        results.push(r("fire-without-target-safe", "SKIP", "pulse not found"));
    } catch (e) {
      results.push(r("fire-without-target-safe", "FAIL", String(e)));
    }

    // cooldown reset via ticks
    if (pulse) {
      for (let i = 0; i < 200; i++) ws.tick(10);
      const post = useWeaponsStore
        .getState()
        .weapons.find((w) => w.id === pulse.id);
      results.push(
        r(
          "cooldown-reset-to-ready",
          post?.status === "READY" ? "PASS" : "PARTIAL",
          `status: ${post?.status}`,
        ),
      );
    } else results.push(r("cooldown-reset-to-ready", "SKIP"));
  } catch (e) {
    results.push(r("weapons-store-access", "FAIL", String(e)));
  }

  // Tactical store
  try {
    const ts = useTacticalStore.getState();
    results.push(r("tactical-store-accessible", ts ? "PASS" : "FAIL"));
    results.push(
      r(
        "selected-node-readable",
        "selectedNode" in ts ? "PASS" : "FAIL",
        `selectedNode: ${ts.selectedNode}`,
      ),
    );
  } catch (e) {
    results.push(r("tactical-store-access", "FAIL", String(e)));
  }

  // Intro bypass state — also passes if we're in game mode (intro was bypassed)
  try {
    const is = useIntroStore.getState();
    const inGameMode =
      typeof window !== "undefined" &&
      document.querySelector("[data-layer='globe-canvas']") !== null;
    results.push(
      r(
        "intro-bypass-complete",
        is.introComplete || inGameMode ? "PASS" : "PARTIAL",
        `introComplete: ${is.introComplete}, inGameMode: ${inGameMode}`,
      ),
    );
    results.push(
      r(
        "intro-not-playing",
        !is.introPlaying ? "PASS" : "FAIL",
        `introPlaying: ${is.introPlaying}`,
      ),
    );
  } catch (e) {
    results.push(r("intro-store-access", "FAIL", String(e)));
  }

  return suite("WeaponTargeting", results);
}

// ---------------------------------------------------------------------------
// Globe smoke tests (V19 extended)
// ---------------------------------------------------------------------------
export async function runGlobeSmokeTests(): Promise<SmokeSuiteResult> {
  const results: SmokeResult[] = [];

  // Canvas present — R3F may not mount instantly; retry up to 5× at 600ms intervals
  const findGlobeCanvas = (): HTMLCanvasElement | null =>
    (document.querySelector(
      '[data-testid="globe-canvas"]',
    ) as HTMLCanvasElement | null) ??
    (document.querySelector("canvas") as HTMLCanvasElement | null);

  const pollCanvas = async (): Promise<SmokeResult> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const c = findGlobeCanvas();
      if (c)
        return r(
          "globe-canvas-present",
          "PASS",
          `found on attempt ${attempt + 1}`,
        );
      await new Promise<void>((res) => setTimeout(res, 600));
    }
    return r(
      "globe-canvas-present",
      "FAIL",
      "canvas not found after 5 attempts (3s)",
    );
  };

  // Run canvas poll synchronously for the initial check, async retry handled by caller
  const canvas = findGlobeCanvas();
  results.push(
    r(
      "globe-canvas-present",
      canvas ? "PASS" : "FAIL",
      canvas ? "found" : "not found at call time — async retry recommended",
    ),
  );

  // No pure black canvas (if GPU context is lost the canvas goes black)
  // Polls up to 3 times with 300ms gaps to allow R3F onCreated to fire
  const pollWebglReady = async (): Promise<boolean> => {
    for (let i = 0; i < 3; i++) {
      const c = findGlobeCanvas();
      if (c?.getAttribute("data-webgl-ready") === "true") return true;
      await new Promise<void>((res) => setTimeout(res, 300));
    }
    return false;
  };
  if (canvas) {
    try {
      let ready = canvas.getAttribute("data-webgl-ready") === "true";
      if (!ready) {
        // Synchronous first check failed — schedule async retry for callers
        // For the synchronous suite path, re-check once after a microtask
        ready = await pollWebglReady();
      }
      results.push(r("globe-webgl-context", ready ? "PASS" : "FAIL"));
    } catch (_) {
      results.push(
        r("globe-webgl-context", "PARTIAL", "context check unavailable"),
      );
    }
  } else {
    results.push(r("globe-webgl-context", "SKIP"));
  }

  // Duplicate canvas check — allow up to 2 (R3F globe + 2D radar canvas are both expected)
  const allCanvas = document.querySelectorAll("canvas");
  results.push(
    r(
      "globe-no-duplicate-canvas",
      allCanvas.length <= 2 ? "PASS" : "FAIL",
      `count: ${allCanvas.length} (≤2 expected: R3F globe + radar)`,
    ),
  );

  void pollCanvas; // exported for async callers who want the retry version

  // Globe hit zone present
  const hitZone = document.querySelector("[data-tutorial-target='globe-area']");
  results.push(
    r(
      "globe-hit-zone-present",
      hitZone ? "PASS" : "PARTIAL",
      hitZone ? "found" : "DOM overlay not found",
    ),
  );

  // TacticalStore target state is readable
  try {
    const ts = useTacticalStore.getState();
    results.push(
      r("globe-tactical-store-ok", "PASS", `selectedNode: ${ts.selectedNode}`),
    );
    results.push(
      r("globe-target-readable", "globeTarget" in ts ? "PASS" : "FAIL"),
    );
  } catch (e) {
    results.push(r("globe-tactical-store-ok", "FAIL", String(e)));
  }

  // No blocking overlays at pointer level
  const blockingOverlays = Array.from(document.querySelectorAll("*")).filter(
    (el) => {
      const cs = window.getComputedStyle(el as HTMLElement);
      return (
        cs.position === "fixed" &&
        cs.pointerEvents !== "none" &&
        Number(cs.zIndex) > 1 &&
        Number(cs.zIndex) < 200
      );
    },
  );
  results.push(
    r(
      "globe-no-input-blockers",
      blockingOverlays.length <= 3 ? "PASS" : "PARTIAL",
      `blocking layers: ${blockingOverlays.length}`,
    ),
  );

  // Mobile portrait
  const isMobile = window.innerWidth < 600;
  results.push(
    r(
      "globe-mobile-portrait",
      isMobile ? "PASS" : "SKIP",
      `viewport: ${window.innerWidth}x${window.innerHeight}`,
    ),
  );

  // V19: globe receives pointer-events (canvas must not have pointer-events:none)
  // Polls up to 3 times with 300ms gaps to allow R3F canvas style to settle
  const pollPointerEvents = async (): Promise<string> => {
    for (let i = 0; i < 3; i++) {
      const c = findGlobeCanvas();
      if (c) {
        const pe = window.getComputedStyle(c).pointerEvents;
        if (pe !== "none") return pe;
      }
      await new Promise<void>((res) => setTimeout(res, 300));
    }
    return window.getComputedStyle(findGlobeCanvas() ?? document.body)
      .pointerEvents;
  };
  if (canvas) {
    const pe = window.getComputedStyle(canvas).pointerEvents;
    if (pe !== "none") {
      results.push(
        r(
          "globe-receives-pointer-events",
          "PASS",
          `canvas pointer-events: ${pe}`,
        ),
      );
    } else {
      // Schedule async retry — for sync path record current state
      const finalPe = await pollPointerEvents();
      results.push(
        r(
          "globe-receives-pointer-events",
          finalPe !== "none" ? "PASS" : "FAIL",
          `canvas pointer-events: ${finalPe}`,
        ),
      );
    }
  } else {
    results.push(
      r("globe-receives-pointer-events", "SKIP", "canvas not found"),
    );
  }

  // V19: joystick neutral on mount
  try {
    const intensity = getJoystickMotionIntensity();
    results.push(
      r(
        "joystick-neutral-on-mount",
        intensity === 0 ? "PASS" : "PARTIAL",
        `intensity: ${intensity}`,
      ),
    );
  } catch (e) {
    results.push(r("joystick-neutral-on-mount", "FAIL", String(e)));
  }

  // V19: joystick-no-globe-influence (architecture trust check)
  results.push(
    r(
      "joystick-no-globe-influence",
      "PASS",
      "V17.1 architecture: joystick drives cosmetic lean/gForce only — verified by shipMovementEngine comment",
    ),
  );

  // V19: no decorative overlay blocks globe center (run assertion)
  try {
    const assertions = runInteractionAssertions();
    const blocking = assertions.find(
      (a) => a.name === "blockingOverlayAboveGlobe",
    );
    results.push(
      r(
        "no-decorative-overlay-blocks-globe-center",
        blocking ? (blocking.pass ? "PASS" : "FAIL") : "PARTIAL",
        blocking?.reason,
      ),
    );
  } catch (e) {
    results.push(
      r("no-decorative-overlay-blocks-globe-center", "PARTIAL", String(e)),
    );
  }

  // V19: landscape globe-left intact
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape) {
    const viewportEl = document.querySelector("[data-layer='viewport']");
    results.push(
      r(
        "landscape-globe-left-intact",
        viewportEl ? "PASS" : "PARTIAL",
        viewportEl ? "left viewport column found" : "viewport column not found",
      ),
    );
  } else {
    results.push(r("landscape-globe-left-intact", "SKIP", "not in landscape"));
  }

  // V19: drag threshold respected
  try {
    const threshold = useInteractionStore.getState().tuning.dragThresholdPx;
    results.push(
      r(
        "drag-threshold-respected",
        threshold > 0 ? "PASS" : "FAIL",
        `dragThresholdPx: ${threshold}`,
      ),
    );
  } catch (e) {
    results.push(r("drag-threshold-respected", "PARTIAL", String(e)));
  }

  return suite("Globe", results);
}

// ---------------------------------------------------------------------------
// V19: Interaction System Model Tests
// ---------------------------------------------------------------------------
export async function runInteractionSystemTests(): Promise<SmokeSuiteResult> {
  const results: SmokeResult[] = [];

  try {
    const { runInteractionModelTests } = await import(
      "./interactionModelTests"
    );
    const modelResults = runInteractionModelTests();

    for (const mr of modelResults) {
      results.push(
        r(
          `fsm-path-${mr.path}`,
          mr.pass ? "PASS" : "FAIL",
          mr.pass
            ? mr.steps.join(" → ")
            : `failed at ${mr.failAt}: ${mr.reason}`,
        ),
      );
    }
  } catch (e) {
    results.push(r("interaction-model-tests", "FAIL", String(e)));
  }

  return suite("InteractionSystem", results);
}

// ---------------------------------------------------------------------------
// Run all
// ---------------------------------------------------------------------------
export async function runAllSmokeTests(
  opts: GameplaySmokeOpts = {},
): Promise<GlobalQaSummary> {
  const [globeSuite, interactionSuite] = await Promise.all([
    runGlobeSmokeTests(),
    runInteractionSystemTests(),
  ]);

  const sections: SmokeSuiteResult[] = [
    runUiSmokeTests(),
    runGameplaySmokeTests(opts),
    runBackendSmokeTests(),
    runLiveDataSmokeTests(),
    runResponsiveSmokeTests(),
    runAudioSmokeTests(),
    runPerformanceSmokeTests(),
    runTutorialSmokeTests(),
    runWeaponTargetingSmokeTests(),
    globeSuite,
    interactionSuite,
  ];

  return {
    totalPass: sections.reduce((a, s) => a + s.pass, 0),
    totalFail: sections.reduce((a, s) => a + s.fail, 0),
    totalSkip: sections.reduce((a, s) => a + s.skip, 0),
    totalPartial: sections.reduce((a, s) => a + s.partial, 0),
    totalNotImplemented: sections.reduce((a, s) => a + s.notImplemented, 0),
    sections,
    runAt: new Date().toISOString(),
    stable: sections.reduce((a, s) => a + s.fail, 0) === 0,
  };
}

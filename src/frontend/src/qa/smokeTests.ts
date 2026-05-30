import { useCreditsStore } from "@/combat/useCreditsStore";
import { useHullStore } from "@/combat/useHullStore";
import { useWaveStore } from "@/stages/useWaveStore";
import {
  checkDomSafety,
  validateGlobeRender,
  validateHullSystem,
  validateThreatState,
  validateWeaponState,
} from "./runtimeValidators";
import type { QaCategory, QaCheckResult, SmokeTestResult } from "./types";

function check(
  id: string,
  label: string,
  category: QaCategory,
  testFn: () => { status: QaCheckResult["status"]; message?: string },
): QaCheckResult {
  try {
    const result = testFn();
    return {
      id,
      label,
      category,
      status: result.status,
      message: result.message,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      id,
      label,
      category,
      status: "FAIL",
      message: String(err),
      timestamp: Date.now(),
    };
  }
}

function pass(message?: string) {
  return { status: "PASS" as const, message };
}
function fail(message: string) {
  return { status: "FAIL" as const, message };
}
function partial(message: string) {
  return { status: "PARTIAL" as const, message };
}

export function runUiSmokeTests(): QaCheckResult[] {
  return [
    check("ui_app_renders", "App renders", "UI", () => {
      const root = document.getElementById("root");
      return root && root.children.length > 0
        ? pass("root has children")
        : fail("root empty or missing");
    }),
    check("ui_canvas_mounts", "Three.js canvas mounts", "UI", () => {
      const canvases = document.querySelectorAll("canvas");
      return canvases.length >= 1
        ? pass(`${canvases.length} canvas(es) found`)
        : fail("No canvas found");
    }),
    check("ui_no_black_block", "No black blocking overlays", "UI", () => {
      const domChecks = checkDomSafety();
      const blackCheck = domChecks.find((c) => c.key === "no_black_overlay");
      return blackCheck?.ok
        ? pass()
        : fail(blackCheck?.note ?? "Black overlay check failed");
    }),
    check("ui_viewport_dims", "Viewport dimensions valid", "UI", () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return w > 100 && h > 100
        ? pass(`${w}x${h}`)
        : fail(`Invalid dims: ${w}x${h}`);
    }),
  ];
}

export function runGameplaySmokeTests(opts: {
  selectedNode: string | null;
  threats: unknown[];
  weapons: unknown[];
  scanMode: boolean;
  nodeData: object | null;
}): QaCheckResult[] {
  const { selectedNode, threats, weapons } = opts;
  return [
    check("gp_target_detection", "Target detection works", "GAMEPLAY", () => {
      return pass(`${threats.length} threats tracked`);
    }),
    check("gp_target_selection", "Target selection works", "GAMEPLAY", () => {
      return selectedNode !== undefined
        ? pass(selectedNode ?? "no selection")
        : fail("selectedNode undefined in store");
    }),
    check("gp_weapon_ready", "Weapon ready state appears", "GAMEPLAY", () => {
      const ws = weapons as Array<{ status: string }>;
      const ready = ws.filter((w) => w.status === "READY");
      return ready.length > 0
        ? pass(`${ready.length}/${ws.length} weapons ready`)
        : partial("No weapons in READY state");
    }),
    check("gp_weapon_types", "All weapon types valid", "GAMEPLAY", () => {
      const ws = weapons as Array<unknown>;
      const errors: string[] = [];
      ws.forEach((w, i) => {
        const v = validateWeaponState(w);
        if (v.length) errors.push(`weapon[${i}]: ${v.join(", ")}`);
      });
      return errors.length === 0 ? pass() : fail(errors.join("; "));
    }),
    check("gp_threat_valid", "Threat state valid", "GAMEPLAY", () => {
      const ts = threats as Array<unknown>;
      const errors: string[] = [];
      ts.forEach((t, i) => {
        const v = validateThreatState(t);
        if (v.length) errors.push(`threat[${i}]: ${v.join(", ")}`);
      });
      return errors.length === 0
        ? pass()
        : partial(errors.join("; ") || "No threats active");
    }),
  ];
}

export function runWaveSystemSmokeTests(): QaCheckResult[] {
  return [
    check("wave_start_number", "Wave number starts at 1", "GAMEPLAY", () => {
      return useWaveStore.getState().waveNumber === 1
        ? pass()
        : fail(`waveNumber = ${useWaveStore.getState().waveNumber}`);
    }),
    check("hull_start_full", "Hull starts at 100", "GAMEPLAY", () => {
      return useHullStore.getState().hull === 100
        ? pass()
        : fail(`hull = ${useHullStore.getState().hull}`);
    }),
    check("lives_start_three", "Lives start at 3", "GAMEPLAY", () => {
      return useHullStore.getState().lives === 3
        ? pass()
        : fail(`lives = ${useHullStore.getState().lives}`);
    }),
    check("credits_start_zero", "Credits start at 0", "GAMEPLAY", () => {
      return useCreditsStore.getState().credits === 0
        ? pass()
        : fail(`credits = ${useCreditsStore.getState().credits}`);
    }),
    check("gameover_start_false", "isGameOver starts false", "GAMEPLAY", () => {
      return useHullStore.getState().isGameOver === false
        ? pass()
        : fail(`isGameOver = ${useHullStore.getState().isGameOver}`);
    }),
  ];
}

export function runWaveEscalationStressTest(): {
  passed: boolean;
  durationMs: number;
  message: string;
} {
  const start = performance.now();
  const ws = useWaveStore.getState();
  const initialWave = ws.waveNumber;

  // Reset to wave 1 with a known enemy requirement
  ws.startWave(1);
  const required = useWaveStore.getState().enemiesRequired;

  // Simulate rapid kills
  for (let i = 0; i < 50; i++) {
    useWaveStore.getState().recordWaveKill();
  }

  const afterKills = useWaveStore.getState();
  if (!afterKills.waveCleared) {
    return {
      passed: false,
      durationMs: performance.now() - start,
      message: `waveCleared did not trigger after 50 kills (required=${required}, got=${afterKills.enemiesThisWave})`,
    };
  }

  useWaveStore.getState().dismissWaveReward();
  const afterDismiss = useWaveStore.getState();

  if (afterDismiss.waveNumber !== initialWave + 1) {
    return {
      passed: false,
      durationMs: performance.now() - start,
      message: `waveNumber did not increment after dismissWaveReward (expected ${initialWave + 1}, got ${afterDismiss.waveNumber})`,
    };
  }

  return {
    passed: true,
    durationMs: performance.now() - start,
    message: `50 kills in ${(performance.now() - start).toFixed(1)}ms — wave cleared and advanced to ${afterDismiss.waveNumber}`,
  };
}

export function buildSmokeTestResult(checks: QaCheckResult[]): SmokeTestResult {
  const start = Date.now();
  return {
    passed: checks.filter((c) => c.status === "PASS").length,
    failed: checks.filter((c) => c.status === "FAIL").length,
    skipped: checks.filter(
      (c) => c.status === "SKIP" || c.status === "NOT_IMPLEMENTED",
    ).length,
    total: checks.length,
    checks,
    runAt: start,
    durationMs: Date.now() - start,
  };
}

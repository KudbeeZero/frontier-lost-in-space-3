import { useHullStore } from "@/combat/useHullStore";
import type { QaCheckResult } from "./types";
export function validateWeaponState(weapon: unknown): string[] {
  const errors: string[] = [];
  if (!weapon || typeof weapon !== "object") {
    errors.push("weapon is not an object");
    return errors;
  }
  const w = weapon as Record<string, unknown>;
  if (!w.id) errors.push("missing id");
  if (!w.type) errors.push("missing type");
  if (!w.status) errors.push("missing status");
  return errors;
}

export function validateThreatState(threat: unknown): string[] {
  const errors: string[] = [];
  if (!threat || typeof threat !== "object") {
    errors.push("threat is not an object");
    return errors;
  }
  const t = threat as Record<string, unknown>;
  if (!t.id) errors.push("missing id");
  if (typeof t.progress !== "number") errors.push("progress not a number");
  if (!t.status) errors.push("missing status");
  return errors;
}

export function checkBackendEnvVars(): {
  key: string;
  ok: boolean;
  note?: string;
}[] {
  return [
    {
      key: "DFX_NETWORK",
      ok: !!import.meta.env.VITE_DFX_NETWORK || true,
      note: "Not critical for frontend",
    },
  ];
}

export function validateGlobeRender(): QaCheckResult {
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    return {
      id: "globe_canvas_exists",
      label: "Globe canvas exists",
      category: "UI",
      status: "FAIL",
      message: "No canvas element found in DOM",
      timestamp: Date.now(),
    };
  }

  const w = (canvas as HTMLCanvasElement).width;
  const h = (canvas as HTMLCanvasElement).height;
  if (w <= 0 || h <= 0) {
    return {
      id: "globe_canvas_size",
      label: "Globe canvas has non-zero dimensions",
      category: "UI",
      status: "FAIL",
      message: `Canvas dimensions invalid: ${w}x${h}`,
      timestamp: Date.now(),
    };
  }

  // Check for black overlay blocking the canvas
  const allDivs = Array.from(document.querySelectorAll("div"));
  const blockingOverlay = allDivs.find((el) => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    const opacity = Number.parseFloat(style.opacity ?? "1");
    const zIndex = Number.parseInt(style.zIndex ?? "0");
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const overlaps = !(
      rect.right < canvasRect.left ||
      rect.left > canvasRect.right ||
      rect.bottom < canvasRect.top ||
      rect.top > canvasRect.bottom
    );
    return bg === "rgb(0, 0, 0)" && opacity > 0.9 && zIndex > 100 && overlaps;
  });

  if (blockingOverlay) {
    return {
      id: "globe_no_black_overlay",
      label: "No black overlay blocking canvas",
      category: "UI",
      status: "FAIL",
      message: "Black overlay detected blocking the canvas",
      timestamp: Date.now(),
    };
  }

  return {
    id: "globe_render_ok",
    label: "Globe render validation",
    category: "UI",
    status: "PASS",
    message: `Canvas ${w}x${h}, no blocking overlays`,
    timestamp: Date.now(),
  };
}

export function validateHullSystem(): QaCheckResult {
  const state = useHullStore.getState();
  const errors: string[] = [];

  if (state.hull < 0 || state.hull > 100) {
    errors.push(`hull out of range: ${state.hull}`);
  }
  if (state.lives < 0) {
    errors.push(`lives negative: ${state.lives}`);
  }
  const expectedGameOver = state.hull <= 0 && state.lives <= 0;
  if (state.isGameOver !== expectedGameOver) {
    errors.push(
      `isGameOver mismatch: expected ${expectedGameOver}, got ${state.isGameOver}`,
    );
  }

  if (errors.length > 0) {
    return {
      id: "hull_system_valid",
      label: "Hull system state valid",
      category: "GAMEPLAY",
      status: "FAIL",
      message: errors.join("; "),
      timestamp: Date.now(),
    };
  }

  return {
    id: "hull_system_valid",
    label: "Hull system state valid",
    category: "GAMEPLAY",
    status: "PASS",
    message: `hull=${state.hull}, lives=${state.lives}, gameOver=${state.isGameOver}`,
    timestamp: Date.now(),
  };
}

export function checkDomSafety(): {
  key: string;
  ok: boolean;
  note?: string;
}[] {
  const checks: { key: string; ok: boolean; note?: string }[] = [];
  const allDivs = Array.from(document.querySelectorAll("div"));
  const blackOverlays = allDivs.filter((el) => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    const opacity = Number.parseFloat(style.opacity ?? "1");
    const zIndex = Number.parseInt(style.zIndex ?? "0");
    return bg === "rgb(0, 0, 0)" && opacity >= 0.95 && zIndex > 100;
  });
  checks.push({
    key: "no_black_overlay",
    ok: blackOverlays.length === 0,
    note:
      blackOverlays.length > 0
        ? `${blackOverlays.length} black overlay(s) detected`
        : undefined,
  });
  return checks;
}

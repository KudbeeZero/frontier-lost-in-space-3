/**
 * NebulaBackdrop — R3F canvas layer behind the CinematicIntro DOM content.
 *
 * Renders a nebula HDRI skybox using @react-three/drei <Environment> with
 * a slow OrbitControls auto-rotate for a drifting-through-space feel.
 *
 * ASSET REQUIRED:
 *   Place an HDR file at:  frontend/public/assets/nebula.hdr
 *
 *   Recommended free sources:
 *   • Poly Haven: https://polyhaven.com/hdris  (search "space" or "nebula")
 *   • Free skybox pack: download any .hdr, rename to nebula.hdr
 *
 * FALLBACK: If the file is missing or fails to load, this component renders
 * nothing — the existing CSS gradient background in CinematicIntro shows
 * instead. No errors are thrown to the parent.
 *
 * Caffeine-safe: this file is purely additive and does not touch any
 * Caffeine-managed configs (caffeine.lock.json, env.json, @caffeine/* pkgs).
 */
import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";

// ── Tiny error boundary so a missing HDR doesn't crash the intro ──────────
interface EBState {
  failed: boolean;
}
class NebulaErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError(): EBState {
    return { failed: true };
  }
  override componentDidCatch(err: unknown) {
    // Suppress console noise for missing HDR in local dev
    if (import.meta.env.DEV) {
      console.info(
        "[NebulaBackdrop] HDR not found or failed to load — " +
          "place nebula.hdr in frontend/public/assets/ for the full effect.",
        err,
      );
    }
  }
  override render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

// ── Inner R3F scene — only mounts inside the Canvas ──────────────────────
function NebulaScene() {
  return (
    <>
      <Environment
        files="/assets/nebula.hdr"
        background
        backgroundBlurriness={0.4}
        backgroundIntensity={0.9}
      />
      {/* Slow drift: camera orbits the skybox origin giving a parallax feel */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────
export default function NebulaBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <NebulaErrorBoundary>
        <Suspense fallback={null}>
          <Canvas
            style={{ width: "100%", height: "100%" }}
            camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 0.001] }}
            gl={{ antialias: false, alpha: true }}
            dpr={1}
          >
            <NebulaScene />
          </Canvas>
        </Suspense>
      </NebulaErrorBoundary>
    </div>
  );
}

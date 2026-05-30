import { Component, type ReactNode, useEffect, useRef } from "react";
import TacticalStage from "./TacticalStage";
import BootLoadingScreen from "./boot/BootLoadingScreen";
import { runBootSequence } from "./boot/BootManager";
import { useBootStore } from "./boot/useBootStore";
import DiagnosticHUD from "./components/debug/DiagnosticHUD";
import SpacePhysicsDebug from "./components/debug/SpacePhysicsDebug";
import CockpitOverlay from "./components/game/CockpitOverlay";
import GameStateDebugOverlay from "./components/game/GameStateDebugOverlay";
import MenuBackground from "./components/game/MenuBackground";
import StartCampaignButton from "./components/ui/StartCampaignButton";
import { useGameState } from "./state/useGameState";
import { bootTrace } from "./utils/bootTrace";

// NOTE: CinematicIntro, IntroSequence, and StoryEventModal are intentionally
// removed from the active game flow. They remain in the codebase but are not
// imported or rendered at the app root level. To re-enable, restore imports
// and add conditional rendering for mode === "intro".

// ── Error Boundary ──────────────────────────────────────────────────────────
interface EBState {
  hasError: boolean;
  message: string;
  stack: string;
}
class GameRootErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "", stack: "" };
  }
  static getDerivedStateFromError(err: unknown): EBState {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? (err.stack ?? "") : "",
    };
  }
  override componentDidCatch(
    error: Error,
    errorInfo: { componentStack: string },
  ) {
    console.error("[GameRootErrorBoundary]", error, errorInfo);
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "#0a0a0a",
            padding: "2rem",
            overflow: "auto",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              marginBottom: "1.5rem",
            }}
          >
            [ A.E.G.I.S. — TACTICAL STAGE FAULT ]
          </div>
          <div
            style={{
              color: "#ff4444",
              fontSize: "1rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              wordBreak: "break-all",
            }}
          >
            {this.state.message}
          </div>
          {this.state.stack && (
            <pre
              style={{
                color: "#ff6666",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: "0 0 1.5rem 0",
                lineHeight: 1.5,
              }}
            >
              {this.state.stack}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              border: "1px solid #ff4444",
              color: "#ff4444",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              letterSpacing: "0.15em",
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GameModeDebug({ mode }: { mode: string }) {
  if (typeof localStorage === "undefined") return null;
  if (localStorage.getItem("debug_gamemode") !== "1") return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        fontFamily: "monospace",
        fontSize: 10,
        color: "rgba(0,220,255,0.5)",
        background: "rgba(0,0,0,0.5)",
        padding: "2px 6px",
        borderRadius: 2,
        pointerEvents: "none",
        zIndex: 99999,
        letterSpacing: "0.1em",
      }}
    >
      [GAME MODE: {mode}]
    </div>
  );
}

export default function App() {
  // ── SIMPLIFIED FLOW: START HERE → game directly ───────────────────────────
  //    CinematicIntro and IntroSequence are bypassed.
  //    Re-enable by restoring introPlaying/introComplete/initIntroGating
  //    selectors and the effects below.
  const mode = useGameState((s) => s.mode);
  const phase = useBootStore((s) => s.phase);
  const bootStarted = useRef(false);

  // ── Boot trace — logs every render with current mode ─────────────────────
  bootTrace(`App render — mode: ${mode}`);
  console.log(`[GameState] App render — mode: ${mode}`);

  // ── [FLOW] Log every mode transition ──────────────────────────────────────
  useEffect(() => {
    console.log("[FLOW] mode changed to:", mode);
  }, [mode]);

  // ── App mounted ───────────────────────────────────────────────────────────
  useEffect(() => {
    bootTrace("App mounted");
  }, []);

  // ── Deterministic boot sequence — runs once ───────────────────────────────
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    runBootSequence(useBootStore.getState());
  }, []);

  // ── NEVER render null — boot screen gates the app ────────────────────────
  if (phase !== "ready") return <BootLoadingScreen />;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; background: #000008; overscroll-behavior: none; touch-action: none; }
        #root { width: 100%; height: 100%; }
      `}</style>

      <div
        id="fade-overlay"
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          opacity: 0,
          transition: "opacity 0.9s ease",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100dvh",
          overflow: "hidden",
          background: "#000008",
          boxSizing: "border-box" as const,
          position: "relative",
        }}
      >
        {/* ── MENU MODE ──────────────────────────────────────────────────── */}
        {mode === "menu" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100dvh",
              background: "#000010",
              overflow: "hidden",
            }}
          >
            <MenuBackground />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,8,0.45)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  color: "rgba(220,240,255,0.92)",
                  letterSpacing: "0.55em",
                  fontSize: "clamp(22px, 4.5vw, 56px)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  textShadow:
                    "0 0 32px rgba(0,200,255,0.45), 0 2px 4px rgba(0,0,0,0.8)",
                  lineHeight: 1,
                }}
              >
                FRONTIER
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontFamily: "monospace",
                  color: "rgba(80,190,120,0.72)",
                  letterSpacing: "0.38em",
                  fontSize: "clamp(9px, 1.4vw, 16px)",
                  whiteSpace: "nowrap",
                  textShadow: "0 0 12px rgba(60,200,100,0.25)",
                  lineHeight: 1,
                }}
              >
                LOST IN SPACE
              </div>
              <div style={{ pointerEvents: "auto" }}>
                <StartCampaignButton />
              </div>
            </div>
          </div>
        )}

        {/* ── GAME MODE — TacticalStage ──────────────────────────────────── */}
        {/* CinematicIntro + IntroSequence bypassed — START HERE → game direct */}
        {mode === "game" && (
          <GameRootErrorBoundary>
            <TacticalStage />
          </GameRootErrorBoundary>
        )}

        {/* ── CATCH-ALL — unexpected / undefined mode ────────────────────── */}
        {mode !== "menu" && mode !== "game" && (
          <UnmatchedModeFallback mode={mode} />
        )}

        <CockpitOverlay />
      </div>

      <GameModeDebug mode={mode} />
      <GameStateDebugOverlay />
      <DiagnosticHUD />
      <SpacePhysicsDebug />
    </>
  );
}

/** Catch-all fallback for unexpected/undefined game mode */
function UnmatchedModeFallback({ mode }: { mode: string }) {
  const setMode = useGameState((s) => s.setMode);

  console.warn("[GameState] Unmatched mode — rendering fallback", { mode });

  return (
    <div
      data-ocid="app.fallback.panel"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,4,12,0.97)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontFamily: "monospace",
        zIndex: 500,
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.3em",
          color: "rgba(255,100,100,0.5)",
          marginBottom: 4,
        }}
      >
        A.E.G.I.S. — STATE UNDEFINED
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.2em",
          color: "rgba(200,220,255,0.6)",
        }}
      >
        UNKNOWN MODE: {mode || "(empty)"}
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          data-ocid="app.fallback.menu_button"
          onClick={() => setMode("menu")}
          style={{
            padding: "10px 24px",
            background: "rgba(0,20,40,0.8)",
            border: "1px solid rgba(0,200,255,0.4)",
            color: "rgba(0,210,255,0.85)",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.18em",
            cursor: "pointer",
            borderRadius: 3,
          }}
        >
          RETURN TO MENU
        </button>
        <button
          type="button"
          data-ocid="app.fallback.game_button"
          onClick={() => setMode("game")}
          style={{
            padding: "10px 24px",
            background: "rgba(0,20,10,0.8)",
            border: "1px solid rgba(0,255,136,0.35)",
            color: "rgba(0,240,120,0.85)",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.18em",
            cursor: "pointer",
            borderRadius: 3,
          }}
        >
          ENTER COCKPIT
        </button>
      </div>
    </div>
  );
}

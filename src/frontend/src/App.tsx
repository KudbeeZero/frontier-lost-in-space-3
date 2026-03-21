import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import TacticalStage from "./TacticalStage";
import CockpitOverlay from "./components/game/CockpitOverlay";
import IntroSequence from "./components/game/IntroSequence";
import MenuBackground from "./components/game/MenuBackground";
import StartCampaignButton from "./components/ui/StartCampaignButton";
import CinematicIntro from "./intro/CinematicIntro";
import { useIntroStore } from "./intro/useIntroStore";
import { useGameState } from "./state/useGameState";

// ─── Root error boundary ──────────────────────────────────────────────────────
interface EBState {
  hasError: boolean;
  message: string;
}
class GameRootErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err: unknown): EBState {
    console.error("[GameRootErrorBoundary] caught:", err);
    return { hasError: true, message: String(err).slice(0, 200) };
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000810",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            color: "rgba(0,200,255,0.7)",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              fontSize: "clamp(10px,1.5vw,14px)",
              letterSpacing: "0.2em",
              marginBottom: 12,
            }}
          >
            A.E.G.I.S. — SYSTEM FAULT
          </div>
          <div
            style={{
              fontSize: "clamp(8px,1vw,10px)",
              color: "rgba(255,100,100,0.6)",
              maxWidth: "80vw",
              textAlign: "center",
            }}
          >
            {this.state.message}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24,
              padding: "8px 24px",
              background: "transparent",
              border: "1px solid rgba(0,180,220,0.4)",
              borderRadius: 4,
              color: "rgba(0,200,255,0.8)",
              fontFamily: "monospace",
              fontSize: "clamp(9px,1.1vw,11px)",
              letterSpacing: "0.18em",
              cursor: "pointer",
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Boot screen ──────────────────────────────────────────────────────────────
function BootScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000008",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        fontSize: "clamp(8px,1.1vw,11px)",
        letterSpacing: "0.25em",
        color: "rgba(0,180,220,0.35)",
        zIndex: 99998,
        pointerEvents: "none",
      }}
    >
      INITIALIZING
    </div>
  );
}

// ─── Debug mode badge ─────────────────────────────────────────────────────────
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const introPlaying = useIntroStore((s) => s.introPlaying);
  const introComplete = useIntroStore((s) => s.introComplete);
  const initIntroGating = useIntroStore((s) => s.initIntroGating);
  const mode = useGameState((s) => s.mode);
  const initRef = useRef(false);
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log("[App] Boot — initialising intro gating");
    initIntroGating();
    setStoreReady(true);

    // Safety net: if after 600ms neither flag is set, force to game
    setTimeout(() => {
      const state = useIntroStore.getState();
      if (!state.introPlaying && !state.introComplete) {
        console.warn("[App] Safety fallback: bypassing intro (stuck state)");
        state.skipIntro();
      }
    }, 600);
  }, [initIntroGating]);

  if (!storeReady) return <BootScreen />;

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          background: #000008;
          overscroll-behavior: none;
          touch-action: none;
        }
        #root {
          width: 100%;
          height: 100%;
        }
      `}</style>

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
        {/* Existing CinematicIntro gate — preserved unchanged */}
        {introPlaying && <CinematicIntro />}

        {/* Mode-based routing — only active when legacy intro is NOT playing */}
        {!introPlaying && (
          <>
            {/* MENU */}
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
                {/* Cinematic background: video once → static image */}
                <MenuBackground />

                {/* Dark overlay so title / button stay readable over the video */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,8,0.45)",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                />

                {/* FRONTIER title */}
                <div
                  style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "monospace",
                    color: "rgba(0,200,255,0.85)",
                    letterSpacing: "0.5em",
                    fontSize: "clamp(18px,3vw,36px)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 3,
                    textShadow: "0 0 24px rgba(0,200,255,0.4)",
                  }}
                >
                  FRONTIER
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "calc(30% + 50px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "monospace",
                    color: "rgba(0,150,200,0.5)",
                    letterSpacing: "0.35em",
                    fontSize: "clamp(9px,1.1vw,13px)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                >
                  LOST IN SPACE
                </div>

                {/* START CAMPAIGN sits above the overlay */}
                <div style={{ position: "relative", zIndex: 4 }}>
                  <StartCampaignButton />
                </div>
              </div>
            )}

            {/* INTRO — narrative phase sequence */}
            {mode === "intro" && <IntroSequence />}

            {/* GAME — full tactical stage */}
            {mode === "game" && (
              <GameRootErrorBoundary>
                <TacticalStage />
              </GameRootErrorBoundary>
            )}

            {introComplete && mode === "game" && null}
          </>
        )}

        {/* Cockpit atmosphere — always on top of game content, never blocks input */}
        <CockpitOverlay />
      </div>

      <GameModeDebug mode={mode} />
    </>
  );
}

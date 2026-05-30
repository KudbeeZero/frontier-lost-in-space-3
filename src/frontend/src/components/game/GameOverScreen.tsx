/**
 * GameOverScreen.tsx
 *
 * Full-screen game-over overlay with glassmorphic styling.
 * Displays final score, wave reached, total kills, and a play-again button.
 *
 * RULES:
 *   - Returns null when not visible
 *   - pointer-events: auto on panel/button, none on invisible backdrop
 *   - No setState during render
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface GameOverScreenProps {
  isVisible: boolean;
  finalScore: number;
  waveReached: number;
  totalKills: number;
  onPlayAgain: () => void;
}

export default function GameOverScreen({
  isVisible,
  finalScore,
  waveReached,
  totalKills,
  onPlayAgain,
}: GameOverScreenProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Small delay for dramatic effect
      timerRef.current = setTimeout(() => setShow(true), 300);
    } else {
      setShow(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible]);

  const handlePlayAgain = useCallback(() => {
    setShow(false);
    // Allow fade-out before reset
    setTimeout(() => onPlayAgain(), 400);
  }, [onPlayAgain]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        pointerEvents: "auto",
        opacity: show ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
      data-ocid="gameover.panel"
    >
      <div
        style={{
          width: "min(420px, 90vw)",
          background: "rgba(0, 10, 30, 0.85)",
          border: "1px solid rgba(0, 200, 255, 0.25)",
          borderRadius: 24,
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow:
            "0 0 40px rgba(0, 150, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.6)",
          transform: show ? "scale(1)" : "scale(0.92)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(18px, 4vw, 28px)",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "rgba(255, 80, 80, 0.95)",
            textTransform: "uppercase",
            textAlign: "center",
            margin: 0,
            textShadow: "0 0 20px rgba(255, 60, 60, 0.4)",
          }}
        >
          MISSION FAILED
        </h2>

        {/* Divider */}
        <div
          style={{
            width: "60%",
            height: 1,
            background: "rgba(0, 200, 255, 0.2)",
          }}
        />

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 24px",
            width: "100%",
          }}
        >
          <StatBox
            label="FINAL SCORE"
            value={String(finalScore)}
            color="#00e5ff"
          />
          <StatBox
            label="WAVE REACHED"
            value={String(waveReached)}
            color="#ffb830"
          />
          <StatBox
            label="TOTAL KILLS"
            value={String(totalKills)}
            color="#00ff88"
          />
          <StatBox label="SURVIVAL TIME" value="--:--" color="#ff6688" />
        </div>

        {/* Divider */}
        <div
          style={{
            width: "60%",
            height: 1,
            background: "rgba(0, 200, 255, 0.2)",
          }}
        />

        {/* Play Again button */}
        <button
          type="button"
          onClick={handlePlayAgain}
          data-ocid="gameover.play_again_button"
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(13px, 2.5vw, 16px)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "rgba(0, 220, 255, 0.95)",
            background: "rgba(0, 40, 80, 0.6)",
            border: "1px solid rgba(0, 200, 255, 0.4)",
            borderRadius: 32,
            padding: "14px 36px",
            cursor: "pointer",
            pointerEvents: "auto",
            WebkitTapHighlightColor: "transparent",
            textTransform: "uppercase",
            transition: "all 0.2s ease",
            boxShadow: "0 0 16px rgba(0, 150, 255, 0.2)",
            minHeight: 48,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 60, 120, 0.7)";
            e.currentTarget.style.boxShadow =
              "0 0 24px rgba(0, 180, 255, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 40, 80, 0.6)";
            e.currentTarget.style.boxShadow = "0 0 16px rgba(0, 150, 255, 0.2)";
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "clamp(8px, 1.2vw, 10px)",
          letterSpacing: "0.14em",
          color: "rgba(0, 180, 255, 0.5)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "clamp(16px, 3vw, 24px)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color,
          textShadow: `0 0 12px ${color}40`,
        }}
      >
        {value}
      </span>
    </div>
  );
}

import { useStageStore } from "@/stages/useStageStore";
import { useXpStore } from "@/xp/useXpStore";
import React, { useEffect, useState } from "react";

export function XpHudBar() {
  const {
    xp,
    level,
    xpToNextLevel,
    totalKills,
    floatingNumbers,
    sectorCleared,
    dismissSectorCleared,
  } = useXpStore();
  const { currentStage, stageKillCount, nextStage } = useStageStore();
  const [showCleared, setShowCleared] = useState(false);

  const progress = Math.min(100, (xp / xpToNextLevel) * 100);
  const stageProgress = currentStage
    ? Math.min(100, (stageKillCount / currentStage.killsRequired) * 100)
    : 0;

  useEffect(() => {
    if (sectorCleared) {
      setShowCleared(true);
      const t = setTimeout(() => {
        setShowCleared(false);
        dismissSectorCleared();
        nextStage();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [sectorCleared, dismissSectorCleared, nextStage]);

  return (
    <>
      {/* Top HUD Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm border-b border-cyan-500/30">
          {/* Level & XP */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold text-sm shrink-0">
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-200/80 truncate">
                {currentStage?.name || "Mission"}
              </div>
              <div className="w-32 h-2 bg-black/50 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-cyan-500/20">
            <span className="text-xs text-cyan-300/90">
              {stageKillCount}/{currentStage?.killsRequired || 0}
            </span>
            <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
          </div>

          {/* Kills */}
          <div className="flex items-center gap-1.5 text-xs text-cyan-200/70 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {totalKills} Kills
          </div>
        </div>
      </div>

      {/* Floating XP Numbers */}
      {floatingNumbers.map((float) => (
        <div
          key={float.id}
          className="fixed z-50 pointer-events-none text-cyan-300 font-bold text-lg animate-float-up"
          style={{
            left: `${float.x}%`,
            top: `${float.y}%`,
            textShadow: "0 0 8px rgba(6,182,212,0.6)",
          }}
        >
          +{float.value} XP
        </div>
      ))}

      {/* Sector Cleared Cinematic */}
      {showCleared && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative text-center animate-scale-in">
            <div
              className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 tracking-widest uppercase"
              style={{ textShadow: "0 0 30px rgba(6,182,212,0.5)" }}
            >
              Sector Cleared
            </div>
            <div className="mt-4 text-lg text-cyan-200/80">
              Stage {currentStage?.id} Complete
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400">
              +{currentStage?.reward} Credits
            </div>
            <div className="mt-6 text-sm text-cyan-300/60">
              Preparing next sector...
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.2); }
        }
        .animate-float-up {
          animation: float-up 1.2s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.8s ease-out;
        }
      `}</style>
    </>
  );
}

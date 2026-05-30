import { useCreditsStore } from "../../combat/useCreditsStore";

interface WaveRewardScreenProps {
  isVisible: boolean;
  waveNumber: number;
  creditsEarned: number;
  onHullRepair: () => void;
  onWeaponUpgrade: () => void;
  onShieldRecharge: () => void;
  onContinue: () => void;
}

export default function WaveRewardScreen({
  isVisible,
  waveNumber,
  creditsEarned,
  onHullRepair,
  onWeaponUpgrade,
  onShieldRecharge,
  onContinue,
}: WaveRewardScreenProps) {
  const credits = useCreditsStore((s) => s.credits);

  if (!isVisible) return null;

  const canRepair = credits >= 50;
  const canUpgrade = credits >= 75;
  const canRecharge = credits >= 40;

  return (
    <div
      data-ocid="wave_reward.panel"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 8, 0.65)",
        pointerEvents: "auto",
      }}
    >
      <div
        className="wave-reward-panel"
        style={{ padding: "28px 36px", maxWidth: 420, width: "90vw" }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(14px, 2.2vw, 18px)",
              fontWeight: 700,
              letterSpacing: "0.25em",
              color: "#00ff88",
              textShadow: "0 0 12px rgba(0,255,136,0.4)",
              marginBottom: 8,
            }}
          >
            WAVE {waveNumber} CLEARED!
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.4vw, 12px)",
              letterSpacing: "0.15em",
              color: "rgba(0,200,255,0.7)",
            }}
          >
            CREDITS EARNED: {creditsEarned}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.4vw, 12px)",
              letterSpacing: "0.15em",
              color: "rgba(0,220,180,0.6)",
              marginTop: 4,
            }}
          >
            BALANCE: {credits} CR
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            data-ocid="wave_reward.repair_button"
            onClick={onHullRepair}
            disabled={!canRepair}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(0,180,220,0.35)",
              background: canRepair
                ? "rgba(0,180,220,0.12)"
                : "rgba(0,180,220,0.04)",
              color: canRepair ? "rgba(0,220,255,0.9)" : "rgba(0,220,255,0.3)",
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.4vw, 12px)",
              letterSpacing: "0.12em",
              cursor: canRepair ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>REPAIR HULL</span>
            <span style={{ opacity: 0.7 }}>50 CR</span>
          </button>

          <button
            type="button"
            data-ocid="wave_reward.upgrade_button"
            onClick={onWeaponUpgrade}
            disabled={!canUpgrade}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,184,48,0.35)",
              background: canUpgrade
                ? "rgba(255,184,48,0.12)"
                : "rgba(255,184,48,0.04)",
              color: canUpgrade
                ? "rgba(255,200,80,0.9)"
                : "rgba(255,200,80,0.3)",
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.4vw, 12px)",
              letterSpacing: "0.12em",
              cursor: canUpgrade ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>WEAPON UPGRADE</span>
            <span style={{ opacity: 0.7 }}>75 CR</span>
          </button>

          <button
            type="button"
            data-ocid="wave_reward.shield_button"
            onClick={onShieldRecharge}
            disabled={!canRecharge}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(0,220,180,0.35)",
              background: canRecharge
                ? "rgba(0,220,180,0.12)"
                : "rgba(0,220,180,0.04)",
              color: canRecharge
                ? "rgba(0,255,200,0.9)"
                : "rgba(0,255,200,0.3)",
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.4vw, 12px)",
              letterSpacing: "0.12em",
              cursor: canRecharge ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>RECHARGE SHIELDS</span>
            <span style={{ opacity: 0.7 }}>40 CR</span>
          </button>
        </div>

        <button
          type="button"
          data-ocid="wave_reward.continue_button"
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 8,
            border: "1px solid rgba(0,229,255,0.45)",
            background: "rgba(0,229,255,0.15)",
            color: "#00e5ff",
            fontFamily: "monospace",
            fontSize: "clamp(12px, 1.8vw, 14px)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textShadow: "0 0 8px rgba(0,229,255,0.3)",
          }}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}

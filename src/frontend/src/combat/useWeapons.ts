import { create } from "zustand";
import { useTacticalStore } from "../hooks/useTacticalStore";
import { triggerBattleJolt } from "../motion/shipMotionEngine";
import { useSpacePhysicsStore } from "../physics/useSpacePhysicsStore";
import { useCombatState } from "./useCombatState";
import type { WeaponType } from "./useCombatState";
import { useEnemyStore } from "./useEnemyStore";
import { useThreatStore } from "./useThreatStore";
import {
  initAudio,
  playFire,
  playImpact,
  playMissileWind,
} from "./weaponSynth";

export type WeaponStatus = "READY" | "COOLDOWN" | "RELOADING";

export interface Weapon {
  id: string;
  name: string;
  shortLabel: string;
  cooldownTime: number;
  currentCooldown: number;
  status: WeaponStatus;
  type: WeaponType;
  color: string;
  glowColor: string;
  /** Rail gun ammo */
  ammo?: number;
  maxAmmo?: number;
  reloadTime?: number;
  reloadProgress?: number;
  /** Requires a locked target (all do, but explicit for missile UI hint) */
  requiresLock?: boolean;
}

/**
 * Active 4-slot loadout.
 * NOTE: cooldownTime set to 0 for testing — all weapons fire instantly.
 */
const INITIAL_WEAPONS: Weapon[] = [
  {
    id: "pulse",
    name: "PULSE CANNON",
    shortLabel: "PULSE",
    cooldownTime: 0,
    currentCooldown: 0,
    status: "READY",
    type: "pulse",
    color: "#00ffcc",
    glowColor: "rgba(0,255,200,0.4)",
  },
  {
    id: "rail",
    name: "RAIL GUN",
    shortLabel: "RAIL GUN",
    cooldownTime: 0,
    currentCooldown: 0,
    status: "READY",
    type: "railgun",
    color: "#44aaff",
    glowColor: "rgba(68,170,255,0.4)",
    ammo: 999,
    maxAmmo: 999,
    reloadTime: 1,
    reloadProgress: 0,
  },
  {
    id: "missile",
    name: "HEAT MISSILE",
    shortLabel: "MISSILE",
    cooldownTime: 0,
    currentCooldown: 0,
    status: "READY",
    type: "missile",
    color: "#ff6644",
    glowColor: "rgba(255,100,68,0.4)",
    requiresLock: true,
  },
  {
    id: "emp",
    name: "EMP BURST",
    shortLabel: "EMP",
    cooldownTime: 0,
    currentCooldown: 0,
    status: "READY",
    type: "emp",
    color: "#ff8800",
    glowColor: "rgba(255,136,0,0.4)",
  },
];

/** Inventory weapons (reserved for future loadout swapping) */
export const INVENTORY_WEAPONS: Weapon[] = [];

interface WeaponsStore {
  weapons: Weapon[];
  selectedWeaponId: string;
  lastFireAt: number;
  selectWeapon: (weaponId: string) => void;
  fire: (weaponId: string) => void;
  fireSelected: () => void;
  tick: (dtMs: number) => void;
}

export const useWeaponsStore = create<WeaponsStore>((set, get) => ({
  weapons: INITIAL_WEAPONS,
  selectedWeaponId: "pulse",

  lastFireAt: 0,

  selectWeapon: (weaponId: string) => {
    set({ selectedWeaponId: weaponId, lastFireAt: Date.now() });
  },

  fireSelected: () => {
    const { selectedWeaponId, fire } = get();
    fire(selectedWeaponId);
  },

  fire: (weaponId: string) => {
    // Ensure AudioContext is unlocked (iOS requires gesture-driven init)
    initAudio();

    const { selectedNode } = useTacticalStore.getState();
    if (!selectedNode) return;

    const weapon = get().weapons.find((w) => w.id === weaponId);
    if (!weapon) return;
    if (weapon.status !== "READY") return;
    // Rail gun ammo check (ammo is effectively unlimited in testing mode)
    if (weapon.type === "railgun" && (weapon.ammo ?? 1) <= 0) return;

    const {
      setFiringEffect,
      setTargetHitFlash,
      setEmpStunnedNode,
      setScreenFlash,
      setCameraShake,
      setDestructionEvent,
    } = useCombatState.getState();

    const duration =
      weapon.type === "pulse"
        ? 350
        : weapon.type === "railgun"
          ? 550
          : weapon.type === "missile"
            ? 900
            : 1100;

    setFiringEffect({
      weaponId,
      type: weapon.type,
      targetId: selectedNode,
      startTime: performance.now(),
      duration,
    });

    setCameraShake({
      intensity:
        weapon.type === "railgun"
          ? 0.06
          : weapon.type === "missile"
            ? 0.05
            : weapon.type === "emp"
              ? 0.04
              : 0.025,
      weaponType: weapon.type,
      startTime: performance.now(),
      duration:
        weapon.type === "railgun"
          ? 400
          : weapon.type === "missile"
            ? 500
            : weapon.type === "emp"
              ? 350
              : 250,
    });

    triggerBattleJolt(weapon.type);

    // ─── WEAPON FIRE SOUND ─────────────────────────────────────────────────
    const wType = weapon.type as "pulse" | "railgun" | "missile" | "emp";
    playFire(wType);
    if (wType === "missile") {
      playMissileWind();
    }

    // Schedule impact sound after projectile travels
    setTimeout(() => {
      playImpact(wType);
    }, duration);

    // ─── Spawn projectile in physics system ─────────────────────────────────
    const physState = useSpacePhysicsStore.getState();
    physState.fireProjectile(
      physState.shipPosition,
      { x: 0, y: 0, z: -1 }, // default forward direction; real aim direction wired later
    );

    setTargetHitFlash(true);
    setScreenFlash(true);

    setTimeout(() => setTargetHitFlash(false), duration);
    setTimeout(() => setScreenFlash(false), 120);
    setTimeout(() => setFiringEffect(null), duration + 100);

    if (weapon.type === "emp") {
      setEmpStunnedNode(selectedNode);
      setTimeout(() => setEmpStunnedNode(null), 3000);
    }

    set({ lastFireAt: Date.now() });
    useTacticalStore.getState().pushEventLog({
      msg: `${weapon.name} FIRED \u2192 ${selectedNode}`,
      type: "fire",
    });

    import("../tacticalLog/useTacticalLogStore").then(
      ({ useTacticalLogStore }) => {
        useTacticalLogStore.getState().addEntry({
          type: "combat",
          message: `${weapon.name} FIRED \u2192 ${selectedNode}`,
        });
      },
    );

    // ─── Damage logic per target type ───────────────────────────────────────
    if (selectedNode.startsWith("THREAT-")) {
      const { interceptThreat } = useThreatStore.getState();
      interceptThreat(selectedNode, weapon.type as "pulse" | "railgun" | "emp");

      const updatedThreat = useThreatStore
        .getState()
        .threats.find((t) => t.id === selectedNode);
      if (updatedThreat?.status === "DESTROYED") {
        setDestructionEvent({
          targetId: selectedNode,
          startTime: performance.now(),
          weaponType: weapon.type,
        });
        triggerBattleJolt(weapon.type, true);
        useTacticalStore.getState().pushEventLog({
          msg: `TARGET DESTROYED: ${selectedNode}`,
          type: "destroy",
        });
        import("../tacticalLog/useTacticalLogStore").then(
          ({ useTacticalLogStore }) => {
            useTacticalLogStore.getState().addEntry({
              type: "combat",
              message: `TARGET DESTROYED: ${selectedNode}`,
            });
          },
        );
      }
    }

    // Enemy satellite or base
    if (selectedNode.startsWith("SAT-") || selectedNode.startsWith("BASE-")) {
      useEnemyStore.getState().damageEnemy(selectedNode, weapon.type);

      const updatedEnemy = useEnemyStore
        .getState()
        .enemies.find((e) => e.id === selectedNode);
      if (updatedEnemy?.status === "destroyed") {
        setDestructionEvent({
          targetId: selectedNode,
          startTime: performance.now(),
          weaponType: weapon.type,
        });
        triggerBattleJolt(weapon.type, true);
        useTacticalStore.getState().pushEventLog({
          msg: `ENEMY DESTROYED: ${selectedNode}`,
          type: "destroy",
        });
        import("../tacticalLog/useTacticalLogStore").then(
          ({ useTacticalLogStore }) => {
            useTacticalLogStore.getState().addEntry({
              type: "combat",
              message: `ENEMY DESTROYED: ${updatedEnemy?.label ?? selectedNode}`,
            });
          },
        );
      }
    }

    // Update weapon state after firing — cooldowns are 0 so always READY
    set((state) => ({
      weapons: state.weapons.map((w) => {
        if (w.id !== weaponId) return w;
        // Rail gun: decrement ammo (effectively unlimited in testing mode)
        if (w.type === "railgun") {
          const newAmmo = (w.ammo ?? 1) - 1;
          if (newAmmo <= 0) {
            return {
              ...w,
              ammo: w.maxAmmo ?? 999,
              status: "READY" as WeaponStatus,
              reloadProgress: 0,
            };
          }
          // cooldownTime is 0 — stays READY
          return { ...w, ammo: newAmmo, status: "READY" as WeaponStatus };
        }
        // All other weapons — cooldown is 0, stay READY immediately
        return { ...w, status: "READY" as WeaponStatus, currentCooldown: 0 };
      }),
    }));
  },

  tick: (dtMs: number) => {
    set((state) => ({
      weapons: state.weapons.map((w) => {
        // Handle reloading (rail gun) — reloadTime is 1ms so instant
        if (w.status === "RELOADING" && w.reloadTime) {
          const nextProgress = (w.reloadProgress ?? 0) + dtMs / w.reloadTime;
          if (nextProgress >= 1) {
            return {
              ...w,
              status: "READY" as WeaponStatus,
              ammo: w.maxAmmo,
              reloadProgress: 0,
              currentCooldown: 0,
            };
          }
          return { ...w, reloadProgress: nextProgress };
        }
        // Handle cooldown — with cooldownTime=0, this path is never entered
        if (w.status !== "COOLDOWN") return w;
        const next = w.currentCooldown - dtMs / Math.max(1, w.cooldownTime);
        if (next <= 0)
          return { ...w, currentCooldown: 0, status: "READY" as WeaponStatus };
        return { ...w, currentCooldown: next };
      }),
    }));
  },
}));

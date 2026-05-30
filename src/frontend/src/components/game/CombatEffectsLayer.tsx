/**
 * CombatEffectsLayer — projectile and impact effects rendered inside the Canvas.
 *
 * ROTATION FIX (this pass):
 * ────────────────────────────────────
 * TGT-* targets store lat/lng in globe-LOCAL coordinates (accounting for
 * globe rotation at time of tap). To resolve the correct WORLD-SPACE position
 * for projectile targeting, we apply the current globeState.rotationY to the
 * local surface vector. Without this, projectiles fired at a TGT would aim at
 * the pre-rotation world position, drifting further from the visual target as
 * the globe rotates.
 *
 * MISSILE SMOKE TRAIL: MissileSmokeTail renders 20 semi-transparent spheres
 * sampled along the Bezier flight path behind the missile head, fading from
 * 0 at the tip to 0.6 at launch origin — realistic exhaust smoke effect.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { NODE_POSITIONS } from "../../GlobeCore";
import { useCombatState } from "../../combat/useCombatState";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { useThreatStore } from "../../combat/useThreatStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { globeState, toGlobeWorld } from "../../motion/globeState";
import { useShipStore } from "../../motion/useShipStore";
import DestructionEffects from "./DestructionEffects";
import {
  EMPImpact,
  MissileExplosion,
  PulseImpact,
  RailImpact,
} from "./ImpactEffects";
import {
  EMPWave,
  MissileTracer,
  PulseBolt,
  RailSlug,
  getShipOriginWorld,
} from "./ProjectileSystem";

/**
 * Resolve a targetId to a world-space THREE.Vector3.
 */
function resolveTargetPos(nodeId: string): THREE.Vector3 | null {
  // Fixed globe nodes — world-space, no rotation needed
  const nodePos = NODE_POSITIONS[nodeId];
  if (nodePos) {
    return nodePos.clone().multiplyScalar(1.53);
  }

  // Globe coordinate target (TGT-xxxx) — lat/lng in globe-local space
  if (nodeId.startsWith("TGT-")) {
    const gt = useTacticalStore.getState().globeTarget;
    if (gt?.lat !== undefined && gt?.lng !== undefined) {
      const phi = (90 - gt.lat) * (Math.PI / 180);
      const theta = (gt.lng + 180) * (Math.PI / 180);
      const localX = -1.53 * Math.sin(phi) * Math.cos(theta);
      const localY = 1.53 * Math.cos(phi);
      const localZ = 1.53 * Math.sin(phi) * Math.sin(theta);
      const [wx, wy, wz] = toGlobeWorld(localX, localY, localZ);
      return new THREE.Vector3(wx, wy, wz);
    }
    // Fallback: fire toward globe center from ship position
    const ship = useShipStore.getState();
    const r = ship.orbitalRadius;
    const cx = r * Math.cos(ship.orbitalPhi) * Math.sin(ship.orbitalTheta);
    const cy = r * Math.sin(ship.orbitalPhi);
    const cz = r * Math.cos(ship.orbitalPhi) * Math.cos(ship.orbitalTheta);
    return new THREE.Vector3(-cx, -cy, -cz).normalize().multiplyScalar(1.5);
  }

  // Threat target (THREAT-xxx) — world-space interpolated position
  if (nodeId.startsWith("THREAT-")) {
    const threat = useThreatStore
      .getState()
      .threats.find((t) => t.id === nodeId);
    if (threat) {
      const endPos = new THREE.Vector3(
        1.55 *
          Math.cos(threat.impactElevation) *
          Math.cos(threat.impactAzimuth),
        1.55 * Math.sin(threat.impactElevation),
        1.55 *
          Math.cos(threat.impactElevation) *
          Math.sin(threat.impactAzimuth),
      );
      const startPos = new THREE.Vector3(
        threat.startRadius *
          Math.cos(threat.startElevation) *
          Math.cos(threat.startAzimuth),
        threat.startRadius * Math.sin(threat.startElevation),
        threat.startRadius *
          Math.cos(threat.startElevation) *
          Math.sin(threat.startAzimuth),
      );
      return new THREE.Vector3().lerpVectors(startPos, endPos, threat.progress);
    }
  }

  // Enemy satellite or base (SAT-xxx / BASE-xxx) — world-space from store
  if (nodeId.startsWith("SAT-") || nodeId.startsWith("BASE-")) {
    const enemy = useEnemyStore.getState().enemies.find((e) => e.id === nodeId);
    if (enemy) {
      return new THREE.Vector3(enemy.px, enemy.py, enemy.pz);
    }
  }

  return null;
}

// ─── Missile Smoke Trail ───────────────────────────────────────────────────────

const TRAIL_COUNT = 20;
const _bezierScratch = new THREE.Vector3();
// Static key array — avoids index-as-key lint warning; keys are stable strings
const SMOKE_KEYS = [
  "s0",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "s12",
  "s13",
  "s14",
  "s15",
  "s16",
  "s17",
  "s18",
  "s19",
];

function bezierPt(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
): void {
  const mt = 1 - t;
  out.set(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
  );
}

interface MissileSmokeTailProps {
  originPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
}

function computeControlPoint(
  originPos: THREE.Vector3,
  targetPos: THREE.Vector3,
): THREE.Vector3 {
  const mid = new THREE.Vector3()
    .addVectors(originPos, targetPos)
    .multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(targetPos, originPos);
  const worldUp = new THREE.Vector3(0, 1, 0);
  const perp = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
  const kickDist = dir.length() * 0.2;
  return mid
    .clone()
    .addScaledVector(perp, kickDist * 0.6)
    .addScaledVector(worldUp, kickDist * 0.4);
}

function MissileSmokeTail({
  originPos,
  targetPos,
  startTime,
  duration,
}: MissileSmokeTailProps) {
  // Refs for each smoke sphere mesh and material
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(TRAIL_COUNT).fill(null));
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>(
    Array(TRAIL_COUNT).fill(null),
  );

  // Control point computed once at mount — matches MissileTracer bezier arc
  const controlPoint = useRef<THREE.Vector3>(
    computeControlPoint(originPos, targetPos),
  );

  useFrame(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const mesh = meshRefs.current[i];
      const mat = matRefs.current[i];
      if (!mesh || !mat) continue;

      // Distribute trail points from just behind the head back to launch
      // i=0 is closest to missile head (nearly tip), i=TRAIL_COUNT-1 is near origin
      const trailFrac = (i + 1) / TRAIL_COUNT; // 0.05 … 1.0
      const trailT = Math.max(0, progress - trailFrac * progress * 0.85);

      bezierPt(
        originPos,
        controlPoint.current,
        targetPos,
        trailT,
        _bezierScratch,
      );
      mesh.position.copy(_bezierScratch);

      // Opacity: 0 at tip (i=0) → 0.55 at tail (i=TRAIL_COUNT-1)
      // Fade out globally as missile nears impact
      const fadeOut =
        progress > 0.75 ? Math.max(0, 1 - (progress - 0.75) * 4) : 1;
      const baseOpacity = trailFrac * 0.55 * fadeOut;
      mat.opacity = baseOpacity;

      // Scale: grow the spheres toward the tail for puffier dissipation
      const scl = 0.6 + trailFrac * 0.8;
      mesh.scale.setScalar(scl);
    }
  });

  return (
    <group>
      {SMOKE_KEYS.map((key, i) => (
        <mesh
          key={key}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          renderOrder={90 - i}
        >
          <sphereGeometry args={[0.028, 5, 5]} />
          <meshBasicMaterial
            ref={(el) => {
              matRefs.current[i] = el;
            }}
            color={i < TRAIL_COUNT / 2 ? "#aaaaaa" : "#666666"}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main Layer ────────────────────────────────────────────────────────────────

export default function CombatEffectsLayer() {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const tick = useWeaponsStore((s) => s.tick);

  // Advance weapon cooldowns every frame
  useFrame((_, delta) => {
    tick(delta * 1000);
  });

  // Resolve at render time so effects always use the latest globe rotation
  const targetPos = firingEffect
    ? resolveTargetPos(firingEffect.targetId)
    : null;

  const originPos = firingEffect ? getShipOriginWorld() : undefined;

  // Suppress unused import lint — globeState is used inside resolveTargetPos
  void globeState;

  return (
    <group>
      <DestructionEffects />

      {firingEffect && targetPos && (
        <>
          {firingEffect.type === "pulse" && (
            <PulseBolt
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "railgun" && (
            <RailSlug
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "emp" && (
            <EMPWave
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "missile" && (
            <>
              <MissileTracer
                targetPos={targetPos}
                originPos={originPos}
                startTime={firingEffect.startTime}
                duration={firingEffect.duration}
              />
              {/* Smoke trail behind missile */}
              {originPos && (
                <MissileSmokeTail
                  originPos={originPos}
                  targetPos={targetPos}
                  startTime={firingEffect.startTime}
                  duration={firingEffect.duration}
                />
              )}
            </>
          )}
          {firingEffect.type === "pulse" && (
            <PulseImpact
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "railgun" && (
            <RailImpact
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "emp" && (
            <EMPImpact
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "missile" && (
            <MissileExplosion
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
        </>
      )}
    </group>
  );
}

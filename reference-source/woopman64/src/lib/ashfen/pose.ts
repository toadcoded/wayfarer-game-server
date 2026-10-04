import { approachAngle, clampZoom, expSmooth, ZOOM_MAX, ZOOM_MIN } from "./physics";

/** Tile velocity → yaw. Meshes face +Z; yaw 0 = south / +Z. */
export function yawFromVel(vx: number, vy: number, fallback: number): number {
  if (Math.abs(vx) < 0.04 && Math.abs(vy) < 0.04) return fallback;
  return Math.atan2(vx, vy);
}

export function yawFromDir(dir: "up" | "down" | "left" | "right"): number {
  if (dir === "down") return 0;
  if (dir === "right") return Math.PI / 2;
  if (dir === "left") return -Math.PI / 2;
  return Math.PI;
}

export const YAW_RATE = 11.5;

export function stepYaw(current: number, vx: number, vy: number, dt: number): number {
  const target = yawFromVel(vx, vy, current);
  if (target === current && Math.abs(vx) < 0.04 && Math.abs(vy) < 0.04) return current;
  return approachAngle(current, target, YAW_RATE, dt);
}

export type WalkJoints = {
  leftThigh: number;
  rightThigh: number;
  leftShin: number;
  rightShin: number;
  leftArm: number;
  rightArm: number;
  leftFore: number;
  rightFore: number;
  bob: number;
  sway: number;
  lean: number;
  torsoYaw: number;
  headPitch: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Opposite-limb human gait. `moving` may be a 0–1 gait weight. */
export function walkJoints(phase: number, moving: boolean | number, gather = 0): WalkJoints {
  const weight = typeof moving === "number" ? Math.min(1, Math.max(0, moving)) : moving ? 1 : 0;
  const breathe = Math.sin(phase * 0.42) * 0.012;
  const idle: WalkJoints = {
    leftThigh: 0.04,
    rightThigh: -0.03,
    leftShin: 0.08,
    rightShin: 0.1,
    leftArm: 0.12,
    rightArm: -0.08,
    leftFore: 0.18,
    rightFore: 0.22,
    bob: breathe + gather * 0.05,
    sway: 0,
    lean: 0.02,
    torsoYaw: 0,
    headPitch: breathe * 0.4,
  };
  if (weight < 0.02) return idle;

  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const s2 = Math.sin(phase + Math.PI);
  const w = weight;
  // Heel-toe: shin bends on the forward swing (clears the ground), extends on push-off.
  return {
    leftThigh: lerp(idle.leftThigh, -s * 0.7, w),
    rightThigh: lerp(idle.rightThigh, -s2 * 0.7, w),
    leftShin: lerp(idle.leftShin, 0.1 + Math.max(0, s) * 0.58, w),
    rightShin: lerp(idle.rightShin, 0.1 + Math.max(0, s2) * 0.58, w),
    leftArm: lerp(idle.leftArm, s2 * 0.55, w),
    rightArm: lerp(idle.rightArm, s * 0.55, w),
    leftFore: lerp(idle.leftFore, 0.2 + Math.max(0, s2) * 0.4, w),
    rightFore: lerp(idle.rightFore, 0.2 + Math.max(0, s) * 0.4, w),
    bob: idle.bob + Math.abs(s) * 0.048 * w,
    sway: c * 0.05 * w,
    lean: idle.lean + 0.07 * w,
    torsoYaw: c * 0.09 * w,
    headPitch: idle.headPitch - Math.abs(s) * 0.035 * w,
  };
}

/** Blend gait weight toward current speed so start/stop don't pop the limbs. */
export function stepGaitWeight(weight: number, speed: number, dt: number): number {
  const want = speed > 0.2 ? Math.min(1, (speed - 0.12) / 3.4) : 0;
  const lambda = want > weight ? 9 : 7;
  return expSmooth(weight, want, lambda, dt);
}

/** Inward zoom → closer chase; realm zoom → high wide view. */
export function camRig(zoom: number): { height: number; dist: number; lookY: number } {
  const z = clampZoom(zoom);
  const t = (z - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  return {
    height: 34 * (1 - t) + 3.6 * t,
    dist: 16 * (1 - t) + 4.0 * t,
    lookY: 1.15 + 6.5 * (1 - t),
  };
}

/** Cadence ~1.05 Hz at walk, a little faster when boosting. */
export function stepWalkPhase(phase: number, dt: number, speed: number): number {
  if (speed < 0.16) return phase + dt * 1.15;
  const cadence = 5.8 + speed * 0.95;
  return phase + dt * cadence;
}

export function spriteFramePeriod(speed: number): number {
  if (speed < 0.18) return 0.4;
  return Math.max(0.11, 0.3 / Math.max(0.45, speed / 4.8));
}

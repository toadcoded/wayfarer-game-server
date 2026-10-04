/** Grounded locomotion + zoom, adapted from Drive PHYSICS_ACTION_PASS (3D XZ). */

export const ZOOM_MIN = 0.48;
export const ZOOM_MAX = 2.35;
export const ZOOM_DEFAULT = 1;
export const ZOOM_REALM = 0.52;
export const ZOOM_CLOSE = 1.7;
export const BODY_R = 0.28;
export const GROUND_ACCEL = 20;
export const GROUND_BRAKE = 28;
export const WALK_SPEED = 3.05;
export const RUN_SPEED = 4.7;
export const RUN_MAX = 1;
export const RUN_DRAIN = 0.22;
export const RUN_REGEN = 0.32;
export const WALK_REGEN = 0.1;
export const HOP_DUR = 0.36;
export const HOP_PEAK = 0.42;
export const NPC_R = 0.3;

export type Body = { x: number; z: number; vx: number; vz: number };

export type CamRig = {
  dist: number;
  height: number;
  fov: number;
  lookY: number;
};

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(z) ? z : ZOOM_DEFAULT));
}

export function rigForZoom(zoom: number): CamRig {
  const z = clampZoom(zoom);
  if (z >= 1) {
    const t = (z - 1) / (ZOOM_MAX - 1);
    return {
      dist: 7.4 + (3.55 - 7.4) * t,
      height: 8.6 + (2.45 - 8.6) * t,
      fov: 46 + (54 - 46) * t,
      lookY: 0.7 + (1.18 - 0.7) * t,
    };
  }
  const t = (z - ZOOM_MIN) / (1 - ZOOM_MIN);
  return {
    dist: 6.2 + (7.4 - 6.2) * t,
    height: 44 + (8.6 - 44) * t,
    fov: 50 + (46 - 50) * t,
    lookY: 0.15 + (0.7 - 0.15) * t,
  };
}

export function blockedAt(
  walk: Uint8Array,
  tiles: number,
  x: number,
  z: number,
  r = BODY_R,
): boolean {
  const pts: Array<[number, number]> = [
    [x - r, z - r],
    [x + r, z - r],
    [x - r, z + r],
    [x + r, z + r],
  ];
  for (const [px, pz] of pts) {
    const tx = Math.floor(px);
    const tz = Math.floor(pz);
    if (tx < 0 || tz < 0 || tx >= tiles || tz >= tiles) return true;
    if (walk[tz * tiles + tx] !== 1) return true;
  }
  return false;
}

export function integrateBody(
  body: Body,
  ax: number,
  az: number,
  dt: number,
  walk: Uint8Array,
  tiles: number,
  maxSpeed: number,
): Body {
  let { x, z, vx, vz } = body;
  if (ax !== 0 || az !== 0) {
    const mag = Math.hypot(ax, az) || 1;
    const desiredX = (ax / mag) * maxSpeed;
    const desiredZ = (az / mag) * maxSpeed;
    const change = GROUND_ACCEL * dt;
    vx += Math.max(-change, Math.min(change, desiredX - vx));
    vz += Math.max(-change, Math.min(change, desiredZ - vz));
  } else {
    const sp = Math.hypot(vx, vz);
    if (sp > 0.0001) {
      const drop = Math.min(sp, GROUND_BRAKE * dt);
      vx -= (vx / sp) * drop;
      vz -= (vz / sp) * drop;
    } else {
      vx = 0;
      vz = 0;
    }
  }
  const sp = Math.hypot(vx, vz);
  if (sp > maxSpeed && sp > 0) {
    vx = (vx / sp) * maxSpeed;
    vz = (vz / sp) * maxSpeed;
  }
  const nx = x + vx * dt;
  if (!blockedAt(walk, tiles, nx, z)) x = nx;
  else vx = 0;
  const nz = z + vz * dt;
  if (!blockedAt(walk, tiles, x, nz)) z = nz;
  else vz = 0;
  x = Math.min(tiles - BODY_R, Math.max(BODY_R, x));
  z = Math.min(tiles - BODY_R, Math.max(BODY_R, z));
  return { x, z, vx, vz };
}

export function tickRun(energy: number, moving: boolean, running: boolean, dt: number): number {
  const next = running && moving ? energy - RUN_DRAIN * dt : moving ? energy + WALK_REGEN * dt : energy + RUN_REGEN * dt;
  return Math.min(RUN_MAX, Math.max(0, next));
}

export function speedCap(energy: number, running: boolean): number {
  const tired = running && energy < 0.08 ? 0.55 : running && energy < 0.28 ? 0.78 : 1;
  return (running ? RUN_SPEED : WALK_SPEED) * tired;
}

export function hopHeight(t: number, reduceMotion = false): number {
  if (reduceMotion || t <= 0 || t >= 1) return 0;
  return 4 * HOP_PEAK * t * (1 - t);
}

export function separateFrom(
  x: number,
  z: number,
  ox: number,
  oz: number,
  minDist: number,
): { x: number; z: number } {
  const dx = x - ox;
  const dz = z - oz;
  const d = Math.hypot(dx, dz);
  if (d >= minDist || d < 1e-5) return { x, z };
  const k = (minDist - d) / d;
  return { x: x + dx * k, z: z + dz * k };
}

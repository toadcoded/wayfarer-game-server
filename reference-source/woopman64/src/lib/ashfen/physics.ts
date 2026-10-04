import { COLS, ROWS, TILE, walkable } from "./world";

export const ZOOM_MIN = 0.48;
export const ZOOM_MAX = 2.35;
export const ZOOM_DEFAULT = 1;
export const ZOOM_REALM = 0.52;
export const ZOOM_CLOSE = 1.7;
export const BODY_R = 0.28;
/** Reach walk speed in ~0.24s — human start, not a snap. */
export const ACCEL = 20;
/** Coast to a stop in ~0.34s. */
export const FRICTION = 14;
export const BASE_SPEED = 4.8;
export const RUN_MAX = 100;
export const RUN_DRAIN = 14;
export const RUN_REGEN = 22;
export const PHYS_DT = 1 / 60;
export const WAYPOINT_REACH = 0.34;
export const ARRIVE_RADIUS = 1.12;

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(z) ? z : ZOOM_DEFAULT));
}

export type Body = { x: number; y: number; vx: number; vy: number };
export type PathPt = { x: number; y: number };

export function blockedAt(tiles: Uint8Array, x: number, y: number, r = BODY_R): boolean {
  const pts: Array<[number, number]> = [
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ];
  for (const [px, py] of pts) {
    if (!walkable(tiles, Math.floor(px), Math.floor(py))) return true;
  }
  return false;
}

/** Frame-rate-correct exponential smoothing. lambda ~ 6 camera, ~14 pose. */
export function expSmooth(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function wrapAngle(a: number): number {
  const t = a + Math.PI;
  return t - Math.PI * 2 * Math.floor(t / (Math.PI * 2)) - Math.PI;
}

/** Shortest-arc yaw slerp, capped at `rate` rad/s. */
export function approachAngle(current: number, target: number, rate: number, dt: number): number {
  let d = wrapAngle(target - current);
  const max = rate * dt;
  if (d > max) d = max;
  else if (d < -max) d = -max;
  return current + d;
}

export function integrateBody(
  body: Body,
  ax: number,
  ay: number,
  dt: number,
  tiles: Uint8Array,
  maxSpeed: number,
): Body {
  let { x, y, vx, vy } = body;
  if (ax !== 0 || ay !== 0) {
    const mag = Math.hypot(ax, ay) || 1;
    vx += (ax / mag) * ACCEL * dt;
    vy += (ay / mag) * ACCEL * dt;
  } else {
    const sp = Math.hypot(vx, vy);
    if (sp > 0.0001) {
      const drop = Math.min(sp, FRICTION * dt);
      vx -= (vx / sp) * drop;
      vy -= (vy / sp) * drop;
    } else {
      vx = 0;
      vy = 0;
    }
  }
  const sp = Math.hypot(vx, vy);
  if (sp > maxSpeed && sp > 0) {
    vx = (vx / sp) * maxSpeed;
    vy = (vy / sp) * maxSpeed;
  }
  const nx = x + vx * dt;
  if (!blockedAt(tiles, nx, y)) x = nx;
  else {
    vx = 0;
    // corner chamfer: if a half-step along X is free, take it (slide, don't stick)
    const hx = x + Math.sign(nx - x) * Math.min(Math.abs(nx - x), BODY_R * 0.35);
    if (hx !== x && !blockedAt(tiles, hx, y)) x = hx;
  }
  const ny = y + vy * dt;
  if (!blockedAt(tiles, x, ny)) y = ny;
  else {
    vy = 0;
    const hy = y + Math.sign(ny - y) * Math.min(Math.abs(ny - y), BODY_R * 0.35);
    if (hy !== y && !blockedAt(tiles, x, hy)) y = hy;
  }
  x = Math.min(COLS - BODY_R, Math.max(BODY_R, x));
  y = Math.min(ROWS - BODY_R, Math.max(BODY_R, y));
  return { x, y, vx, vy };
}

export function dirFromVel(
  vx: number,
  vy: number,
  fallback: "up" | "down" | "left" | "right",
): "up" | "down" | "left" | "right" {
  if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) return fallback;
  if (Math.abs(vx) >= Math.abs(vy)) return vx > 0 ? "right" : "left";
  return vy > 0 ? "down" : "up";
}

export function tickRun(energy: number, moving: boolean, dt: number): number {
  const next = moving ? energy - RUN_DRAIN * dt : energy + RUN_REGEN * dt;
  return Math.min(RUN_MAX, Math.max(0, next));
}

export function speedCap(walkSpeed: number, energy: number, boosting: boolean): number {
  const tired = energy < 8 ? 0.55 : energy < 28 ? 0.78 : 1;
  const boost = boosting ? 1.35 : 1;
  return BASE_SPEED * walkSpeed * tired * boost;
}

/** Slow to a stop inside ARRIVE_RADIUS of the last waypoint. */
export function arriveSpeed(dist: number, cap: number, last: boolean): number {
  if (!last) return cap;
  if (dist >= ARRIVE_RADIUS) return cap;
  return Math.max(0.55, cap * (dist / ARRIVE_RADIUS));
}

/**
 * Drive the body toward authored waypoints with the same accel/friction as WASD.
 * Cuts corners slightly so click-to-walk does not stairstep.
 */
export function followPath(
  body: Body,
  path: PathPt[],
  dt: number,
  tiles: Uint8Array,
  cap: number,
): { body: Body; path: PathPt[] } {
  if (!path.length) {
    return { body: integrateBody(body, 0, 0, dt, tiles, cap), path };
  }
  let nextPath = path;
  let target = nextPath[0]!;
  let tx = target.x + 0.5;
  let ty = target.y + 0.5;
  let dist = Math.hypot(tx - body.x, ty - body.y);

  while (nextPath.length > 1 && dist < WAYPOINT_REACH) {
    nextPath = nextPath.slice(1);
    target = nextPath[0]!;
    tx = target.x + 0.5;
    ty = target.y + 0.5;
    dist = Math.hypot(tx - body.x, ty - body.y);
  }

  const last = nextPath.length === 1;
  if (last && dist < 0.07) {
    const settled: Body = { x: tx, y: ty, vx: 0, vy: 0 };
    if (!blockedAt(tiles, tx, ty)) return { body: settled, path: [] };
  }

  if (!last && nextPath.length > 1 && dist < 0.58) {
    const look = nextPath[1]!;
    const t = 1 - dist / 0.58;
    tx = tx * (1 - t) + (look.x + 0.5) * t;
    ty = ty * (1 - t) + (look.y + 0.5) * t;
  }

  const capNow = arriveSpeed(dist, cap, last);
  const moved = integrateBody(body, tx - body.x, ty - body.y, dt, tiles, capNow);
  const nd = Math.hypot(tx - moved.x, ty - moved.y);
  if (last && nd < 0.1) {
    return { body: { ...moved, vx: moved.vx * 0.35, vy: moved.vy * 0.35 }, path: nd < 0.05 ? [] : nextPath };
  }
  if (!last && nd < WAYPOINT_REACH) return { body: moved, path: nextPath.slice(1) };
  return { body: moved, path: nextPath };
}

/** Single locomotion tick used by both 2D and 3D views. WASD cancels a click-path. */
export function stepLocomotion(
  body: Body,
  ax: number,
  ay: number,
  path: PathPt[],
  dt: number,
  tiles: Uint8Array,
  cap: number,
): { body: Body; path: PathPt[]; moving: boolean } {
  if (ax !== 0 || ay !== 0) {
    const next = integrateBody(body, ax, ay, dt, tiles, cap);
    return { body: next, path: [], moving: Math.hypot(next.vx, next.vy) > 0.12 };
  }
  if (path.length) {
    const followed = followPath(body, path, dt, tiles, cap);
    const sp = Math.hypot(followed.body.vx, followed.body.vy);
    return { body: followed.body, path: followed.path, moving: sp > 0.08 || followed.path.length > 0 };
  }
  const coast = integrateBody(body, 0, 0, dt, tiles, cap);
  return { body: coast, path: [], moving: Math.hypot(coast.vx, coast.vy) > 0.12 };
}

/** Zoom toward a screen pivot so the world point under the cursor stays put. */
export function zoomToward(
  zoom: number,
  nextZoom: number,
  camX: number,
  camY: number,
  pivotSx: number,
  pivotSy: number,
  tileSize = TILE,
): { zoom: number; camX: number; camY: number } {
  const z0 = clampZoom(zoom);
  const z1 = clampZoom(nextZoom);
  const s0 = tileSize * z0;
  const s1 = tileSize * z1;
  const worldX = (pivotSx + camX) / s0;
  const worldY = (pivotSy + camY) / s0;
  return { zoom: z1, camX: worldX * s1 - pivotSx, camY: worldY * s1 - pivotSy };
}

/** Keep the camera inside the map; center when the realm fits the viewport. */
export function clampCam(
  camX: number,
  camY: number,
  zoom: number,
  vw: number,
  vh: number,
  tileSize = TILE,
): { x: number; y: number } {
  const z = clampZoom(zoom);
  const worldW = COLS * tileSize * z;
  const worldH = ROWS * tileSize * z;
  const x = worldW <= vw ? (worldW - vw) / 2 : Math.max(0, Math.min(worldW - vw, camX));
  const y = worldH <= vh ? (worldH - vh) / 2 : Math.max(0, Math.min(worldH - vh, camY));
  return { x, y };
}

export function tilePx(zoom: number, tileSize = TILE): number {
  return tileSize * clampZoom(zoom);
}

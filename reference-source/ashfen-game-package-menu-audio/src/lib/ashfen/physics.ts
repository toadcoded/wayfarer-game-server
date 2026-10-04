import { COLS, ROWS, TILE, walkable } from "./world.ts";

export const ZOOM_MIN = 0.48;
export const ZOOM_MAX = 2.35;
export const ZOOM_DEFAULT = 1;
export const ZOOM_REALM = 0.52;
export const ZOOM_CLOSE = 1.7;
export const BODY_R = 0.28;
export const GROUND_ACCEL = 13;
export const GROUND_BRAKE = 11;
export const WALK_SPEED = 2.4;
export const RUN_SPEED = 3.8;
export const RUN_MAX = 100;
export const RUN_DRAIN = 8;
export const RUN_REGEN = 14;
export const WALK_REGEN = 4;

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(z) ? z : ZOOM_DEFAULT));
}

export type Body = { x: number; y: number; vx: number; vy: number };

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
    const desiredX = (ax / mag) * maxSpeed;
    const desiredY = (ay / mag) * maxSpeed;
    const change = GROUND_ACCEL * dt;
    vx += Math.max(-change, Math.min(change, desiredX - vx));
    vy += Math.max(-change, Math.min(change, desiredY - vy));
  } else {
    const sp = Math.hypot(vx, vy);
    if (sp > 0.0001) {
      const drop = Math.min(sp, GROUND_BRAKE * dt);
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
  else vx = 0;
  const ny = y + vy * dt;
  if (!blockedAt(tiles, x, ny)) y = ny;
  else vy = 0;
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

export function tickRun(energy: number, moving: boolean, running: boolean, dt: number): number {
  const next = running && moving ? energy - RUN_DRAIN * dt : moving ? energy + WALK_REGEN * dt : energy + RUN_REGEN * dt;
  return Math.min(RUN_MAX, Math.max(0, next));
}

export function speedCap(walkSpeed: number, energy: number, boosting: boolean, running = true): number {
  const tired = running && energy < 8 ? 0.55 : running && energy < 28 ? 0.78 : 1;
  const boost = boosting ? 1.35 : 1;
  return (running ? RUN_SPEED : WALK_SPEED) * walkSpeed * tired * boost;
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

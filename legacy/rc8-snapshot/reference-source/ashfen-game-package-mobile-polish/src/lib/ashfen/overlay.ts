import { COLS, TILE, walkable } from "./world";
import { neighbors4 } from "./path";
import type { Mireling } from "./game-store";
import type { ResourceNode } from "./world";

export function paintWalkOverlay(
  ctx: CanvasRenderingContext2D,
  tiles: Uint8Array,
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ox: number,
  oy: number,
  s = TILE,
) {
  const near = new Set(neighbors4(tiles, px, py).map((p) => p.y * COLS + p.x));
  const pad = Math.max(1, s * 0.09);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (!walkable(tiles, x, y)) continue;
      const sx = x * s - ox;
      const sy = y * s - oy;
      const hot = near.has(y * COLS + x) || (x === px && y === py);
      ctx.fillStyle = hot ? "rgba(80, 220, 230, 0.28)" : "rgba(80, 220, 230, 0.08)";
      ctx.fillRect(sx + pad, sy + pad, s - pad * 2, s - pad * 2);
      ctx.strokeStyle = hot ? "rgba(80, 220, 230, 0.85)" : "rgba(80, 220, 230, 0.25)";
      ctx.lineWidth = Math.max(1, s / 32);
      ctx.strokeRect(sx + pad + 0.5, sy + pad + 0.5, s - pad * 2 - 1, s - pad * 2 - 1);
    }
  }
}

export function paintRespawnOverlay(
  ctx: CanvasRenderingContext2D,
  nodes: ResourceNode[],
  mirelings: Mireling[],
  now: number,
  ox: number,
  oy: number,
  cooldown: (kind: ResourceNode["kind"]) => number,
  s = TILE,
) {
  const rOuter = s * 0.34;
  const rInner = s * 0.22;
  for (const n of nodes) {
    const sx = n.x * s - ox + s / 2;
    const sy = n.y * s - oy + s / 2;
    ctx.beginPath();
    ctx.arc(sx, sy, rOuter, 0, Math.PI * 2);
    if (n.ready) {
      ctx.strokeStyle = "rgba(180, 220, 120, 0.9)";
      ctx.lineWidth = Math.max(1.5, s / 16);
      ctx.stroke();
    } else {
      const left = Math.max(0, n.readyAt - now);
      const tot = cooldown(n.kind);
      ctx.strokeStyle = "rgba(220, 160, 70, 0.95)";
      ctx.lineWidth = Math.max(1.5, s / 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, rInner, -Math.PI / 2, -Math.PI / 2 + (1 - left / tot) * Math.PI * 2);
      ctx.strokeStyle = "rgba(232, 226, 212, 0.9)";
      ctx.stroke();
    }
  }
  for (const m of mirelings) {
    if (m.alive) continue;
    const sx = m.x * s - ox + s / 2;
    const sy = m.y * s - oy + s / 2;
    ctx.beginPath();
    ctx.arc(sx, sy, s * 0.31, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(176, 112, 112, 0.85)";
    ctx.lineWidth = Math.max(1.5, s / 16);
    ctx.stroke();
  }
}

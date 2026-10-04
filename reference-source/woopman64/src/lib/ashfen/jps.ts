import { COLS, ROWS, walkable } from "./world";
import type { Pt } from "./path";
import { astar } from "./path";

function key(x: number, y: number) {
  return y * COLS + x;
}

const CELLS = COLS * ROWS;

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function forced(tiles: Uint8Array, x: number, y: number, dx: number, dy: number): boolean {
  if (dx !== 0) {
    return (
      (!walkable(tiles, x, y - 1) && walkable(tiles, x + dx, y - 1)) ||
      (!walkable(tiles, x, y + 1) && walkable(tiles, x + dx, y + 1))
    );
  }
  return (
    (!walkable(tiles, x - 1, y) && walkable(tiles, x - 1, y + dy)) ||
    (!walkable(tiles, x + 1, y) && walkable(tiles, x + 1, y + dy))
  );
}

function jump(
  tiles: Uint8Array,
  x: number,
  y: number,
  dx: number,
  dy: number,
  gx: number,
  gy: number,
): Pt | null {
  const nx = x + dx;
  const ny = y + dy;
  if (!walkable(tiles, nx, ny)) return null;
  if (nx === gx && ny === gy) return { x: nx, y: ny };
  if (forced(tiles, nx, ny, dx, dy)) return { x: nx, y: ny };
  return jump(tiles, nx, ny, dx, dy, gx, gy);
}

function expand(jumpPoints: Pt[], start: Pt): Pt[] {
  const full: Pt[] = [];
  let cx = start.x;
  let cy = start.y;
  for (const pt of jumpPoints) {
    while (cx !== pt.x || cy !== pt.y) {
      if (cx !== pt.x) cx += Math.sign(pt.x - cx);
      else cy += Math.sign(pt.y - cy);
      full.push({ x: cx, y: cy });
    }
  }
  return full;
}

/** 4-connected Jump Point Search. Falls back to A* if the jump prune misses. */
export function jps(tiles: Uint8Array, sx: number, sy: number, gx: number, gy: number): Pt[] {
  if (!walkable(tiles, gx, gy)) return [];
  if (sx === gx && sy === gy) return [{ x: gx, y: gy }];

  const open: number[] = [];
  const came = new Int32Array(CELLS).fill(-1);
  const gScore = new Float32Array(CELLS).fill(Infinity);
  const inOpen = new Uint8Array(CELLS);
  const start = key(sx, sy);
  const goal = key(gx, gy);
  gScore[start] = 0;
  open.push(start);
  inOpen[start] = 1;

  const popBest = () => {
    let best = 0;
    let bestF = Infinity;
    for (let i = 0; i < open.length; i++) {
      const n = open[i]!;
      const x = n % COLS;
      const y = (n / COLS) | 0;
      const f = gScore[n]! + Math.abs(x - gx) + Math.abs(y - gy);
      if (f < bestF) {
        bestF = f;
        best = i;
      }
    }
    const cur = open[best]!;
    open.splice(best, 1);
    inOpen[cur] = 0;
    return cur;
  };

  while (open.length) {
    const cur = popBest();
    if (cur === goal) {
      const path: Pt[] = [];
      let n = cur;
      while (n !== start && n !== -1) {
        path.push({ x: n % COLS, y: (n / COLS) | 0 });
        n = came[n]!;
      }
      path.reverse();
      return path;
    }
    const cx = cur % COLS;
    const cy = (cur / COLS) | 0;
    for (const [dx, dy] of DIRS) {
      const jp = jump(tiles, cx, cy, dx, dy, gx, gy);
      if (!jp) continue;
      const nk = key(jp.x, jp.y);
      const step = Math.abs(jp.x - cx) + Math.abs(jp.y - cy);
      const ng = gScore[cur]! + step;
      if (ng >= gScore[nk]!) continue;
      came[nk] = cur;
      gScore[nk] = ng;
      if (!inOpen[nk]) {
        open.push(nk);
        inOpen[nk] = 1;
      }
    }
  }
  return astar(tiles, sx, sy, gx, gy);
}

export function route(tiles: Uint8Array, sx: number, sy: number, gx: number, gy: number): Pt[] {
  const jumped = jps(tiles, sx, sy, gx, gy);
  if (!jumped.length) return astar(tiles, sx, sy, gx, gy);
  return expand(jumped, { x: sx, y: sy });
}

import { COLS, ROWS, walkable } from "./world.ts";

export type Pt = { x: number; y: number };

function key(x: number, y: number) {
  return y * COLS + x;
}

export function astar(tiles: Uint8Array, sx: number, sy: number, gx: number, gy: number): Pt[] {
  if (!walkable(tiles, gx, gy)) return [];
  if (sx === gx && sy === gy) return [{ x: gx, y: gy }];

  const open: number[] = [];
  const came = new Int32Array(COLS * ROWS).fill(-1);
  const gScore = new Float32Array(COLS * ROWS).fill(Infinity);
  const inOpen = new Uint8Array(COLS * ROWS);
  const start = key(sx, sy);
  const goal = key(gx, gy);
  gScore[start] = 0;
  open.push(start);
  inOpen[start] = 1;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  while (open.length) {
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
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!walkable(tiles, nx, ny)) continue;
      const nk = key(nx, ny);
      const ng = gScore[cur]! + 1;
      if (ng >= gScore[nk]!) continue;
      came[nk] = cur;
      gScore[nk] = ng;
      if (!inOpen[nk]) {
        open.push(nk);
        inOpen[nk] = 1;
      }
    }
  }
  return [];
}

export function neighbors4(tiles: Uint8Array, x: number, y: number): Pt[] {
  const out: Pt[] = [];
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const nx = x + dx;
    const ny = y + dy;
    if (walkable(tiles, nx, ny)) out.push({ x: nx, y: ny });
  }
  return out;
}

/**
 * Tile collision + routing whose flag numbers match RuneLite CollisionDataFlag.
 * This is RuneLite-inspired, not an implementation of WorldArea or OSRS server
 * pathfinding. Movement execution stays frame-driven; these helpers decide
 * which tiles may be entered.
 */

export const GAME_TICK_MS = 600;
export const CLIENT_TICK_MS = 20;

export const CollisionFlag = {
  NW: 0x1,
  N: 0x2,
  NE: 0x4,
  E: 0x8,
  SE: 0x10,
  S: 0x20,
  SW: 0x40,
  W: 0x80,
  OBJECT: 0x100,
  FLOOR_DECORATION: 0x40000,
  FLOOR: 0x200000,
} as const;

export const FULL_BLOCK =
  CollisionFlag.OBJECT | CollisionFlag.FLOOR_DECORATION | CollisionFlag.FLOOR;

export type Grid = {
  width: number;
  height: number;
  flags: Uint32Array;
};

export function idx(g: Grid, x: number, y: number) {
  return y * g.width + x;
}

export function inBounds(g: Grid, x: number, y: number) {
  return x >= 0 && y >= 0 && x < g.width && y < g.height;
}

export function blocked(g: Grid, x: number, y: number) {
  if (!inBounds(g, x, y)) return true;
  return (g.flags[idx(g, x, y)] & FULL_BLOCK) !== 0;
}

export function flagsAt(g: Grid, x: number, y: number) {
  if (!inBounds(g, x, y)) return FULL_BLOCK;
  return g.flags[idx(g, x, y)];
}

/** 1×1 occupancy travel check. (0,0) is a no-op and returns true. */
export function canTravel(g: Grid, x: number, y: number, dx: number, dy: number) {
  if (dx === 0 && dy === 0) return true;
  if (dx < -1 || dx > 1 || dy < -1 || dy > 1) return false;
  const nx = x + dx;
  const ny = y + dy;
  if (blocked(g, nx, ny)) return false;
  if (dx !== 0 && dy !== 0) {
    if (blocked(g, x + dx, y) || blocked(g, x, y + dy)) return false;
  }
  return true;
}

export type OpenNode = {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  i: number;
  seq: number;
};

/** Lowest f, then lowest h, then earliest insertion. */
export function heapLess(a: OpenNode, b: OpenNode) {
  if (a.f !== b.f) return a.f < b.f;
  if (a.h !== b.h) return a.h < b.h;
  return a.seq < b.seq;
}

export class BinaryMinHeap<T> {
  a: T[] = [];
  less: (a: T, b: T) => boolean;
  constructor(less: (a: T, b: T) => boolean) {
    this.less = less;
  }
  get length() {
    return this.a.length;
  }
  push(n: T) {
    this.a.push(n);
    this.up(this.a.length - 1);
  }
  pop(): T | undefined {
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      this.down(0);
    }
    return top;
  }
  private up(i: number) {
    const a = this.a;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  private down(i: number) {
    const a = this.a;
    for (;;) {
      let m = i;
      const l = i * 2 + 1;
      const r = l + 1;
      if (l < a.length && this.less(a[l], a[m])) m = l;
      if (r < a.length && this.less(a[r], a[m])) m = r;
      if (m === i) break;
      [a[m], a[i]] = [a[i], a[m]];
      i = m;
    }
  }
}

export function octile(dx: number, dy: number) {
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  return 10 * Math.max(adx, ady) + 4 * Math.min(adx, ady);
}

export type Point = { x: number; y: number };

const DIRS: [number, number, number][] = [
  [1, 0, 10],
  [-1, 0, 10],
  [0, 1, 10],
  [0, -1, 10],
  [1, 1, 14],
  [1, -1, 14],
  [-1, 1, 14],
  [-1, -1, 14],
];

function reconstruct(parent: Int32Array, bestIdx: number, sIdx: number, width: number, sx: number, sy: number): Point[] {
  const path: Point[] = [];
  let i = bestIdx;
  while (i >= 0) {
    path.push({ x: i % width, y: (i / width) | 0 });
    if (i === sIdx) break;
    i = parent[i];
  }
  path.reverse();
  if (path.length && path[0].x === sx && path[0].y === sy) path.shift();
  return path;
}

/**
 * A* over the collision grid. Cardinal cost 10, diagonal 14.
 * Open set is a binary min-heap with lazy (stale-entry) deletion.
 * If the goal is unreachable, returns the closest explored approach.
 */
export function findPath(g: Grid, start: Point, goal: Point, maxVisited = 9216): Point[] {
  const sx = start.x | 0;
  const sy = start.y | 0;
  const gx = goal.x | 0;
  const gy = goal.y | 0;
  if (!inBounds(g, sx, sy)) return [];
  if (sx === gx && sy === gy) return [{ x: gx, y: gy }];

  const size = g.width * g.height;
  const bestG = new Int32Array(size).fill(-1);
  const parent = new Int32Array(size).fill(-1);
  const open = new BinaryMinHeap<OpenNode>(heapLess);
  const sIdx = sy * g.width + sx;
  const sH = octile(gx - sx, gy - sy);
  let seq = 0;
  bestG[sIdx] = 0;
  open.push({ x: sx, y: sy, g: 0, h: sH, f: sH, i: sIdx, seq: seq++ });

  let visited = 0;
  let bestIdx = sIdx;
  let bestH = sH;

  while (open.length && visited < maxVisited) {
    const cur = open.pop()!;
    if (cur.g !== bestG[cur.i]) continue; // stale heap entry
    visited++;
    if (cur.h < bestH) {
      bestH = cur.h;
      bestIdx = cur.i;
    }
    if (cur.x === gx && cur.y === gy) {
      bestIdx = cur.i;
      break;
    }
    for (const [dx, dy, c] of DIRS) {
      if (!canTravel(g, cur.x, cur.y, dx, dy)) continue;
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const ni = ny * g.width + nx;
      const ng = cur.g + c;
      if (bestG[ni] !== -1 && bestG[ni] <= ng) continue;
      bestG[ni] = ng;
      parent[ni] = cur.i;
      const h = octile(gx - nx, gy - ny);
      open.push({ x: nx, y: ny, g: ng, h, f: ng + h, i: ni, seq: seq++ });
    }
  }

  return reconstruct(parent, bestIdx, sIdx, g.width, sx, sy);
}

/** Linear-scan open set. Kept as the equivalence reference for the heap frontier. */
export function findPathLinear(g: Grid, start: Point, goal: Point, maxVisited = 9216): Point[] {
  const sx = start.x | 0;
  const sy = start.y | 0;
  const gx = goal.x | 0;
  const gy = goal.y | 0;
  if (!inBounds(g, sx, sy)) return [];
  if (sx === gx && sy === gy) return [{ x: gx, y: gy }];

  const size = g.width * g.height;
  const bestG = new Int32Array(size).fill(-1);
  const parent = new Int32Array(size).fill(-1);
  type Lin = { x: number; y: number; g: number; f: number; i: number };
  const open: Lin[] = [];
  const sIdx = sy * g.width + sx;
  bestG[sIdx] = 0;
  open.push({ x: sx, y: sy, g: 0, f: octile(gx - sx, gy - sy), i: sIdx });

  let visited = 0;
  let bestIdx = sIdx;
  let bestH = octile(gx - sx, gy - sy);

  while (open.length && visited < maxVisited) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.g !== bestG[cur.i]) continue;
    visited++;
    const h = octile(gx - cur.x, gy - cur.y);
    if (h < bestH) {
      bestH = h;
      bestIdx = cur.i;
    }
    if (cur.x === gx && cur.y === gy) {
      bestIdx = cur.i;
      break;
    }
    for (const [dx, dy, c] of DIRS) {
      if (!canTravel(g, cur.x, cur.y, dx, dy)) continue;
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const ni = ny * g.width + nx;
      const ng = cur.g + c;
      if (bestG[ni] !== -1 && bestG[ni] <= ng) continue;
      bestG[ni] = ng;
      parent[ni] = cur.i;
      open.push({ x: nx, y: ny, g: ng, f: ng + octile(gx - nx, gy - ny), i: ni });
    }
  }

  return reconstruct(parent, bestIdx, sIdx, g.width, sx, sy);
}

export function pathCost(path: Point[], start: Point) {
  let cost = 0;
  let px = start.x;
  let py = start.y;
  for (const p of path) {
    const dx = Math.abs(p.x - px);
    const dy = Math.abs(p.y - py);
    if (dx === 0 && dy === 0) continue;
    cost += dx !== 0 && dy !== 0 ? 14 : 10 * (dx + dy);
    px = p.x;
    py = p.y;
  }
  return cost;
}

export function pathValid(g: Grid, path: Point[], start: Point) {
  let x = start.x;
  let y = start.y;
  for (const p of path) {
    const dx = p.x - x;
    const dy = p.y - y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;
    if (!canTravel(g, x, y, dx, dy)) return false;
    x = p.x;
    y = p.y;
  }
  return true;
}

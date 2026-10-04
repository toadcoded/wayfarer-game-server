export const TILES = 48;
export const WATER = 0.34;
export const RIVER_Z = 12;
export const SPAWN = { x: 24.5, z: 24.5 };

export type Biome = "water" | "path" | "meadow" | "forest" | "sand" | "rock";

export type LandmarkId = "west" | "east" | "south" | "north";

export type Landmark = {
  id: LandmarkId;
  name: string;
  tx: number;
  tz: number;
  line: string;
};

export type Prop = {
  x: number;
  z: number;
  tx: number;
  tz: number;
  kind: "pine" | "oak" | "rock" | "bloom";
};

export type Pickup = {
  id: string;
  x: number;
  z: number;
  kind: "leaf" | "driftwood";
  taken: boolean;
};

export const LANDMARKS: Landmark[] = [
  { id: "west", name: "Western Shore", tx: 6, tz: 24, line: "The west shore keeps the old queue." },
  { id: "east", name: "Eastern Rise", tx: 42, tz: 24, line: "The rise looks over working reports." },
  { id: "south", name: "Southern Gate", tx: 24, tz: 41, line: "The gate is a desk, not a dungeon." },
  { id: "north", name: "North Bridge", tx: 24, tz: RIVER_Z, line: "The river talks underfoot. Cross on the deck." },
];

export type PapyrusWorld = {
  heights: Float32Array;
  biomes: Biome[];
  walk: Uint8Array;
  props: Prop[];
  pickups: Pickup[];
  landmarks: Landmark[];
};

export function tileCenter(t: number): number {
  return t + 0.5;
}

export function worldToTile(x: number, z: number): { tx: number; tz: number } {
  return { tx: Math.floor(x), tz: Math.floor(z) };
}

export function inBounds(tx: number, tz: number): boolean {
  return tx >= 0 && tz >= 0 && tx < TILES && tz < TILES;
}

export function idx(tx: number, tz: number): number {
  return tz * TILES + tx;
}

function hash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, z: number): number {
  return (
    valueNoise(x, z) * 0.55 +
    valueNoise(x * 2.1, z * 2.1) * 0.3 +
    valueNoise(x * 4.3, z * 4.3) * 0.15
  );
}

function lineTiles(ax: number, az: number, bx: number, bz: number): { tx: number; tz: number }[] {
  const out: { tx: number; tz: number }[] = [];
  let x = ax;
  let z = az;
  const dx = Math.abs(bx - ax);
  const dz = Math.abs(bz - az);
  const sx = ax < bx ? 1 : -1;
  const sz = az < bz ? 1 : -1;
  let err = dx - dz;
  for (;;) {
    out.push({ tx: x, tz: z });
    if (x === bx && z === bz) break;
    const e2 = 2 * err;
    if (e2 > -dz) {
      err -= dz;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      z += sz;
    }
  }
  return out;
}

export function buildWorld(seed = 2730): PapyrusWorld {
  const heights = new Float32Array(TILES * TILES);
  const biomes: Biome[] = new Array(TILES * TILES);
  const walk = new Uint8Array(TILES * TILES);
  const path = new Uint8Array(TILES * TILES);
  const bridge = new Uint8Array(TILES * TILES);

  const spawnTx = Math.floor(SPAWN.x);
  const spawnTz = Math.floor(SPAWN.z);
  for (const mark of LANDMARKS) {
    for (const cell of lineTiles(spawnTx, spawnTz, mark.tx, mark.tz)) {
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = cell.tx === mark.tx || cell.tz === mark.tz ? -1 : 0; oz <= (cell.tx === mark.tx || cell.tz === mark.tz ? 1 : 0); oz++) {
          const tx = cell.tx + ox;
          const tz = cell.tz + oz;
          if (inBounds(tx, tz)) path[idx(tx, tz)] = 1;
        }
      }
    }
  }

  for (let tz = RIVER_Z - 1; tz <= RIVER_Z + 1; tz++) {
    for (let tx = 23; tx <= 25; tx++) {
      if (inBounds(tx, tz)) bridge[idx(tx, tz)] = 1;
    }
  }

  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tz++) {
      const i = idx(tx, tz);
      const nx = (tx + seed * 0.001) / 11;
      const nz = (tz + seed * 0.002) / 11;
      let h = 0.42 + (fbm(nx, nz) - 0.5) * 0.5;
      const river = Math.exp(-((tz - RIVER_Z) * (tz - RIVER_Z)) / 5.5);
      h -= river * 0.38;
      const lake = Math.exp(-((tx - 8) * (tx - 8) + (tz - 32) * (tz - 32)) / 28);
      h -= lake * 0.22;
      if (bridge[i]) h = Math.max(h, 0.46);
      if (path[i] && !bridge[i]) h = Math.max(h, 0.4);
      heights[i] = h;

      let biome: Biome = "meadow";
      if (h < WATER && !bridge[i]) biome = "water";
      else if (path[i] || bridge[i]) biome = "path";
      else if (h > 0.62) biome = "rock";
      else if (h < 0.4) biome = "sand";
      else if (fbm(nx * 1.7 + 9, nz * 1.7) > 0.58) biome = "forest";
      biomes[i] = biome;
      walk[i] = biome === "water" ? 0 : 1;
    }
  }

  const props: Prop[] = [];
  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const i = idx(tx, tz);
      if (!walk[i] || biomes[i] === "path") continue;
      const r = hash(tx + 17, tz + seed);
      if (biomes[i] === "forest" && r > 0.45) {
        const kind = hash(tx, tz + 3) > 0.5 ? "pine" : "oak";
        props.push({ x: tileCenter(tx), z: tileCenter(tz), tx, tz, kind });
        if (r > 0.78) walk[i] = 0;
      } else if (biomes[i] === "rock" && r > 0.7) {
        props.push({ x: tileCenter(tx), z: tileCenter(tz), tx, tz, kind: "rock" });
        walk[i] = 0;
      } else if (biomes[i] === "meadow" && r > 0.88) {
        props.push({ x: tileCenter(tx) + (hash(tx, 1) - 0.5) * 0.3, z: tileCenter(tz), tx, tz, kind: "bloom" });
      }
    }
  }

  const pickups: Pickup[] = [];
  let n = 0;
  for (let tz = 2; tz < TILES - 2 && pickups.length < 14; tz++) {
    for (let tx = 2; tx < TILES - 2 && pickups.length < 14; tx++) {
      const i = idx(tx, tz);
      if (!walk[i] || biomes[i] === "water") continue;
      if (Math.abs(tx - spawnTx) + Math.abs(tz - spawnTz) < 3) continue;
      const r = hash(tx * 3, tz * 5 + seed);
      if (r > 0.965) {
        pickups.push({
          id: `p${n++}`,
          x: tileCenter(tx),
          z: tileCenter(tz),
          kind: pickups.length % 3 === 0 ? "driftwood" : "leaf",
          taken: false,
        });
      }
    }
  }

  if (import.meta.env.DEV) {
    for (let t = 0; t < TILES; t++) {
      const c = tileCenter(t);
      const got = worldToTile(c, c);
      if (got.tx !== t || got.tz !== t) {
        throw new Error(`tile inverse broke at ${t} → ${got.tx},${got.tz}`);
      }
    }
  }

  return { heights, biomes, walk, props, pickups, landmarks: LANDMARKS };
}

export function sampleBiome(world: PapyrusWorld, x: number, z: number): Biome {
  const { tx, tz } = worldToTile(x, z);
  if (!inBounds(tx, tz)) return "water";
  return world.biomes[idx(tx, tz)]!;
}

export function canWalk(world: PapyrusWorld, x: number, z: number): boolean {
  const { tx, tz } = worldToTile(x, z);
  if (!inBounds(tx, tz)) return false;
  return world.walk[idx(tx, tz)] === 1;
}

export function heightAt(world: PapyrusWorld, x: number, z: number): number {
  const { tx, tz } = worldToTile(x, z);
  if (!inBounds(tx, tz)) return 0;
  return world.heights[idx(tx, tz)]!;
}

type Node = { i: number; g: number; f: number; from: number };

export function findPath(
  world: PapyrusWorld,
  sx: number,
  sz: number,
  gx: number,
  gz: number,
): { x: number; z: number }[] {
  const start = worldToTile(sx, sz);
  const goal = worldToTile(gx, gz);
  if (!inBounds(start.tx, start.tz) || !inBounds(goal.tx, goal.tz)) return [];
  const s = idx(start.tx, start.tz);
  const t = idx(goal.tx, goal.tz);
  if (world.walk[s] !== 1) return [];
  const open: Node[] = [{ i: s, g: 0, f: heur(start.tx, start.tz, goal.tx, goal.tz), from: -1 }];
  const best = new Float32Array(TILES * TILES);
  best.fill(1e9);
  best[s] = 0;
  const came = new Int32Array(TILES * TILES);
  came.fill(-1);
  const closed = new Uint8Array(TILES * TILES);
  const dirs = [
    [1, 0, 10],
    [-1, 0, 10],
    [0, 1, 10],
    [0, -1, 10],
    [1, 1, 14],
    [1, -1, 14],
    [-1, 1, 14],
    [-1, -1, 14],
  ] as const;
  let guard = 0;
  let nearest = s;
  let nearestH = heur(start.tx, start.tz, goal.tx, goal.tz);
  while (open.length && guard++ < 2800) {
    let pick = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.f < open[pick]!.f) pick = i;
    const cur = open.splice(pick, 1)[0]!;
    if (closed[cur.i]) continue;
    closed[cur.i] = 1;
    const cx = cur.i % TILES;
    const cz = (cur.i / TILES) | 0;
    const h = heur(cx, cz, goal.tx, goal.tz);
    if (h < nearestH) {
      nearestH = h;
      nearest = cur.i;
    }
    if (cur.i === t) {
      nearest = t;
      break;
    }
    for (const [dx, dz, cost] of dirs) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (!inBounds(nx, nz)) continue;
      const ni = idx(nx, nz);
      if (world.walk[ni] !== 1 || closed[ni]) continue;
      if (dx !== 0 && dz !== 0) {
        if (world.walk[idx(cx + dx, cz)] !== 1 || world.walk[idx(cx, cz + dz)] !== 1) continue;
      }
      const g = cur.g + cost;
      if (g >= best[ni]!) continue;
      best[ni] = g;
      came[ni] = cur.i;
      open.push({ i: ni, g, f: g + heur(nx, nz, goal.tx, goal.tz), from: cur.i });
    }
  }
  const path: { x: number; z: number }[] = [];
  let at = world.walk[t] === 1 && came[t] !== -1 ? t : nearest;
  const seen = new Set<number>();
  while (at >= 0 && !seen.has(at)) {
    seen.add(at);
    path.push({ x: tileCenter(at % TILES), z: tileCenter((at / TILES) | 0) });
    at = came[at]!;
  }
  path.reverse();
  return path;
}

function heur(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return 10 * Math.max(dx, dz) + 4 * Math.min(dx, dz);
}

export function landmarkAt(x: number, z: number): Landmark | null {
  for (const m of LANDMARKS) {
    const dx = x - tileCenter(m.tx);
    const dz = z - tileCenter(m.tz);
    if (dx * dx + dz * dz < 1.7 * 1.7) return m;
  }
  return null;
}

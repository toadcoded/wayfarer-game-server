export const TILES = 72;
export const WATER = 0.34;
export const RIVER_Z = 22;
export const SPAWN = { x: 36.5, z: 40.5 };
export const Y_SCALE = 7.2;

const CELLS = TILES * TILES;

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

export type BuildingKind =
  | "hall"
  | "forge"
  | "gate"
  | "dock"
  | "tower"
  | "cottage"
  | "chapel"
  | "stall"
  | "well"
  | "bridge";

export type Building = {
  id: string;
  name: string;
  kind: BuildingKind;
  tx: number;
  tz: number;
  w: number;
  d: number;
  h: number;
  yaw: number;
  doorTx: number;
  doorTz: number;
};

export type Npc = {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  homeX: number;
  homeZ: number;
  destX: number;
  destZ: number;
  yaw: number;
  line: string;
  wander: boolean;
  wait: number;
  cloak: number;
};

export const LANDMARKS: Landmark[] = [
  { id: "west", name: "Western Shore", tx: 8, tz: 40, line: "Moss keeps the old queue at the dock." },
  { id: "east", name: "Eastern Rise", tx: 64, tz: 40, line: "Vale's tower looks over working reports." },
  { id: "south", name: "Southern Gate", tx: 36, tz: 65, line: "Bramble's gate is a desk, not a dungeon." },
  { id: "north", name: "North Bridge", tx: 36, tz: RIVER_Z, line: "The river talks underfoot. Cross on the deck." },
];

export const BUILDINGS: Building[] = [
  { id: "hall", name: "Lexicon Hall", kind: "hall", tx: 32, tz: 35, w: 5, d: 4, h: 4.2, yaw: 0, doorTx: 34, doorTz: 39 },
  { id: "forge", name: "Packet Forge", kind: "forge", tx: 38, tz: 36, w: 3, d: 3, h: 3.1, yaw: 0, doorTx: 39, doorTz: 39 },
  { id: "chapel", name: "Rite Chapel", kind: "chapel", tx: 31, tz: 42, w: 3, d: 4, h: 5.0, yaw: Math.PI, doorTx: 32, doorTz: 41 },
  { id: "cot-a", name: "Scribe Cottage", kind: "cottage", tx: 40, tz: 42, w: 3, d: 3, h: 2.2, yaw: Math.PI, doorTx: 41, doorTz: 41 },
  { id: "cot-b", name: "Lamp Cottage", kind: "cottage", tx: 29, tz: 39, w: 3, d: 3, h: 2.1, yaw: Math.PI / 2, doorTx: 32, doorTz: 40 },
  { id: "cot-c", name: "Trail Cottage", kind: "cottage", tx: 42, tz: 37, w: 2, d: 2, h: 2.0, yaw: 0, doorTx: 42, doorTz: 39 },
  { id: "stall", name: "Leaf Stall", kind: "stall", tx: 36, tz: 38, w: 2, d: 2, h: 1.8, yaw: 0, doorTx: 36, doorTz: 39 },
  { id: "well", name: "Crossroads Well", kind: "well", tx: 35, tz: 41, w: 1, d: 1, h: 1.1, yaw: 0, doorTx: 35, doorTz: 42 },
  { id: "gate", name: "Southern Gate", kind: "gate", tx: 34, tz: 62, w: 5, d: 3, h: 4.8, yaw: 0, doorTx: 36, doorTz: 61 },
  { id: "dock", name: "Queue Dock", kind: "dock", tx: 4, tz: 38, w: 6, d: 4, h: 1.6, yaw: -Math.PI / 2, doorTx: 10, doorTz: 40 },
  { id: "tower", name: "Rise Observatory", kind: "tower", tx: 62, tz: 38, w: 3, d: 3, h: 7.2, yaw: Math.PI / 2, doorTx: 61, doorTz: 39 },
  { id: "bridge", name: "North Deck", kind: "bridge", tx: 35, tz: 21, w: 3, d: 3, h: 1.2, yaw: 0, doorTx: 36, doorTz: 24 },
  { id: "cot-d", name: "South Cottage", kind: "cottage", tx: 39, tz: 46, w: 3, d: 3, h: 2.3, yaw: Math.PI, doorTx: 40, doorTz: 45 },
  { id: "cot-e", name: "Path Cottage", kind: "cottage", tx: 32, tz: 49, w: 3, d: 3, h: 2.2, yaw: 0, doorTx: 33, doorTz: 52 },
  { id: "cot-f", name: "Gate Cottage", kind: "cottage", tx: 40, tz: 58, w: 3, d: 3, h: 2.4, yaw: Math.PI, doorTx: 41, doorTz: 57 },
];

const NPC_SEED: Omit<Npc, "destX" | "destZ" | "wait" | "yaw">[] = [
  { id: "wren", name: "Wren", role: "Adept", x: 37.2, z: 41.4, homeX: 37.2, homeZ: 41.4, line: "Four trails leave the hall. Walk them.", wander: true, cloak: 0x7d9b84 },
  { id: "quill", name: "Quill", role: "Archivist", x: 34.5, z: 39.6, homeX: 34.5, homeZ: 39.6, line: "The Living Book has leaves. Turn them, don't drown.", wander: false, cloak: 0x8a6a72 },
  { id: "ember", name: "Ember", role: "Smith", x: 39.5, z: 39.6, homeX: 39.5, homeZ: 39.6, line: "Packets are ore. Heat them into a rite.", wander: false, cloak: 0xb89a62 },
  { id: "vale", name: "Vale", role: "Cartographer", x: 61.2, z: 39.5, homeX: 61.2, homeZ: 39.5, line: "The rise looks over working reports.", wander: true, cloak: 0x5a7a88 },
  { id: "moss", name: "Moss", role: "Ferryman", x: 10.4, z: 40.2, homeX: 10.4, homeZ: 40.2, line: "The west shore keeps the old queue.", wander: true, cloak: 0x4a6a70 },
  { id: "bramble", name: "Bramble", role: "Warden", x: 36.5, z: 61.2, homeX: 36.5, homeZ: 61.2, line: "The gate is a desk, not a dungeon.", wander: false, cloak: 0x5a4638 },
  { id: "reed", name: "Reed", role: "Wayfarer", x: 36.5, z: 48.5, homeX: 36.5, homeZ: 48.5, line: "I walk so the isle remembers the trails.", wander: true, cloak: 0x6a7b5c },
  { id: "ink", name: "Ink", role: "Scholar", x: 32.8, z: 41.2, homeX: 32.8, homeZ: 41.2, line: "Numbered leaves beat a paste dump.", wander: true, cloak: 0x3d4a38 },
  { id: "lumen", name: "Lumen", role: "Lamp-keeper", x: 35.2, z: 40.8, homeX: 35.2, homeZ: 40.8, line: "Night is a fog. Keep the lamps honest.", wander: true, cloak: 0xc4b48a },
  { id: "pebble", name: "Pebble", role: "Scribe", x: 41.4, z: 41.3, homeX: 41.4, homeZ: 41.3, line: "I copy Drive shelves into the book. Data, not code.", wander: true, cloak: 0x9a9b93 },
];

export type PapyrusWorld = {
  heights: Float32Array;
  biomes: Biome[];
  walk: Uint8Array;
  props: Prop[];
  pickups: Pickup[];
  landmarks: Landmark[];
  buildings: Building[];
  npcs: Npc[];
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

export function groundY(h: number): number {
  return (h - WATER) * Y_SCALE;
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
  ax = ax | 0;
  az = az | 0;
  bx = bx | 0;
  bz = bz | 0;
  const dx = bx - ax;
  const dz = bz - az;
  const steps = Math.max(Math.abs(dx), Math.abs(dz), 1);
  const out: { tx: number; tz: number }[] = new Array(steps + 1);
  for (let i = 0; i <= steps; i++) {
    out[i] = {
      tx: ax + Math.round((dx * i) / steps),
      tz: az + Math.round((dz * i) / steps),
    };
  }
  if (ax === bx && az === bz) return [{ tx: ax, tz: az }];
  return out;
}

function stampPath(path: Uint8Array, tx0: number, tz0: number, tx1: number, tz1: number) {
  const x0 = Math.min(tx0, tx1);
  const x1 = Math.max(tx0, tx1);
  const z0 = Math.min(tz0, tz1);
  const z1 = Math.max(tz0, tz1);
  for (let tz = z0; tz <= z1; tz++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (inBounds(tx, tz)) path[idx(tx, tz)] = 1;
    }
  }
}

export function buildWorld(seed = 2730): PapyrusWorld {
  const heights = new Float32Array(CELLS);
  const biomes: Biome[] = new Array(CELLS);
  const walk = new Uint8Array(CELLS);
  const path = new Uint8Array(CELLS);
  const bridge = new Uint8Array(CELLS);

  const spawnTx = Math.floor(SPAWN.x);
  const spawnTz = Math.floor(SPAWN.z);
  for (const mark of LANDMARKS) {
    const cells = lineTiles(spawnTx, spawnTz, mark.tx, mark.tz);
    for (const cell of cells) {
      const wide = cell.tx === mark.tx || cell.tz === mark.tz;
      const oz0 = wide ? -1 : 0;
      const oz1 = wide ? 1 : 0;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = oz0; oz <= oz1; oz++) {
          const tx = cell.tx + ox;
          const tz = cell.tz + oz;
          if (inBounds(tx, tz)) path[idx(tx, tz)] = 1;
        }
      }
    }
  }

  stampPath(path, 31, 38, 42, 43);
  stampPath(path, 34, 39, 38, 62);

  for (let tz = RIVER_Z - 1; tz <= RIVER_Z + 1; tz++) {
    for (let tx = 35; tx <= 37; tx++) {
      if (inBounds(tx, tz)) bridge[idx(tx, tz)] = 1;
    }
  }

  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const i = idx(tx, tz);
      const nx = (tx + seed * 0.001) / 14;
      const nz = (tz + seed * 0.002) / 14;
      let h = 0.44 + (fbm(nx, nz) - 0.5) * 0.52;
      const river = Math.exp(-((tz - RIVER_Z) * (tz - RIVER_Z)) / 6.2);
      h -= river * 0.4;
      const lake = Math.exp(-((tx - 14) * (tx - 14) + (tz - 54) * (tz - 54)) / 38);
      h -= lake * 0.24;
      const rise = Math.exp(-((tx - 64) * (tx - 64) + (tz - 38) * (tz - 38)) / 48);
      h += rise * 0.16;
      if (bridge[i]) h = Math.max(h, 0.48);
      if (path[i] && !bridge[i]) h = Math.max(h, 0.42);
      heights[i] = h;

      let biome: Biome = "meadow";
      if (h < WATER && !bridge[i]) biome = "water";
      else if (path[i] || bridge[i]) biome = "path";
      else if (h > 0.64) biome = "rock";
      else if (h < 0.4) biome = "sand";
      else if (fbm(nx * 1.7 + 9, nz * 1.7) > 0.56) biome = "forest";
      biomes[i] = biome;
      walk[i] = biome === "water" ? 0 : 1;
    }
  }

  for (const b of BUILDINGS) {
    if (b.kind === "stall" || b.kind === "well" || b.kind === "dock" || b.kind === "bridge") continue;
    for (let oz = 0; oz < b.d; oz++) {
      for (let ox = 0; ox < b.w; ox++) {
        const tx = b.tx + ox;
        const tz = b.tz + oz;
        if (!inBounds(tx, tz)) continue;
        const i = idx(tx, tz);
        if (tx === b.doorTx && tz === b.doorTz) {
          walk[i] = 1;
          biomes[i] = "path";
          continue;
        }
        walk[i] = 0;
        biomes[i] = "path";
        heights[i] = Math.max(heights[i], 0.46);
      }
    }
    if (inBounds(b.doorTx, b.doorTz)) {
      walk[idx(b.doorTx, b.doorTz)] = 1;
      biomes[idx(b.doorTx, b.doorTz)] = "path";
    }
  }

  const props: Prop[] = [];
  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const i = idx(tx, tz);
      if (!walk[i] || biomes[i] === "path") continue;
      const r = hash(tx + 17, tz + seed);
      if (biomes[i] === "forest" && r > 0.42 && props.length < 420) {
        const kind = hash(tx, tz + 3) > 0.5 ? "pine" : "oak";
        props.push({ x: tileCenter(tx), z: tileCenter(tz), tx, tz, kind });
        if (r > 0.74) walk[i] = 0;
      } else if (biomes[i] === "rock" && r > 0.68) {
        props.push({ x: tileCenter(tx), z: tileCenter(tz), tx, tz, kind: "rock" });
        walk[i] = 0;
      } else if (biomes[i] === "meadow" && r > 0.9) {
        props.push({
          x: tileCenter(tx) + (hash(tx, 1) - 0.5) * 0.3,
          z: tileCenter(tz),
          tx,
          tz,
          kind: "bloom",
        });
      }
    }
  }

  const pickups: Pickup[] = [];
  let n = 0;
  for (let tz = 2; tz < TILES - 2 && pickups.length < 18; tz++) {
    for (let tx = 2; tx < TILES - 2 && pickups.length < 18; tx++) {
      const i = idx(tx, tz);
      if (!walk[i] || biomes[i] === "water") continue;
      if (Math.abs(tx - spawnTx) + Math.abs(tz - spawnTz) < 4) continue;
      const r = hash(tx * 3, tz * 5 + seed);
      if (r > 0.97) {
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

  const npcs: Npc[] = NPC_SEED.map((s) => ({
    ...s,
    destX: s.x,
    destZ: s.z,
    yaw: 0,
    wait: 0.4 + hash(s.x * 10, s.z * 10) * 2,
  }));

  const world: PapyrusWorld = {
    heights,
    biomes,
    walk,
    props,
    pickups,
    landmarks: LANDMARKS,
    buildings: BUILDINGS,
    npcs,
  };

  const dev = typeof import.meta !== "undefined" && Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  if (dev) {
    for (let t = 0; t < TILES; t++) {
      const c = tileCenter(t);
      const got = worldToTile(c, c);
      if (got.tx !== t || got.tz !== t) {
        throw new Error(`tile inverse broke at ${t} → ${got.tx},${got.tz}`);
      }
    }
  }

  return world;
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

export function surfaceY(world: PapyrusWorld, x: number, z: number): number {
  return groundY(heightAt(world, x, z));
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
  const best = new Float32Array(CELLS);
  best.fill(1e9);
  best[s] = 0;
  const came = new Int32Array(CELLS);
  came.fill(-1);
  const closed = new Uint8Array(CELLS);
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
  while (open.length && guard++ < 9000) {
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
  while (at >= 0 && !seen.has(at) && path.length < CELLS) {
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
    if (dx * dx + dz * dz < 2.2 * 2.2) return m;
  }
  return null;
}

export function nearestNpc(world: PapyrusWorld, x: number, z: number, max = 2.4): Npc | null {
  let best: Npc | null = null;
  let bestD = max * max;
  for (const n of world.npcs) {
    const d = (n.x - x) ** 2 + (n.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

export function tickNpcs(world: PapyrusWorld, dt: number) {
  for (const n of world.npcs) {
    n.wait -= dt;
    if (n.wander && n.wait <= 0) {
      const ang = hash(n.x * 9 + n.wait, n.z * 7) * Math.PI * 2;
      const rad = 1.2 + hash(n.z, n.x) * 3.2;
      n.destX = n.homeX + Math.cos(ang) * rad;
      n.destZ = n.homeZ + Math.sin(ang) * rad;
      n.wait = 2.2 + hash(n.destX, n.destZ) * 3.5;
    }
    const dx = n.destX - n.x;
    const dz = n.destZ - n.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.08) {
      const sp = 1.15 * dt;
      const step = Math.min(sp, dist);
      const nx = n.x + (dx / dist) * step;
      const nz = n.z + (dz / dist) * step;
      if (canWalk(world, nx, n.z)) n.x = nx;
      if (canWalk(world, n.x, nz)) n.z = nz;
      n.yaw = Math.atan2(-dx, -dz);
    }
  }
}

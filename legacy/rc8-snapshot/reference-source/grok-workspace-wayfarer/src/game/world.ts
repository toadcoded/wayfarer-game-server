import { createNoise2D } from "simplex-noise";
import { CollisionFlag, FULL_BLOCK, type Grid } from "./osrs-codec.ts";

export const TILES = 96;
export const TILE_SIZE = 4;
export const HALF = (TILES * TILE_SIZE) / 2;
export const VERT = TILES + 1;
export const WATER_LEVEL = 1.15;
export const WORLD_SEED = 2730;

export type Biome = "water" | "shore" | "path" | "meadow" | "forest" | "highland" | "bridge";

export type Landmark = {
  id: "west" | "east" | "south" | "north";
  name: string;
  hint: string;
  item: string;
  tx: number;
  tz: number;
};

export type Prop = {
  x: number;
  y: number;
  z: number;
  s: number;
  r: number;
  kind: number;
};

export type World = {
  heights: Float32Array;
  walkHeight: Float32Array;
  biomes: Uint8Array;
  collision: Grid;
  trees: Prop[];
  rocks: Prop[];
  flowers: Prop[];
  landmarks: Landmark[];
  spawn: { x: number; z: number };
  npc: { x: number; z: number; yaw: number };
  paths: { tx: number; tz: number }[];
};

export const BIOME_ID: Record<Biome, number> = {
  water: 0,
  shore: 1,
  path: 2,
  meadow: 3,
  forest: 4,
  highland: 5,
  bridge: 6,
};

export const BIOME_NAME: Biome[] = [
  "water",
  "shore",
  "path",
  "meadow",
  "forest",
  "highland",
  "bridge",
];

export const LANDMARKS: Landmark[] = [
  { id: "west", name: "Western Shore", hint: "Where the lake keeps the old boats.", item: "driftwood", tx: 16, tz: 50 },
  { id: "east", name: "Eastern Rise", hint: "Cairn stones on the windward hill.", item: "cairn stone", tx: 80, tz: 44 },
  { id: "south", name: "Southern Gate", hint: "Two pillars that remember a wall.", item: "gate token", tx: 48, tz: 82 },
  { id: "north", name: "North Bridge", hint: "Timber over the talking river.", item: "trail bloom", tx: 48, tz: 14 },
];

export const SPAWN_TILE = { tx: 48, tz: 54 };
export const CROSSROADS = { tx: 48, tz: 48 };

/** Authoritative world → tile. Half-open cells. Inverse of tileCenter. */
export function worldToTile(x: number, z: number) {
  return {
    tx: Math.max(0, Math.min(TILES - 1, Math.floor((x + HALF) / TILE_SIZE))),
    tz: Math.max(0, Math.min(TILES - 1, Math.floor((z + HALF) / TILE_SIZE))),
  };
}

export function tileCenter(t: number) {
  return t * TILE_SIZE - HALF + TILE_SIZE * 0.5;
}

export function tileToWorld(tx: number, tz: number) {
  return { x: tileCenter(tx), z: tileCenter(tz) };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fbm(noise: (x: number, y: number) => number, x: number, z: number) {
  let v = 0;
  let a = 0.55;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    v += noise(x * f, z * f) * a;
    a *= 0.5;
    f *= 2.05;
  }
  return v;
}

function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + dx * t - px;
  const qz = az + dz * t - pz;
  return Math.hypot(qx, qz);
}

function distToPoly(px: number, pz: number, poly: number[][]) {
  let d = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    d = Math.min(d, distToSeg(px, pz, poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1]));
  }
  return d;
}

const RIVER_TILES: number[][] = [
  [10, 50],
  [16, 44],
  [24, 32],
  [34, 20],
  [42, 15],
  [48, 14],
  [62, 14],
  [78, 18],
];

const TRAIL_POLY: Record<string, number[][]> = {
  west: [
    [48, 48],
    [36, 50],
    [24, 50],
    [16, 50],
  ],
  east: [
    [48, 48],
    [60, 46],
    [72, 44],
    [80, 44],
  ],
  south: [
    [48, 48],
    [48, 62],
    [48, 74],
    [48, 82],
  ],
  north: [
    [48, 48],
    [48, 36],
    [48, 24],
    [48, 14],
  ],
};

let cached: World | null = null;

export function getWorld(): World {
  if (cached) return cached;
  cached = buildWorld();
  return cached;
}

function buildWorld(): World {
  const rng = mulberry32(WORLD_SEED);
  const noise = createNoise2D(mulberry32(WORLD_SEED ^ 0x9e3779b9));
  const moist = createNoise2D(mulberry32(WORLD_SEED ^ 0x85ebca6b));

  const heights = new Float32Array(VERT * VERT);
  const walkHeight = new Float32Array(TILES * TILES);
  const biomes = new Uint8Array(TILES * TILES);
  const flags = new Uint32Array(TILES * TILES);
  const collision: Grid = { width: TILES, height: TILES, flags };

  const lakeX = tileCenter(16);
  const lakeZ = tileCenter(50);
  const bridgeTx = 48;
  const bridgeTz = 14;

  for (let iz = 0; iz < VERT; iz++) {
    for (let ix = 0; ix < VERT; ix++) {
      const x = ix * TILE_SIZE - HALF;
      const z = iz * TILE_SIZE - HALF;
      const nx = x / HALF;
      const nz = z / HALF;
      const radial = Math.hypot(nx, nz);
      const island = Math.max(0, 1 - Math.pow(radial, 1.65));
      let h = 3.4 + fbm(noise, x * 0.0085, z * 0.0085) * 6.2;
      h *= 0.35 + island * 0.85;
      const lake = Math.exp(-(Math.pow((x - lakeX) / 28, 2) + Math.pow((z - lakeZ) / 22, 2)));
      h -= lake * 4.6;
      const river = distToPoly(ix, iz, RIVER_TILES);
      h -= Math.exp(-(river * river) / 3.2) * 3.4;
      heights[iz * VERT + ix] = h;
    }
  }

  const flattenPath = (poly: number[][], radius: number, heightBias: number) => {
    for (let tz = 0; tz < TILES; tz++) {
      for (let tx = 0; tx < TILES; tx++) {
        const d = distToPoly(tx + 0.5, tz + 0.5, poly);
        if (d > radius) continue;
        const i00 = tz * VERT + tx;
        const target = heightBias;
        const k = 1 - d / radius;
        const mix = k * k;
        heights[i00] = heights[i00] * (1 - mix) + target * mix;
        heights[i00 + 1] = heights[i00 + 1] * (1 - mix) + target * mix;
        heights[i00 + VERT] = heights[i00 + VERT] * (1 - mix) + target * mix;
        heights[i00 + VERT + 1] = heights[i00 + VERT + 1] * (1 - mix) + target * mix;
      }
    }
  };

  const pathHeight = 2.35;
  for (const poly of Object.values(TRAIL_POLY)) flattenPath(poly, 1.6, pathHeight);

  const deck = WATER_LEVEL + 0.42;
  for (let tz = bridgeTz - 2; tz <= bridgeTz + 2; tz++) {
    for (let tx = bridgeTx - 1; tx <= bridgeTx + 1; tx++) {
      const i00 = tz * VERT + tx;
      for (const i of [i00, i00 + 1, i00 + VERT, i00 + VERT + 1]) heights[i] = deck;
    }
  }

  const paths: { tx: number; tz: number }[] = [];
  const onTrail = new Uint8Array(TILES * TILES);

  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const ci = tz * TILES + tx;
      const i00 = tz * VERT + tx;
      const h =
        (heights[i00] + heights[i00 + 1] + heights[i00 + VERT] + heights[i00 + VERT + 1]) / 4;
      const wx = tileCenter(tx);
      const wz = tileCenter(tz);
      const m = 0.5 + 0.5 * moist(wx * 0.01, wz * 0.01);
      let trail = false;
      let dTrail = 99;
      for (const poly of Object.values(TRAIL_POLY)) {
        const d = distToPoly(tx + 0.5, tz + 0.5, poly);
        if (d < dTrail) dTrail = d;
        if (d < 1.05) trail = true;
      }
      const riverD = distToPoly(tx + 0.5, tz + 0.5, RIVER_TILES);
      const isBridge =
        tx >= bridgeTx - 1 && tx <= bridgeTx + 1 && tz >= bridgeTz - 2 && tz <= bridgeTz + 2;

      let biome: Biome;
      if (isBridge) biome = "bridge";
      else if (h < WATER_LEVEL) biome = "water";
      else if (h < WATER_LEVEL + 0.45) biome = "shore";
      else if (trail) biome = "path";
      else if (h > 6.4) biome = "highland";
      else if (m > 0.52 && h > 2.1) biome = "forest";
      else biome = "meadow";

      biomes[ci] = BIOME_ID[biome];
      walkHeight[ci] = isBridge ? deck : h;
      if (trail || isBridge) {
        onTrail[ci] = 1;
        paths.push({ tx, tz });
      }

      if (isBridge) {
        flags[ci] = 0;
      } else if (biome === "water" || riverD < 0.85 && h < WATER_LEVEL + 0.15) {
        flags[ci] = FULL_BLOCK;
        biomes[ci] = BIOME_ID.water;
        walkHeight[ci] = Math.min(h, WATER_LEVEL - 0.4);
      } else {
        flags[ci] = 0;
      }
    }
  }

  const trees: Prop[] = [];
  const rocks: Prop[] = [];
  const flowers: Prop[] = [];

  const occupy = (tx: number, tz: number) => {
    if (tx < 0 || tz < 0 || tx >= TILES || tz >= TILES) return;
    flags[tz * TILES + tx] |= CollisionFlag.OBJECT;
  };

  for (let tz = 2; tz < TILES - 2; tz++) {
    for (let tx = 2; tx < TILES - 2; tx++) {
      const ci = tz * TILES + tx;
      const biome = BIOME_NAME[biomes[ci]];
      if (biome === "water" || biome === "bridge" || biome === "path" || biome === "shore") continue;
      if (onTrail[ci]) continue;
      const nearLm = LANDMARKS.some((l) => Math.abs(l.tx - tx) + Math.abs(l.tz - tz) < 3);
      if (nearLm) continue;
      if (Math.abs(tx - SPAWN_TILE.tx) + Math.abs(tz - SPAWN_TILE.tz) < 4) continue;

      const n = rng();
      const wx = tileCenter(tx) + (rng() - 0.5) * 1.6;
      const wz = tileCenter(tz) + (rng() - 0.5) * 1.6;
      const { tx: ptx, tz: ptz } = worldToTile(wx, wz);
      const pci = ptz * TILES + ptx;
      const y = walkHeight[pci];
      const dens = biome === "forest" ? 0.55 : biome === "highland" ? 0.18 : 0.22;

      if (n < dens) {
        trees.push({
          x: wx,
          y,
          z: wz,
          s: 0.75 + rng() * 0.7,
          r: rng() * Math.PI * 2,
          kind: biome === "meadow" || rng() > 0.72 ? 1 : 0,
        });
        occupy(ptx, ptz);
      } else if (n < dens + 0.045) {
        rocks.push({
          x: wx,
          y,
          z: wz,
          s: 0.4 + rng() * 0.7,
          r: rng() * Math.PI * 2,
          kind: 0,
        });
        occupy(ptx, ptz);
      } else if (biome === "meadow" && n < dens + 0.16) {
        flowers.push({
          x: wx,
          y,
          z: wz,
          s: 0.5 + rng() * 0.4,
          r: rng() * Math.PI * 2,
          kind: (rng() * 3) | 0,
        });
      }
    }
  }

  const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.tz);
  const npcTile = tileToWorld(50, 49);

  return {
    heights,
    walkHeight,
    biomes,
    collision,
    trees,
    rocks,
    flowers,
    landmarks: LANDMARKS,
    spawn: { x: spawn.x, z: spawn.z },
    npc: { x: npcTile.x, z: npcTile.z, yaw: -0.6 },
    paths,
  };
}

export function sampleHeight(heights: Float32Array, x: number, z: number) {
  const fx = (x + HALF) / TILE_SIZE;
  const fz = (z + HALF) / TILE_SIZE;
  const ix = Math.max(0, Math.min(TILES - 1, Math.floor(fx)));
  const iz = Math.max(0, Math.min(TILES - 1, Math.floor(fz)));
  const tx = fx - ix;
  const tz = fz - iz;
  const i = iz * VERT + ix;
  const h00 = heights[i];
  const h10 = heights[i + 1];
  const h01 = heights[i + VERT];
  const h11 = heights[i + VERT + 1];
  return h00 * (1 - tx) * (1 - tz) + h10 * tx * (1 - tz) + h01 * (1 - tx) * tz + h11 * tx * tz;
}

export function sampleWalk(world: World, x: number, z: number) {
  const { tx, tz } = worldToTile(x, z);
  return world.walkHeight[tz * TILES + tx];
}

export function sampleBiome(world: World, x: number, z: number): Biome {
  const { tx, tz } = worldToTile(x, z);
  return BIOME_NAME[world.biomes[tz * TILES + tx]] ?? "meadow";
}

export function biomeLabel(b: Biome) {
  if (b === "bridge") return "Bridge";
  if (b === "highland") return "Highland";
  if (b === "shore") return "Shore";
  if (b === "path") return "Trail";
  return b[0].toUpperCase() + b.slice(1);
}

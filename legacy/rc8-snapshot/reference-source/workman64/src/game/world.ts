import { createNoise2D } from "simplex-noise";
import { CollisionFlag, FULL_BLOCK, type Grid } from "./osrs-codec.ts";
import { HALF, TILE_SIZE, TILES, VERT, heightCell, tileCenter, tileToWorld, worldToTile } from "./coordinates.ts";

export { HALF, TILE_SIZE, TILES, VERT, tileCenter, tileToWorld, worldToTile, worldToTileRaw, tileLeftEdge, tileToWorld1d } from "./coordinates.ts";

export const WATER_LEVEL = 1.15;
export const WORLD_SEED = 2730;
export const BRIDGE_DECK = WATER_LEVEL + 0.42;

export type Biome = "water" | "shore" | "path" | "meadow" | "forest" | "highland" | "bridge";

export type FolkKind = "rowan" | "miller" | "keeper" | "trader";

export type Folk = {
  id: "halden" | "wren" | "toller" | "rowan" | "mara";
  name: string;
  kind: FolkKind;
  tx: number;
  tz: number;
  yaw: number;
};

/** Ashfen Quiet Tithe cast, planted on walkable Reedhaven tiles. */
export const FOLK: Folk[] = [
  { id: "halden", name: "Halden", kind: "keeper", tx: 46, tz: 50, yaw: 0.35 },
  { id: "wren", name: "Wren", kind: "rowan", tx: 45, tz: 58, yaw: 1.1 },
  { id: "toller", name: "Toller", kind: "miller", tx: 40, tz: 28, yaw: 0.55 },
  { id: "rowan", name: "Rowan", kind: "trader", tx: 50, tz: 49, yaw: -0.6 },
  { id: "mara", name: "Mara", kind: "trader", tx: 56, tz: 51, yaw: -1.15 },
];

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

export type ResourceKind = "wood" | "forage" | "stone" | "reed";

export type ResourceNode = {
  id: string;
  kind: ResourceKind;
  name: string;
  item: string;
  tx: number;
  tz: number;
  respawn: number;
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
  nodes: ResourceNode[];
  spawn: { x: number; z: number };
  npc: { x: number; z: number; yaw: number };
  folk: Folk[];
  paths: { tx: number; tz: number }[];
  buildings: Building[];
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

/** Stand just south of the four-way fork so the isometric camera looks into the split. */
export const SPAWN_TILE = { tx: 48, tz: 51 };
export const CROSSROADS = { tx: 48, tz: 48 };

export const PLAZA = { tx0: 45, tx1: 51, tz0: 45, tz1: 51 };
export const POND = { tx0: 40, tx1: 53, tz0: 31, tz1: 40 };

export function inPlaza(tx: number, tz: number) {
  return tx >= PLAZA.tx0 && tx <= PLAZA.tx1 && tz >= PLAZA.tz0 && tz <= PLAZA.tz1;
}
export function inPond(tx: number, tz: number) {
  if (tx >= 47 && tx <= 49) return false;
  return tx >= POND.tx0 && tx <= POND.tx1 && tz >= POND.tz0 && tz <= POND.tz1;
}

export type District = {
  id: string;
  name: string;
  tx0: number;
  tx1: number;
  tz0: number;
  tz1: number;
};

/** Named yards layered over the 96 map — keep trails clear of their AABBs. */
export const DISTRICTS: District[] = [
  { id: "market", name: "Reed market", tx0: 52, tx1: 57, tz0: 49, tz1: 53 },
  { id: "garden", name: "Lantern garden", tx0: 43, tx1: 47, tz0: 56, tz1: 63 },
  { id: "mill", name: "Mill yard", tx0: 33, tx1: 41, tz0: 21, tz1: 28 },
  { id: "quay", name: "West quay", tx0: 14, tx1: 21, tz0: 45, tz1: 49 },
  { id: "orchard", name: "Keep orchard", tx0: 54, tx1: 64, tz0: 58, tz1: 68 },
  { id: "bailey", name: "Gate bailey", tx0: 45, tx1: 51, tz0: 76, tz1: 84 },
];

export function inDistrict(tx: number, tz: number, id?: string) {
  return DISTRICTS.some(
    (d) =>
      (!id || d.id === id) && tx >= d.tx0 && tx <= d.tx1 && tz >= d.tz0 && tz <= d.tz1,
  );
}

export function districtAt(tx: number, tz: number): District | undefined {
  return DISTRICTS.find((d) => tx >= d.tx0 && tx <= d.tx1 && tz >= d.tz0 && tz <= d.tz1);
}

export type Building = {
  id: string;
  name: string;
  tx: number;
  tz: number;
  sx: number;
  sz: number;
  h: number;
  wall: string;
  roof: string;
};

export const BUILDINGS: Building[] = [
  { id: "hall", name: "Reed hall", tx: 32, tz: 36, sx: 6, sz: 7, h: 4.4, wall: "#5a6570", roof: "#6a4638" },
  { id: "cottage", name: "South cottage", tx: 52, tz: 56, sx: 5, sz: 6, h: 3.4, wall: "#5c656c", roof: "#6a4e3c" },
  { id: "mill", name: "Reed mill", tx: 34, tz: 22, sx: 5, sz: 5, h: 5.2, wall: "#6a5a4a", roof: "#5a3a2a" },
  { id: "chapel", name: "Lantern chapel", tx: 39, tz: 58, sx: 4, sz: 5, h: 4.8, wall: "#6e6a62", roof: "#3d4a3a" },
  { id: "workshop", name: "Ash workshop", tx: 66, tz: 37, sx: 4, sz: 4, h: 3.6, wall: "#5a5048", roof: "#4a3428" },
  { id: "shed", name: "Quay shed", tx: 18, tz: 45, sx: 3, sz: 3, h: 2.8, wall: "#5c5044", roof: "#6a4e32" },
];

export function inBuilding(tx: number, tz: number) {
  return BUILDINGS.some(
    (b) => tx >= b.tx && tx < b.tx + b.sx && tz >= b.tz && tz < b.tz + b.sz,
  );
}

export function locationName(tx: number, tz: number) {
  if (inPlaza(tx, tz)) return "Reedhaven square";
  if (inPond(tx, tz)) return "Reed pond";
  const d = districtAt(tx, tz);
  if (d) return d.name;
  if (tx >= 34 && tx <= 42 && tz >= 48 && tz <= 56) return "West grove";
  if (tx >= 58 && tx <= 66 && tz >= 42 && tz <= 50) return "Grey rocks";
  if (Math.abs(tx - 48) <= 2 && tz >= 12 && tz <= 18) return "North bridge";
  if (tx <= 22 && tz >= 44 && tz <= 56) return "Western shore";
  if (tx >= 74) return "Eastern rise";
  if (tz >= 76) return "Southern gate";
  return "Reedhaven";
}

/** Inclusive tile AABB of the North Bridge deck. 3×5 tiles over the river at tz≈14. */
export const BRIDGE = { tx0: 47, tx1: 49, tz0: 12, tz1: 16 };

export function isBridgeTile(tx: number, tz: number) {
  return tx >= BRIDGE.tx0 && tx <= BRIDGE.tx1 && tz >= BRIDGE.tz0 && tz <= BRIDGE.tz1;
}

/** World-space AABB of the rendered / walkable deck (inset 0.2 from tile edges). */
export function bridgeWorldBounds() {
  const inset = 0.2;
  return {
    x0: BRIDGE.tx0 * TILE_SIZE - HALF + inset,
    x1: (BRIDGE.tx1 + 1) * TILE_SIZE - HALF - inset,
    z0: BRIDGE.tz0 * TILE_SIZE - HALF + inset,
    z1: (BRIDGE.tz1 + 1) * TILE_SIZE - HALF - inset,
  };
}

export const NODE_SEEDS: ResourceNode[] = [
  { id: "reed-1", kind: "reed", name: "Marsh reed", item: "marsh reed", tx: 22, tz: 50, respawn: 10 },
  { id: "reed-2", kind: "reed", name: "Marsh reed", item: "marsh reed", tx: 21, tz: 50, respawn: 10 },
  { id: "reedwood", kind: "wood", name: "Reedwood", item: "reedwood", tx: 43, tz: 52, respawn: 14 },
  { id: "wood-2", kind: "wood", name: "Latchwood", item: "latchwood", tx: 49, tz: 64, respawn: 14 },
  { id: "wood-3", kind: "wood", name: "Latchwood", item: "latchwood", tx: 49, tz: 36, respawn: 14 },
  { id: "drift-1", kind: "wood", name: "Driftwood", item: "driftwood", tx: 19, tz: 48, respawn: 12 },
  { id: "stone-1", kind: "stone", name: "Cairn chip", item: "cairn chip", tx: 74, tz: 44, respawn: 16 },
  { id: "stone-2", kind: "stone", name: "Cairn chip", item: "cairn chip", tx: 76, tz: 45, respawn: 16 },
  { id: "forage-1", kind: "forage", name: "Trail bloom", item: "trail bloom", tx: 35, tz: 49, respawn: 8 },
  { id: "forage-2", kind: "forage", name: "Trail bloom", item: "trail bloom", tx: 48, tz: 70, respawn: 8 },
  { id: "forage-3", kind: "forage", name: "Trail bloom", item: "trail bloom", tx: 58, tz: 46, respawn: 8 },
  { id: "forage-4", kind: "forage", name: "Ash cap", item: "ash cap", tx: 48, tz: 22, respawn: 9 },
  { id: "forage-5", kind: "forage", name: "Lantern bloom", item: "lantern bloom", tx: 45, tz: 60, respawn: 8 },
  { id: "forage-6", kind: "forage", name: "Orchard pip", item: "orchard pip", tx: 58, tz: 63, respawn: 8 },
  { id: "wood-4", kind: "wood", name: "Mill timber", item: "mill timber", tx: 41, tz: 24, respawn: 14 },
  { id: "wood-5", kind: "wood", name: "Orchard bough", item: "orchard bough", tx: 60, tz: 66, respawn: 14 },
  { id: "ash-ore", kind: "stone", name: "Ash ore", item: "ash ore", tx: 64, tz: 42, respawn: 16 },
  { id: "reed-perch", kind: "reed", name: "Reed perch", item: "reed perch", tx: 16, tz: 47, respawn: 10 },
  { id: "mire-fibre", kind: "forage", name: "Mire fibre", item: "mire fibre", tx: 39, tz: 42, respawn: 8 },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  mill: [
    [48, 24],
    [42, 24],
    [40, 24],
  ],
  garden: [
    [48, 62],
    [45, 60],
    [44, 58],
  ],
  orchard: [
    [48, 64],
    [56, 64],
    [62, 64],
  ],
  copper: [
    [48, 45],
    [42, 45],
    [42, 48],
  ],
  quay: [
    [24, 50],
    [20, 48],
    [16, 47],
  ],
};

/** Red trail cones — one at each mid-trail waypoint, matching the original walk. */
export function trailBeacons() {
  const pts: { tx: number; tz: number }[] = [];
  for (const poly of Object.values(TRAIL_POLY)) {
    for (let i = 1; i < poly.length - 1; i++) {
      pts.push({ tx: poly[i][0], tz: poly[i][1] });
    }
  }
  return pts;
}

let cached: World | null = null;

export function getWorld(): World {
  if (cached) return cached;
  cached = buildWorld();
  return cached;
}

function buildWorld(): World {
  const rng = mulberry32(WORLD_SEED);
  const moist = createNoise2D(mulberry32(WORLD_SEED ^ 0x85ebca6b));

  const heights = new Float32Array(VERT * VERT);
  const walkHeight = new Float32Array(TILES * TILES);
  const biomes = new Uint8Array(TILES * TILES);
  const flags = new Uint32Array(TILES * TILES);
  const collision: Grid = { width: TILES, height: TILES, flags };

  const lakeX = tileCenter(16);
  const lakeZ = tileCenter(50);

  const LAND = 2.08;

  for (let iz = 0; iz < VERT; iz++) {
    for (let ix = 0; ix < VERT; ix++) {
      const x = ix * TILE_SIZE - HALF;
      const z = iz * TILE_SIZE - HALF;
      let h = LAND;
      const lake = Math.exp(-(Math.pow((x - lakeX) / 26, 2) + Math.pow((z - lakeZ) / 20, 2)));
      h -= lake * 2.8;
      const river = distToPoly(ix, iz, RIVER_TILES);
      h -= Math.exp(-(river * river) / 2.8) * 2.6;
      if (ix >= POND.tx0 && ix <= POND.tx1 + 1 && iz >= POND.tz0 && iz <= POND.tz1 + 1) {
        if (!(ix >= 47 && ix <= 50)) h = Math.min(h, WATER_LEVEL - 0.55);
      }
      heights[iz * VERT + ix] = h;
    }
  }

  const flattenPath = (poly: number[][], radius: number, heightBias: number) => {
    for (let tz = 0; tz < TILES; tz++) {
      for (let tx = 0; tx < TILES; tx++) {
        const d = distToPoly(tx + 0.5, tz + 0.5, poly);
        if (d > radius) continue;
        const i00 = tz * VERT + tx;
        const k = 1 - d / radius;
        const mix = k * k;
        for (const i of [i00, i00 + 1, i00 + VERT, i00 + VERT + 1]) {
          heights[i] = heights[i] * (1 - mix) + heightBias * mix;
        }
      }
    }
  };

  const pathHeight = LAND;
  for (const poly of Object.values(TRAIL_POLY)) flattenPath(poly, 1.6, pathHeight);
  flattenPath(
    [
      [PLAZA.tx0, PLAZA.tz0],
      [PLAZA.tx1, PLAZA.tz0],
      [PLAZA.tx1, PLAZA.tz1],
      [PLAZA.tx0, PLAZA.tz1],
      [PLAZA.tx0, PLAZA.tz0],
    ],
    2.6,
    LAND,
  );

  for (const d of DISTRICTS) {
    flattenPath(
      [
        [d.tx0, d.tz0],
        [d.tx1, d.tz0],
        [d.tx1, d.tz1],
        [d.tx0, d.tz1],
        [d.tx0, d.tz0],
      ],
      1.8,
      LAND,
    );
  }

  for (let tz = BRIDGE.tz0; tz <= BRIDGE.tz1; tz++) {
    for (let tx = BRIDGE.tx0; tx <= BRIDGE.tx1; tx++) {
      const i00 = tz * VERT + tx;
      for (const i of [i00, i00 + 1, i00 + VERT, i00 + VERT + 1]) heights[i] = BRIDGE_DECK;
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
      for (const poly of Object.values(TRAIL_POLY)) {
        if (distToPoly(tx + 0.5, tz + 0.5, poly) < 1.05) trail = true;
      }
      const nearFork = Math.abs(tx - CROSSROADS.tx) <= 2 && Math.abs(tz - CROSSROADS.tz) <= 2;
      if (nearFork) trail = true;
      const riverD = distToPoly(tx + 0.5, tz + 0.5, RIVER_TILES);
      const bridge = isBridgeTile(tx, tz);

      const plaza = inPlaza(tx, tz);
      const pond = inPond(tx, tz);
      const built = inBuilding(tx, tz);
      const millYard = inDistrict(tx, tz, "mill");
      const market = inDistrict(tx, tz, "market");
      const bailey = inDistrict(tx, tz, "bailey");
      const garden = inDistrict(tx, tz, "garden");

      let biome: Biome;
      if (bridge) biome = "bridge";
      else if (plaza || millYard || market || bailey) biome = "highland";
      else if (pond || h < WATER_LEVEL) biome = "water";
      else if (h < WATER_LEVEL + 0.22) biome = "shore";
      else if (trail) biome = "path";
      else if (garden) biome = "meadow";
      else if (m > 0.55) biome = "forest";
      else biome = "meadow";

      biomes[ci] = BIOME_ID[biome];
      walkHeight[ci] = bridge ? BRIDGE_DECK : h;
      if (trail || bridge) {
        onTrail[ci] = 1;
        paths.push({ tx, tz });
      }

      if (bridge) {
        flags[ci] = 0;
      } else if (built) {
        flags[ci] = FULL_BLOCK;
      } else if (pond) {
        flags[ci] = CollisionFlag.FLOOR;
        biomes[ci] = BIOME_ID.water;
        walkHeight[ci] = Math.min(h, WATER_LEVEL - 0.4);
      } else if (riverD < 0.85 && h < WATER_LEVEL + 0.15) {
        flags[ci] = CollisionFlag.FLOOR;
        biomes[ci] = BIOME_ID.water;
        walkHeight[ci] = Math.min(h, WATER_LEVEL - 0.4);
      } else if (biome === "water") {
        const radial = Math.hypot(wx / HALF, wz / HALF);
        if (radial > 0.78) {
          flags[ci] = CollisionFlag.FLOOR;
          walkHeight[ci] = Math.min(h, WATER_LEVEL - 0.4);
        } else {
          flags[ci] = 0;
          walkHeight[ci] = WATER_LEVEL - 0.16;
        }
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
      if (inPlaza(tx, tz) || inPond(tx, tz) || inBuilding(tx, tz)) continue;
      if (inDistrict(tx, tz) && !inDistrict(tx, tz, "orchard")) continue;
      if (NODE_SEEDS.some((n) => n.tx === tx && n.tz === tz)) continue;
      const nearLm = LANDMARKS.some((l) => Math.abs(l.tx - tx) + Math.abs(l.tz - tz) < 3);
      if (nearLm) continue;
      if (Math.abs(tx - SPAWN_TILE.tx) + Math.abs(tz - SPAWN_TILE.tz) < 5) continue;
      if (Math.abs(tx - CROSSROADS.tx) + Math.abs(tz - CROSSROADS.tz) < 4) continue;

      const n = rng();
      const wx = tileCenter(tx) + (rng() - 0.5) * 1.6;
      const wz = tileCenter(tz) + (rng() - 0.5) * 1.6;
      const { tx: ptx, tz: ptz } = worldToTile(wx, wz);
      const pci = ptz * TILES + ptx;
      const y = walkHeight[pci];
      const orchard = inDistrict(tx, tz, "orchard");
      const dens = orchard ? 0.62 : biome === "forest" ? 0.52 : 0.2;

      if (n < dens) {
        trees.push({
          x: wx,
          y,
          z: wz,
          s: 0.85 + rng() * 0.55,
          r: rng() * Math.PI * 2,
          kind: orchard ? 2 : rng() > 0.55 ? 1 : 0,
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

  const nodes: ResourceNode[] = [];
  for (const seed of NODE_SEEDS) {
    const ci = seed.tz * TILES + seed.tx;
    if (ci < 0 || ci >= flags.length) continue;
    if (inBuilding(seed.tx, seed.tz) || inPond(seed.tx, seed.tz)) continue;
    if ((flags[ci] & CollisionFlag.FLOOR) !== 0) continue;
    nodes.push(seed);
  }

  const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.tz);
  const npcTile = tileToWorld(50, 49);

  for (const b of BUILDINGS) {
    for (let tz = b.tz; tz < b.tz + b.sz; tz++) {
      for (let tx = b.tx; tx < b.tx + b.sx; tx++) occupy(tx, tz);
    }
  }

  return {
    heights,
    walkHeight,
    biomes,
    collision,
    trees,
    rocks,
    flowers,
    landmarks: LANDMARKS,
    nodes,
    spawn: { x: spawn.x, z: spawn.z },
    npc: { x: npcTile.x, z: npcTile.z, yaw: -0.6 },
    folk: FOLK,
    paths,
    buildings: BUILDINGS,
  };
}

export function sampleHeight(heights: Float32Array, x: number, z: number) {
  const { ix, iz, tx, tz } = heightCell(x, z);
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

/** Feet on the rendered mesh. Tile-flat walkHeight is only for A* occupancy. */
export function sampleGround(world: World, x: number, z: number) {
  const { tx, tz } = worldToTile(x, z);
  const biome = BIOME_NAME[world.biomes[tz * TILES + tx]] as Biome;
  if (biome === "bridge") return BRIDGE_DECK;
  const h = sampleHeight(world.heights, x, z);
  if (biome === "water") return Math.max(h, WATER_LEVEL - 0.16);
  return h;
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

export function nearestNode(world: World, x: number, z: number, maxDist = 4.2): ResourceNode | null {
  let best: ResourceNode | null = null;
  let bestD = maxDist;
  for (const n of world.nodes) {
    const wx = tileCenter(n.tx);
    const wz = tileCenter(n.tz);
    const d = Math.hypot(x - wx, z - wz);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

export function gatherLine(kind: ResourceKind, item: string) {
  if (item === "driftwood") return "You take driftwood.";
  if (item === "trail bloom") return "You take a trail bloom.";
  if (kind === "wood") return `You take ${item}.`;
  if (kind === "reed") return `You pull ${item} from the water's edge.`;
  if (kind === "stone") return `You lift ${item}.`;
  return /^[aeiou]/i.test(item) ? `You take an ${item}.` : `You take a ${item}.`;
}

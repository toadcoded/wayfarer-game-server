import { BODY_R, NPC_R, integrateBody } from "./papyrus-physics";

export const TILES = 64;
export const WATER = 0.28;
export const SPAWN = { x: 32.5, z: 40.5 };
export const PLAZA = { x: 32.5, z: 32.5 };
export const Y_SCALE = 0;

const CELLS = TILES * TILES;

export type Biome = "plaza" | "ring" | "street" | "water" | "grass" | "wall";

export type LandmarkId = "market" | "keep" | "hall" | "quay";

export type Landmark = {
  id: LandmarkId;
  name: string;
  tx: number;
  tz: number;
  line: string;
  talk: string;
};

export type Street = {
  name: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
};

export type Prop = {
  x: number;
  z: number;
  tx: number;
  tz: number;
  kind: "lamp" | "bench" | "crate" | "tree" | "flag";
  yaw: number;
};

export type Pickup = {
  id: string;
  x: number;
  z: number;
  kind: "leaf" | "note" | "coin";
  taken: boolean;
};

export type BuildingKind =
  | "keep"
  | "hall"
  | "chapel"
  | "cottage"
  | "stall"
  | "inn"
  | "oven"
  | "dock"
  | "warehouse"
  | "wall";

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
  vx: number;
  vz: number;
  gait: number;
  pose: "idle" | "walk" | "sit" | "talk";
  line: string;
  wander: boolean;
  wait: number;
  cloak: number;
};

export const LANDMARKS: Landmark[] = [
  {
    id: "market",
    name: "Wright Market",
    tx: 12,
    tz: 32,
    line: "Stalls and ledgers. Wright keeps the row.",
    talk: "Wright Caldew",
  },
  {
    id: "keep",
    name: "Copper Keep",
    tx: 32,
    tz: 12,
    line: "The keep is a desk with a gate.",
    talk: "Keepmaster Vale",
  },
  {
    id: "hall",
    name: "Codex Hall",
    tx: 32,
    tz: 54,
    line: "Numbered leaves live in the hall.",
    talk: "Scholar Quill",
  },
  {
    id: "quay",
    name: "East Quay",
    tx: 54,
    tz: 32,
    line: "Packets wait on the dock. Don't drown them.",
    talk: "Dockwarden Moss",
  },
];

export const STREETS: Street[] = [
  { name: "Reedhaven Square", x0: 22, z0: 22, x1: 42, z1: 42 },
  { name: "Keep Way", x0: 30, z0: 8, x1: 34, z1: 24 },
  { name: "Wright Row", x0: 8, z0: 30, x1: 24, z1: 34 },
  { name: "Codex Lane", x0: 30, z0: 40, x1: 34, z1: 56 },
  { name: "Quay Gate", x0: 40, z0: 30, x1: 56, z1: 34 },
];

export const BUILDINGS: Building[] = [
  // Plaza ring — first frame must read as a city square
  { id: "inn", name: "Reed Inn", kind: "inn", tx: 22, tz: 24, w: 6, d: 5, h: 6.4, yaw: Math.PI / 2, doorTx: 28, doorTz: 26 },
  { id: "oven", name: "Fen Oven", kind: "oven", tx: 22, tz: 35, w: 5, d: 5, h: 5.2, yaw: Math.PI / 2, doorTx: 27, doorTz: 37 },
  { id: "chapel", name: "Reed Chapel", kind: "chapel", tx: 37, tz: 22, w: 5, d: 6, h: 7.2, yaw: 0, doorTx: 39, doorTz: 28 },
  { id: "plaza-e", name: "Lantern House", kind: "cottage", tx: 43, tz: 24, w: 6, d: 5, h: 6.0, yaw: -Math.PI / 2, doorTx: 43, doorTz: 26 },
  { id: "plaza-se", name: "Quill House", kind: "cottage", tx: 43, tz: 36, w: 6, d: 5, h: 5.6, yaw: -Math.PI / 2, doorTx: 43, doorTz: 38 },
  { id: "plaza-s", name: "Trail House", kind: "cottage", tx: 36, tz: 43, w: 6, d: 5, h: 5.4, yaw: Math.PI, doorTx: 38, doorTz: 43 },
  { id: "plaza-sw", name: "Lamp House", kind: "cottage", tx: 22, tz: 43, w: 6, d: 5, h: 5.5, yaw: Math.PI, doorTx: 24, doorTz: 43 },

  // Copper Keep (north)
  { id: "keep", name: "Copper Keep", kind: "keep", tx: 26, tz: 4, w: 12, d: 7, h: 9.5, yaw: 0, doorTx: 32, doorTz: 11 },
  { id: "keep-w", name: "Keep Ward", kind: "warehouse", tx: 22, tz: 12, w: 6, d: 6, h: 7.8, yaw: Math.PI / 2, doorTx: 28, doorTz: 14 },
  { id: "keep-e", name: "Keep Archive", kind: "warehouse", tx: 36, tz: 12, w: 6, d: 6, h: 7.6, yaw: -Math.PI / 2, doorTx: 36, doorTz: 14 },

  // Wright Market (west)
  { id: "stall-a", name: "Leaf Stall", kind: "stall", tx: 8, tz: 24, w: 4, d: 3, h: 2.2, yaw: Math.PI / 2, doorTx: 12, doorTz: 25 },
  { id: "stall-b", name: "Ink Stall", kind: "stall", tx: 8, tz: 28, w: 4, d: 2, h: 2.0, yaw: Math.PI / 2, doorTx: 12, doorTz: 29 },
  { id: "stall-c", name: "Wire Stall", kind: "stall", tx: 8, tz: 35, w: 4, d: 3, h: 2.1, yaw: Math.PI / 2, doorTx: 12, doorTz: 36 },
  { id: "market-hall", name: "Wright Hall", kind: "cottage", tx: 4, tz: 30, w: 4, d: 6, h: 5.8, yaw: Math.PI / 2, doorTx: 8, doorTz: 32 },
  { id: "market-n", name: "Row House", kind: "cottage", tx: 14, tz: 22, w: 5, d: 5, h: 5.0, yaw: 0, doorTx: 16, doorTz: 27 },
  { id: "market-s", name: "Ledger House", kind: "cottage", tx: 14, tz: 37, w: 5, d: 5, h: 5.1, yaw: Math.PI, doorTx: 16, doorTz: 37 },

  // Codex Hall (south)
  { id: "hall", name: "Codex Hall", kind: "hall", tx: 26, tz: 56, w: 12, d: 6, h: 8.2, yaw: Math.PI, doorTx: 32, doorTz: 56 },
  { id: "scribe", name: "Scribe Wing", kind: "cottage", tx: 22, tz: 50, w: 6, d: 5, h: 5.4, yaw: Math.PI / 2, doorTx: 28, doorTz: 52 },
  { id: "leaf-room", name: "Leaf Room", kind: "cottage", tx: 36, tz: 50, w: 6, d: 5, h: 5.3, yaw: -Math.PI / 2, doorTx: 36, doorTz: 52 },

  // East Quay
  { id: "dock-n", name: "North Slip", kind: "dock", tx: 56, tz: 24, w: 6, d: 4, h: 1.4, yaw: 0, doorTx: 54, doorTz: 26 },
  { id: "dock-s", name: "South Slip", kind: "dock", tx: 56, tz: 36, w: 6, d: 4, h: 1.4, yaw: 0, doorTx: 54, doorTz: 38 },
  { id: "quay-house", name: "Dock House", kind: "warehouse", tx: 48, tz: 22, w: 6, d: 6, h: 6.2, yaw: 0, doorTx: 50, doorTz: 28 },
  { id: "quay-store", name: "Packet Store", kind: "warehouse", tx: 48, tz: 36, w: 6, d: 6, h: 5.8, yaw: Math.PI, doorTx: 50, doorTz: 36 },

  // Outer wall towers
  { id: "gate-s", name: "South Gate", kind: "wall", tx: 30, tz: 61, w: 4, d: 2, h: 5.5, yaw: 0, doorTx: 32, doorTz: 61 },
  { id: "gate-n", name: "North Gate", kind: "wall", tx: 30, tz: 1, w: 4, d: 2, h: 5.5, yaw: 0, doorTx: 32, doorTz: 3 },
  { id: "nw-cot", name: "North Court", kind: "cottage", tx: 6, tz: 6, w: 5, d: 5, h: 4.8, yaw: 0, doorTx: 8, doorTz: 11 },
  { id: "se-cot", name: "South Court", kind: "cottage", tx: 50, tz: 50, w: 5, d: 5, h: 4.9, yaw: Math.PI, doorTx: 52, doorTz: 50 },
];

const NPC_SEED: Omit<Npc, "destX" | "destZ" | "wait" | "yaw" | "vx" | "vz" | "gait" | "pose">[] = [
  { id: "wren", name: "Wren", role: "ADEPT", x: 34.2, z: 36.4, homeX: 34.2, homeZ: 36.4, line: "Four trails leave the square. Walk them.", wander: true, cloak: 0x141414 },
  { id: "caldew", name: "Wright Caldew", role: "MARKET", x: 14.4, z: 32.2, homeX: 14.4, homeZ: 32.2, line: "The row buys leaves and ledgers. Keep your hands clean.", wander: false, cloak: 0x151515 },
  { id: "vale", name: "Keepmaster Vale", role: "KEEP", x: 32.4, z: 13.6, homeX: 32.4, homeZ: 13.6, line: "The keep is a desk, not a dungeon.", wander: false, cloak: 0x121212 },
  { id: "quill", name: "Scholar Quill", role: "HALL", x: 32.5, z: 53.2, homeX: 32.5, homeZ: 53.2, line: "The Living Book has leaves. Turn them, don't drown.", wander: false, cloak: 0x161616 },
  { id: "moss", name: "Dockwarden Moss", role: "QUAY", x: 53.2, z: 32.4, homeX: 53.2, homeZ: 32.4, line: "Packets wait on the dock. Don't dump the queue.", wander: true, cloak: 0x141414 },
  { id: "reed", name: "Cantor Reed", role: "CHAPEL", x: 39.2, z: 29.4, homeX: 39.2, homeZ: 29.4, line: "A rite is a binding, not a shout.", wander: false, cloak: 0x171717 },
  { id: "fen", name: "Baker Fen", role: "OVEN", x: 28.2, z: 37.5, homeX: 28.2, homeZ: 37.5, line: "Heat is a craft. Bread and packets both.", wander: false, cloak: 0x151515 },
  { id: "lumen", name: "Lumen", role: "LAMP", x: 30.4, z: 34.2, homeX: 30.4, homeZ: 34.2, line: "Keep the lamps honest. Night is a fog.", wander: true, cloak: 0x181818 },
  { id: "ink", name: "Ink", role: "SCRIBE", x: 36.6, z: 39.2, homeX: 36.6, homeZ: 39.2, line: "I copy Drive shelves into the book. Data, not code.", wander: true, cloak: 0x141414 },
  { id: "bramble", name: "Bramble", role: "WARDEN", x: 32.5, z: 44.5, homeX: 32.5, homeZ: 44.5, line: "The gate is a desk. Come and go with a writ.", wander: true, cloak: 0x131313 },
  { id: "pebble", name: "Pebble", role: "WAYFARER", x: 26.8, z: 33.2, homeX: 26.8, homeZ: 33.2, line: "Other wayfarers share the square.", wander: true, cloak: 0x121212 },
  { id: "ash", name: "Ash", role: "WAYFARER", x: 38.4, z: 34.8, homeX: 38.4, homeZ: 34.8, line: "I walk so the square remembers the trails.", wander: true, cloak: 0x101010 },
  { id: "nole", name: "Nole", role: "WAYFARER", x: 22.8, z: 22.8, homeX: 22.8, homeZ: 22.8, line: "The court is quiet if you sit.", wander: true, cloak: 0x141414 },
  { id: "tide", name: "Tide", role: "QUAY", x: 50.6, z: 32.8, homeX: 50.6, homeZ: 32.8, line: "East water holds the queue.", wander: true, cloak: 0x121212 },
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
  streets: Street[];
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

export function groundY(_h = 0): number {
  return 0;
}

export function displayCoord(x: number, z: number): { x: number; z: number } {
  return { x: Math.round(x - PLAZA.x), z: Math.round(z - PLAZA.z) };
}

function hash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function fillRect(
  walk: Uint8Array,
  biomes: Biome[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  mark: 0 | 1,
  biome: Biome,
) {
  const ax = Math.max(0, Math.min(x0, x1));
  const bx = Math.min(TILES - 1, Math.max(x0, x1));
  const az = Math.max(0, Math.min(z0, z1));
  const bz = Math.min(TILES - 1, Math.max(z0, z1));
  for (let tz = az; tz <= bz; tz++) {
    for (let tx = ax; tx <= bx; tx++) {
      const i = idx(tx, tz);
      walk[i] = mark;
      biomes[i] = biome;
    }
  }
}

export function buildWorld(seed = 2730): PapyrusWorld {
  const heights = new Float32Array(CELLS);
  const biomes: Biome[] = new Array(CELLS);
  const walk = new Uint8Array(CELLS);

  heights.fill(0.5);
  biomes.fill("wall");
  walk.fill(0);

  // City floor
  fillRect(walk, biomes, 2, 2, TILES - 3, TILES - 3, 1, "street");
  // Plaza
  fillRect(walk, biomes, 22, 22, 42, 42, 1, "plaza");
  // District courts
  fillRect(walk, biomes, 8, 22, 22, 42, 1, "street"); // market
  fillRect(walk, biomes, 22, 6, 42, 22, 1, "street"); // keep
  fillRect(walk, biomes, 22, 42, 42, 58, 1, "street"); // hall
  fillRect(walk, biomes, 42, 22, 58, 42, 1, "street"); // quay court
  // Grass courts
  fillRect(walk, biomes, 4, 4, 18, 18, 1, "grass");
  fillRect(walk, biomes, 46, 46, 58, 58, 1, "grass");

  // Fountain bowl — not walkable
  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const dx = tx + 0.5 - PLAZA.x;
      const dz = tz + 0.5 - PLAZA.z;
      const d = Math.hypot(dx, dz);
      const i = idx(tx, tz);
      if (d < 4.35) {
        walk[i] = 0;
        biomes[i] = "wall";
      } else if (d < 8.6) {
        walk[i] = 1;
        biomes[i] = "ring";
      }
    }
  }

  // East quay water
  for (let tz = 22; tz <= 44; tz++) {
    for (let tx = 58; tx < TILES; tx++) {
      const i = idx(tx, tz);
      walk[i] = 0;
      biomes[i] = "water";
      heights[i] = WATER;
    }
  }
  // Dock walkable planks over water
  fillRect(walk, biomes, 56, 24, 61, 27, 1, "street");
  fillRect(walk, biomes, 56, 36, 61, 39, 1, "street");
  fillRect(walk, biomes, 54, 30, 57, 34, 1, "street");

  // South wilds water
  fillRect(walk, biomes, 40, 60, 62, 63, 0, "water");
  for (let tz = 60; tz < TILES; tz++) {
    for (let tx = 40; tx < TILES; tx++) {
      heights[idx(tx, tz)] = WATER;
    }
  }

  for (const b of BUILDINGS) {
    if (b.kind === "stall" || b.kind === "dock") continue;
    for (let oz = 0; oz < b.d; oz++) {
      for (let ox = 0; ox < b.w; ox++) {
        const tx = b.tx + ox;
        const tz = b.tz + oz;
        if (!inBounds(tx, tz)) continue;
        const i = idx(tx, tz);
        if (tx === b.doorTx && tz === b.doorTz) {
          walk[i] = 1;
          biomes[i] = biomes[i] === "water" ? "street" : biomes[i];
          continue;
        }
        walk[i] = 0;
        if (biomes[i] !== "water") biomes[i] = "wall";
      }
    }
    if (inBounds(b.doorTx, b.doorTz)) {
      walk[idx(b.doorTx, b.doorTz)] = 1;
    }
  }

  // Perimeter wall
  for (let t = 0; t < TILES; t++) {
    for (const [tx, tz] of [
      [t, 0],
      [t, 1],
      [t, TILES - 1],
      [t, TILES - 2],
      [0, t],
      [1, t],
      [TILES - 1, t],
      [TILES - 2, t],
    ] as const) {
      if (tx === 31 || tx === 32 || tz === 31 || tz === 32) {
        if (tz <= 2 || tz >= TILES - 3) continue; // north/south gates
      }
      walk[idx(tx, tz)] = 0;
      biomes[idx(tx, tz)] = "wall";
    }
  }

  const props: Prop[] = [];
  const ringLamps = 10;
  for (let i = 0; i < ringLamps; i++) {
    const a = (i / ringLamps) * Math.PI * 2 + 0.2;
    const r = 6.6;
    const x = PLAZA.x + Math.cos(a) * r;
    const z = PLAZA.z + Math.sin(a) * r;
    props.push({ x, z, tx: Math.floor(x), tz: Math.floor(z), kind: "lamp", yaw: a });
  }
  const extraLamps: [number, number][] = [
    [18.5, 32.5],
    [46.5, 32.5],
    [32.5, 18.5],
    [32.5, 46.5],
    [16.5, 24.5],
    [48.5, 24.5],
    [24.5, 16.5],
    [40.5, 48.5],
    [50.5, 30.5],
    [14.5, 38.5],
  ];
  for (const [x, z] of extraLamps) {
    props.push({ x, z, tx: Math.floor(x), tz: Math.floor(z), kind: "lamp", yaw: 0 });
  }

  const benches: [number, number, number][] = [
    [28.2, 27.4, 0.4],
    [36.6, 27.2, -0.4],
    [28.4, 38.2, 0.2],
    [36.8, 38.0, -0.3],
    [26.2, 32.5, Math.PI / 2],
    [38.8, 32.6, Math.PI / 2],
    [32.5, 26.2, 0],
    [24.5, 30.2, Math.PI / 2],
  ];
  for (const [x, z, yaw] of benches) {
    props.push({ x, z, tx: Math.floor(x), tz: Math.floor(z), kind: "bench", yaw });
  }

  const crates: [number, number][] = [
    [29.4, 29.1],
    [35.8, 28.8],
    [29.1, 36.4],
    [36.2, 36.8],
    [27.2, 34.6],
    [38.4, 30.2],
    [51.5, 31.2],
    [52.2, 34.4],
    [13.4, 30.6],
    [15.2, 34.8],
    [40.6, 40.2],
    [24.8, 40.6],
  ];
  for (const [x, z] of crates) {
    props.push({ x, z, tx: Math.floor(x), tz: Math.floor(z), kind: "crate", yaw: hash(x, z) * 2 });
  }

  const trees: [number, number][] = [
    [18.5, 18.5],
    [20.5, 16.5],
    [46.5, 18.5],
    [18.5, 46.5],
    [46.5, 48.5],
    [44.5, 46.5],
    [20.8, 40.5],
    [42.8, 22.8],
  ];
  for (const [x, z] of trees) {
    props.push({ x, z, tx: Math.floor(x), tz: Math.floor(z), kind: "tree", yaw: 0 });
  }

  props.push(
    { x: 16.5, z: 28.5, tx: 16, tz: 28, kind: "flag", yaw: 0 },
    { x: 16.5, z: 36.5, tx: 16, tz: 36, kind: "flag", yaw: 0 },
  );

  const pickups: Pickup[] = [];
  const spots: [number, number, Pickup["kind"]][] = [
    [26.5, 30.5, "leaf"],
    [38.5, 30.5, "leaf"],
    [26.5, 38.5, "note"],
    [38.5, 38.5, "coin"],
    [18.5, 32.5, "leaf"],
    [46.5, 32.5, "note"],
    [32.5, 18.5, "coin"],
    [32.5, 48.5, "leaf"],
    [14.5, 28.5, "note"],
    [52.5, 28.5, "coin"],
    [24.5, 24.5, "leaf"],
    [40.5, 40.5, "note"],
  ];
  spots.forEach(([x, z, kind], i) => {
    pickups.push({ id: `p${i}`, x, z, kind, taken: false });
  });

  const npcs: Npc[] = NPC_SEED.map((s) => ({
    ...s,
    destX: s.x,
    destZ: s.z,
    yaw: 0,
    vx: 0,
    vz: 0,
    gait: 0,
    pose: "idle",
    wait: 0.4 + hash(s.x * 10, s.z * 10 + seed) * 2,
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
    streets: STREETS,
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
  if (!inBounds(tx, tz)) return "wall";
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

export function surfaceY(_world: PapyrusWorld, _x: number, _z: number): number {
  return 0;
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
    if (dx * dx + dz * dz < 5.4 * 5.4) return m;
  }
  return null;
}

export function streetAt(x: number, z: number): string | null {
  const { tx, tz } = worldToTile(x, z);
  for (const s of STREETS) {
    if (tx >= s.x0 && tx <= s.x1 && tz >= s.z0 && tz <= s.z1) return s.name;
  }
  return null;
}

export function locationName(world: PapyrusWorld, x: number, z: number): string {
  const mark = landmarkAt(x, z);
  if (mark) return mark.name;
  const st = streetAt(x, z);
  if (st) return st;
  const biome = sampleBiome(world, x, z);
  if (biome === "water") return "South Wilds";
  if (biome === "grass") return "Court";
  return "Reedhaven";
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

export function nearestProp(
  world: PapyrusWorld,
  x: number,
  z: number,
  kind: Prop["kind"],
  max = 1.35,
): Prop | null {
  let best: Prop | null = null;
  let bestD = max * max;
  for (const p of world.props) {
    if (p.kind !== kind) continue;
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export function nearestPickup(world: PapyrusWorld, x: number, z: number, max = 1.2): Pickup | null {
  let best: Pickup | null = null;
  let bestD = max * max;
  for (const p of world.pickups) {
    if (p.taken) continue;
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export function tickNpcs(world: PapyrusWorld, dt: number, player?: { x: number; z: number }) {
  for (const n of world.npcs) {
    if (n.pose === "sit" || n.pose === "talk") {
      n.vx = 0;
      n.vz = 0;
      n.gait = 0;
      n.wait -= dt;
      if (n.pose === "talk" && n.wait <= 0) n.pose = "idle";
      continue;
    }
    n.wait -= dt;
    if (n.wander && n.wait <= 0) {
      const ang = hash(n.x * 9 + n.wait, n.z * 7) * Math.PI * 2;
      const rad = 1.1 + hash(n.z, n.x) * 2.6;
      n.destX = n.homeX + Math.cos(ang) * rad;
      n.destZ = n.homeZ + Math.sin(ang) * rad;
      n.wait = 2.2 + hash(n.destX, n.destZ) * 3.5;
    }
    const dx = n.destX - n.x;
    const dz = n.destZ - n.z;
    const dist = Math.hypot(dx, dz);
    let ax = 0;
    let az = 0;
    if (dist > 0.12) {
      ax = dx / dist;
      az = dz / dist;
      n.yaw = Math.atan2(-dx, -dz);
    }
    const moved = integrateBody(
      { x: n.x, z: n.z, vx: n.vx, vz: n.vz },
      ax,
      az,
      dt,
      world.walk,
      TILES,
      1.15,
    );
    n.x = moved.x;
    n.z = moved.z;
    n.vx = moved.vx;
    n.vz = moved.vz;
    const sp = Math.hypot(n.vx, n.vz);
    n.gait += sp * 7.2 * dt;
    n.pose = sp > 0.12 ? "walk" : "idle";
    if (player) {
      const sep = Math.hypot(n.x - player.x, n.z - player.z);
      if (sep < BODY_R + NPC_R && sep > 1e-4) {
        const k = (BODY_R + NPC_R - sep) / sep;
        n.x += (n.x - player.x) * k;
        n.z += (n.z - player.z) * k;
      }
    }
  }
}

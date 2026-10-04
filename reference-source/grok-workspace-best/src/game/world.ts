import { createNoise2D } from "simplex-noise";
import { hashSeed, mulberry32, randRange } from "./rng";

export const TILES = 96;
export const TILE_SIZE = 4;
export const WORLD = TILES * TILE_SIZE;
export const HALF = WORLD / 2;
export const WATER_LEVEL = 1.05;
export const WORLD_SEED = "wayfarer-highland-01";

export type LandmarkId = "west" | "east" | "south" | "north";

export type Landmark = {
  id: LandmarkId;
  name: string;
  hint: string;
  arrive: string;
  x: number;
  z: number;
  radius: number;
};

export type PropInstance = {
  x: number;
  y: number;
  z: number;
  rot: number;
  scale: number;
  kind: number;
};

export type Pickup = {
  id: string;
  x: number;
  z: number;
  kind: "bloom" | "wood" | "stone";
};

export type Biome = "water" | "shore" | "meadow" | "forest" | "ridge" | "path";

const LANDMARKS_TILE: Record<LandmarkId, { tx: number; tz: number }> = {
  west: { tx: 10, tz: 48 },
  east: { tx: 86, tz: 48 },
  south: { tx: 48, tz: 86 },
  north: { tx: 48, tz: 10 },
};

function fbm(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

function tileToWorld(t: number): number {
  return t * TILE_SIZE - HALF + TILE_SIZE * 0.5;
}

function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

function pathDistance(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const len2 = abx * abx + abz * abz || 1;
  let t = ((px - ax) * abx + (pz - az) * abz) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + abx * t;
  const qz = az + abz * t;
  return Math.hypot(px - qx, pz - qz);
}

export type WorldData = {
  heights: Float32Array;
  biomes: Uint8Array;
  landmarks: Landmark[];
  pines: PropInstance[];
  deciduous: PropInstance[];
  rocks: PropInstance[];
  flowers: PropInstance[];
  pickups: Pickup[];
  npc: { x: number; z: number; yaw: number };
  spawn: { x: number; z: number };
};

const BIOME_CODE: Record<Biome, number> = {
  water: 0,
  shore: 1,
  meadow: 2,
  forest: 3,
  ridge: 4,
  path: 5,
};

export const BIOME_NAME: Biome[] = ["water", "shore", "meadow", "forest", "ridge", "path"];

export const LANDMARK_LORE: Record<LandmarkId, { name: string; hint: string; arrive: string }> = {
  west: {
    name: "Western Shore",
    hint: "The trail drinks the lake.",
    arrive: "You touch the western shore. Cold water knows your name.",
  },
  east: {
    name: "Eastern Rise",
    hint: "The trail climbs the light.",
    arrive: "You stand on the eastern rise. Wind unspools the highland.",
  },
  south: {
    name: "Southern Gate",
    hint: "The trail ends at two posts.",
    arrive: "You reach the southern gate. Old wood still keeps a watch.",
  },
  north: {
    name: "North Bridge",
    hint: "The trail crosses black water.",
    arrive: "You cross the north bridge. The river talks underfoot.",
  },
};

export function buildWorld(seed = WORLD_SEED): WorldData {
  const elevRng = mulberry32(hashSeed(seed + ":elev"));
  const moistRng = mulberry32(hashSeed(seed + ":moist"));
  const propRng = mulberry32(hashSeed(seed + ":prop"));
  const elevNoise = createNoise2D(elevRng);
  const moistNoise = createNoise2D(moistRng);
  const warpNoise = createNoise2D(mulberry32(hashSeed(seed + ":warp")));

  const heights = new Float32Array(TILES * TILES);
  const biomes = new Uint8Array(TILES * TILES);

  const cx = (TILES - 1) * 0.5;
  const landmarks: Landmark[] = (Object.keys(LANDMARKS_TILE) as LandmarkId[]).map((id) => {
    const t = LANDMARKS_TILE[id];
    return {
      id,
      ...LANDMARK_LORE[id],
      x: tileToWorld(t.tx),
      z: tileToWorld(t.tz),
      radius: id === "east" ? 10 : 8,
    };
  });

  const center = { x: 0, z: 0 };
  const pathEnds = landmarks.map((l) => ({ x: l.x, z: l.z }));

  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const i = tz * TILES + tx;
      const wx = tileToWorld(tx);
      const wz = tileToWorld(tz);
      const nx = wx / WORLD;
      const nz = wz / WORLD;
      const warp = 0.18 * warpNoise(nx * 2.4, nz * 2.4);
      let e = fbm(elevNoise, (nx + warp) * 2.8, (nz + warp) * 2.8, 5);
      e = (e + 1) * 0.5;
      e = Math.pow(e, 1.15);

      const dx = (tx - cx) / cx;
      const dz = (tz - cx) / cx;
      const radial = Math.sqrt(dx * dx + dz * dz);
      const island = Math.max(0, 1 - Math.pow(Math.min(1, radial * 0.92), 2.4));
      e *= island;

      // Crossroads plateau
      const dCenter = Math.hypot(wx, wz);
      if (dCenter < 18) {
        const k = 1 - dCenter / 18;
        e = e * (1 - k * 0.55) + 0.38 * k;
      }

      // Eastern rise
      const east = landmarks[1];
      const dEast = Math.hypot(wx - east.x, wz - east.z);
      if (dEast < 36) {
        e += (1 - dEast / 36) * 0.55;
      }

      // Northern river trench
      const river = Math.exp(-((wz + 72) * (wz + 72)) / 180) * Math.exp(-(wx * wx) / 14000);
      e -= river * 0.62;

      // Western lake depression
      const west = landmarks[0];
      const dWest = Math.hypot(wx - west.x, wz - west.z);
      if (dWest < 28) e -= (1 - dWest / 28) * 0.42;

      e = Math.max(0, e);
      const height = e * 16.5;
      heights[i] = height;

      let onPath = false;
      for (const end of pathEnds) {
        if (pathDistance(wx, wz, center.x, center.z, end.x, end.z) < 2.4) {
          onPath = true;
          break;
        }
      }
      if (dCenter < 6) onPath = true;

      const moist = (fbm(moistNoise, nx * 3.1, nz * 3.1, 4) + 1) * 0.5;
      let biome: Biome;
      if (height < WATER_LEVEL) biome = "water";
      else if (height < WATER_LEVEL + 0.85) biome = "shore";
      else if (onPath) biome = "path";
      else if (height > 10.5) biome = "ridge";
      else if (moist > 0.46 && height > 2.2) biome = "forest";
      else biome = "meadow";
      biomes[i] = BIOME_CODE[biome];
    }
  }

  // Flatten paths a little
  for (let tz = 1; tz < TILES - 1; tz++) {
    for (let tx = 1; tx < TILES - 1; tx++) {
      const i = tz * TILES + tx;
      if (biomes[i] === BIOME_CODE.path) {
        heights[i] = Math.max(WATER_LEVEL + 0.35, heights[i] * 0.86 + 2.2 * 0.14);
      }
    }
  }

  const pines: PropInstance[] = [];
  const deciduous: PropInstance[] = [];
  const rocks: PropInstance[] = [];
  const flowers: PropInstance[] = [];
  const pickups: Pickup[] = [];

  for (let tz = 2; tz < TILES - 2; tz++) {
    for (let tx = 2; tx < TILES - 2; tx++) {
      const i = tz * TILES + tx;
      const biome = biomes[i];
      if (biome === BIOME_CODE.water || biome === BIOME_CODE.path) continue;
      const wx = tileToWorld(tx) + randRange(propRng, -1.2, 1.2);
      const wz = tileToWorld(tz) + randRange(propRng, -1.2, 1.2);
      const y = sampleHeight(heights, wx, wz);
      if (y < WATER_LEVEL + 0.25) continue;
      const nearLandmark = landmarks.some((l) => dist2(wx, wz, l.x, l.z) < l.radius * l.radius);
      const r = propRng();

      if (biome === BIOME_CODE.forest && r < 0.55 && !nearLandmark) {
        const pine = propRng() < 0.62;
        const inst: PropInstance = {
          x: wx,
          y,
          z: wz,
          rot: propRng() * Math.PI * 2,
          scale: randRange(propRng, 0.78, 1.35),
          kind: pine ? 0 : 1,
        };
        (pine ? pines : deciduous).push(inst);
      } else if (biome === BIOME_CODE.ridge && r < 0.28) {
        rocks.push({
          x: wx,
          y,
          z: wz,
          rot: propRng() * Math.PI * 2,
          scale: randRange(propRng, 0.5, 1.6),
          kind: 0,
        });
      } else if (biome === BIOME_CODE.meadow && r < 0.16) {
        flowers.push({
          x: wx,
          y,
          z: wz,
          rot: propRng() * Math.PI * 2,
          scale: randRange(propRng, 0.7, 1.3),
          kind: (propRng() * 3) | 0,
        });
      } else if (biome === BIOME_CODE.shore && r < 0.08) {
        rocks.push({
          x: wx,
          y,
          z: wz,
          rot: propRng() * Math.PI * 2,
          scale: randRange(propRng, 0.4, 0.9),
          kind: 1,
        });
      }

      if (!nearLandmark && r > 0.985 && y > WATER_LEVEL + 0.6) {
        const kinds: Pickup["kind"][] = ["bloom", "wood", "stone"];
        pickups.push({
          id: `p-${tx}-${tz}`,
          x: wx,
          z: wz,
          kind: kinds[(propRng() * 3) | 0]!,
        });
      }
    }
  }

  return {
    heights,
    biomes,
    landmarks,
    pines,
    deciduous,
    rocks,
    flowers,
    pickups,
    npc: { x: 9.5, z: -14, yaw: 0.6 },
    spawn: { x: 0, z: 0 },
  };
}

export function sampleHeight(heights: Float32Array, x: number, z: number): number {
  const fx = (x + HALF) / TILE_SIZE - 0.5;
  const fz = (z + HALF) / TILE_SIZE - 0.5;
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const x1 = x0 + 1;
  const z1 = z0 + 1;
  const tx = fx - x0;
  const tz = fz - z0;
  const h = (ix: number, iz: number) => {
    if (ix < 0 || iz < 0 || ix >= TILES || iz >= TILES) return WATER_LEVEL - 1;
    return heights[iz * TILES + ix]!;
  };
  const a = h(x0, z0);
  const b = h(x1, z0);
  const c = h(x0, z1);
  const d = h(x1, z1);
  return a * (1 - tx) * (1 - tz) + b * tx * (1 - tz) + c * (1 - tx) * tz + d * tx * tz;
}

export function sampleBiome(biomes: Uint8Array, x: number, z: number): Biome {
  const tx = Math.round((x + HALF) / TILE_SIZE - 0.5);
  const tz = Math.round((z + HALF) / TILE_SIZE - 0.5);
  if (tx < 0 || tz < 0 || tx >= TILES || tz >= TILES) return "water";
  return BIOME_NAME[biomes[tz * TILES + tx]!] ?? "meadow";
}

export function tileCoords(x: number, z: number): { tx: number; tz: number } {
  return {
    tx: Math.round((x + HALF) / TILE_SIZE),
    tz: Math.round((z + HALF) / TILE_SIZE),
  };
}

export function worldIndex(tx: number, tz: number): number {
  return tz * TILES + tx;
}

let cached: WorldData | null = null;
export function getWorld(): WorldData {
  cached ??= buildWorld();
  return cached;
}

export const BIOME_LABEL: Record<Biome, string> = {
  water: "Lake",
  shore: "Shore",
  meadow: "Meadow",
  forest: "Forest",
  ridge: "Rise",
  path: "Trail",
};

/**
 * Project Copper Lantern — enlarged realm/world expansion.
 *
 * Decorations are deterministic so the world feels varied while remaining
 * reproducible for tests, multiplayer snapshots, and save restoration.
 */

import type { GardenTile } from "./welcome-garden/welcome-garden-slice";

export type RealmBiome = "welcome-garden" | "frostcrown" | "sunwash-coast" | "gloamfen" | "redglass" | "highland" | "deepwood" | "ruinfield";
export type RealmObjectKind = "boulder" | "ancient-tree" | "palm" | "cactus" | "fungus" | "reed" | "fallen-log" | "crystal" | "ruin-column" | "pond-ripple" | "grass-clump" | "shrub" | "bridge-post" | "snow-drift";

export type RealmBounds = Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;

export type RealmPhysicalProperties = Readonly<{
  gravity: number;
  defaultFriction: number;
  defaultTraction: number;
  waterDensity: number;
  windVector: Readonly<{ x: number; y: number }>;
  temperatureCelsius: Readonly<{ min: number; max: number }>;
  maximumWalkableGrade: number;
  maximumBridgeLoad: number;
  minimumCaveClearance: number;
  snowAccumulation: number;
  worldUnitsPerTile: number;
}>;

export type RealmObject = Readonly<{
  id: string;
  kind: RealmObjectKind;
  tile: GardenTile;
  biome: RealmBiome;
  elevation: number;
  rotation: number;
  scale: number;
  collision: boolean;
  interaction: "none" | "inspect" | "crossing" | "harvest";
  materialKey: string;
}>;

export const EXPANDED_REALM_BOUNDS: RealmBounds = {
  minX: -64,
  minY: -24,
  maxX: 64,
  maxY: 80,
};

export const REALM_PHYSICAL_PROPERTIES: RealmPhysicalProperties = {
  gravity: 9.81,
  defaultFriction: 0.72,
  defaultTraction: 0.84,
  waterDensity: 1.0,
  windVector: { x: 0.18, y: -0.06 },
  temperatureCelsius: { min: -18, max: 38 },
  maximumWalkableGrade: 0.72,
  maximumBridgeLoad: 900,
  minimumCaveClearance: 1.8,
  snowAccumulation: 0.16,
  worldUnitsPerTile: 1,
};

const BIOME_OBJECTS: Readonly<Record<RealmBiome, readonly RealmObjectKind[]>> = {
  "welcome-garden": ["grass-clump", "shrub", "boulder", "pond-ripple", "bridge-post"],
  frostcrown: ["boulder", "snow-drift", "crystal", "ruin-column"],
  "sunwash-coast": ["palm", "grass-clump", "boulder", "pond-ripple", "shrub"],
  gloamfen: ["ancient-tree", "reed", "fungus", "fallen-log", "pond-ripple", "bridge-post"],
  redglass: ["cactus", "fungus", "shrub", "boulder", "crystal", "ruin-column"],
  highland: ["boulder", "grass-clump", "shrub", "snow-drift"],
  deepwood: ["ancient-tree", "fungus", "fallen-log", "reed", "shrub"],
  ruinfield: ["ruin-column", "boulder", "crystal", "grass-clump", "shrub"],
};

const MATERIALS: Readonly<Record<RealmObjectKind, string>> = {
  boulder: "weathered-stone",
  "ancient-tree": "wet-bark-and-moss",
  palm: "sunwash-palmwood",
  cactus: "redglass-spined-green",
  fungus: "gloam-mycorrhiza",
  reed: "marsh-reed-and-dew",
  "fallen-log": "rotted-heartwood",
  crystal: "cold-mineral-faceted",
  "ruin-column": "old-brass-stone",
  "pond-ripple": "reflective-water",
  "grass-clump": "windgrass",
  shrub: "thornleaf-shrub",
  "bridge-post": "bridge-timber",
  "snow-drift": "compressed-snow",
};

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random01(seed: number): number {
  let value = seed + 0x6D2B79F5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function objectCollision(kind: RealmObjectKind): boolean {
  return !["pond-ripple", "grass-clump", "snow-drift", "fungus"].includes(kind);
}

function objectInteraction(kind: RealmObjectKind): RealmObject["interaction"] {
  if (kind === "bridge-post") return "crossing";
  if (["crystal", "ruin-column", "ancient-tree"].includes(kind)) return "inspect";
  if (["fungus", "cactus", "palm"].includes(kind)) return "harvest";
  return "none";
}

export function generateRealmDecorations(seedText: string, density = 0.42): RealmObject[] {
  const output: RealmObject[] = [];
  const regions: readonly { biome: RealmBiome; minX: number; minY: number; maxX: number; maxY: number }[] = [
    { biome: "welcome-garden", minX: -4, minY: 4, maxX: 16, maxY: 20 },
    { biome: "frostcrown", minX: 5, minY: 20, maxX: 20, maxY: 32 },
    { biome: "sunwash-coast", minX: 0, minY: 33, maxX: 24, maxY: 44 },
    { biome: "gloamfen", minX: 25, minY: 4, maxX: 40, maxY: 30 },
    { biome: "redglass", minX: -20, minY: 3, maxX: -1, maxY: 33 },
    { biome: "highland", minX: -48, minY: -18, maxX: -22, maxY: 8 },
    { biome: "deepwood", minX: 42, minY: -14, maxX: 62, maxY: 20 },
    { biome: "ruinfield", minX: -58, minY: 36, maxX: -26, maxY: 72 },
  ];
  for (const region of regions) {
    const kinds = BIOME_OBJECTS[region.biome];
    const count = Math.max(8, Math.floor((region.maxX - region.minX + 1) * (region.maxY - region.minY + 1) * density * 0.06));
    for (let i = 0; i < count; i += 1) {
      const seed = hash32(`${seedText}:${region.biome}:${i}`);
      const kind = kinds[Math.floor(random01(seed) * kinds.length) % kinds.length];
      const tile = {
        x: region.minX + Math.floor(random01(seed + 1) * (region.maxX - region.minX + 1)),
        y: region.minY + Math.floor(random01(seed + 2) * (region.maxY - region.minY + 1)),
      };
      output.push({
        id: `realm-object-${region.biome}-${i}`,
        kind,
        tile,
        biome: region.biome,
        elevation: Math.round(random01(seed + 3) * 18 * 100) / 100,
        rotation: random01(seed + 4) * Math.PI * 2,
        scale: 0.7 + random01(seed + 5) * 0.9,
        collision: objectCollision(kind),
        interaction: objectInteraction(kind),
        materialKey: MATERIALS[kind],
      });
    }
  }
  return output;
}

export function isWithinExpandedRealm(tile: GardenTile): boolean {
  return tile.x >= EXPANDED_REALM_BOUNDS.minX && tile.x <= EXPANDED_REALM_BOUNDS.maxX && tile.y >= EXPANDED_REALM_BOUNDS.minY && tile.y <= EXPANDED_REALM_BOUNDS.maxY;
}

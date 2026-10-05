/**
 * Project Copper Lantern — original western xeriscape frontier.
 */

import type { GardenTile } from "./welcome-garden/welcome-garden-slice";

export type XeriscapeTerrain =
  | "dry-scrub"
  | "cactus-grove"
  | "fungal-basin"
  | "shrubland"
  | "palm-oasis"
  | "ravine"
  | "mountain"
  | "cliff"
  | "quarry"
  | "canal"
  | "pond"
  | "plateau"
  | "canyon";

export type XeriscapeLandmark = Readonly<{
  id: string;
  label: string;
  tile: GardenTile;
  terrain: XeriscapeTerrain;
  walkable: boolean;
}>;

export type WesternXeriscapeExpansion = Readonly<{
  districtId: "redglass-xeriscape";
  bounds: Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;
  atmosphere: Readonly<{
    mood: "sun-baked and wind-carved";
    heatHaze: number;
    dustLevel: number;
    moistureTextureKey: string;
  }>;
  landmarks: readonly XeriscapeLandmark[];
}>;

export const REDGLASS_XERISCAPE: WesternXeriscapeExpansion = {
  districtId: "redglass-xeriscape",
  bounds: { minX: -20, minY: 3, maxX: -1, maxY: 33 },
  atmosphere: {
    mood: "sun-baked and wind-carved",
    heatHaze: 0.62,
    dustLevel: 0.7,
    moistureTextureKey: "copper-lantern-redglass-drystone-cracked-earth",
  },
  landmarks: [
    { id: "redglass-west-gate", label: "Redglass West Gate", tile: { x: -1, y: 14 }, terrain: "dry-scrub", walkable: true },
    { id: "redglass-cactus-grove", label: "Thornlight Cactus Grove", tile: { x: -6, y: 10 }, terrain: "cactus-grove", walkable: true },
    { id: "redglass-fungal-basin", label: "Sunken Fungal Basin", tile: { x: -10, y: 22 }, terrain: "fungal-basin", walkable: true },
    { id: "redglass-palm-garden", label: "Glasswind Palm Garden", tile: { x: -15, y: 8 }, terrain: "palm-oasis", walkable: true },
    { id: "redglass-quarry", label: "Brassvein Quarry", tile: { x: -8, y: 14 }, terrain: "quarry", walkable: true },
    { id: "redglass-canal", label: "Cutstone Canal", tile: { x: -4, y: 27 }, terrain: "canal", walkable: false },
    { id: "redglass-pond", label: "Blueglass Pond", tile: { x: -14, y: 26 }, terrain: "pond", walkable: false },
    { id: "redglass-ravine", label: "Longbone Ravine", tile: { x: -12, y: 15 }, terrain: "ravine", walkable: true },
    { id: "redglass-cliff", label: "Emberwall Cliffs", tile: { x: -18, y: 12 }, terrain: "cliff", walkable: true },
    { id: "redglass-plateau", label: "High Sun Plateau", tile: { x: -16, y: 25 }, terrain: "plateau", walkable: true },
    { id: "redglass-canyon", label: "Redglass Canyon", tile: { x: -19, y: 30 }, terrain: "canyon", walkable: true },
  ],
};

export function xeriscapeTerrainAt(tile: GardenTile): XeriscapeTerrain | undefined {
  if (tile.x < REDGLASS_XERISCAPE.bounds.minX || tile.x > REDGLASS_XERISCAPE.bounds.maxX || tile.y < REDGLASS_XERISCAPE.bounds.minY || tile.y > REDGLASS_XERISCAPE.bounds.maxY) return undefined;
  if (tile.x <= -17 && tile.y >= 9 && tile.y <= 15) return "cliff";
  if (tile.x <= -17 && tile.y >= 27) return "canyon";
  if (tile.x >= -17 && tile.x <= -14 && tile.y >= 22 && tile.y <= 27) return "plateau";
  if (tile.x >= -16 && tile.x <= -13 && tile.y >= 6 && tile.y <= 10) return "palm-oasis";
  if (tile.x >= -8 && tile.x <= -4 && tile.y >= 8 && tile.y <= 12) return "cactus-grove";
  if (tile.x >= -11 && tile.x <= -8 && tile.y >= 20 && tile.y <= 23) return "fungal-basin";
  if (tile.x >= -10 && tile.x <= -6 && tile.y >= 12 && tile.y <= 16) return "quarry";
  if (tile.x === -12 && tile.y >= 12 && tile.y <= 18) return "ravine";
  if (tile.x === -4 && tile.y >= 24 && tile.y <= 30) return "canal";
  if (tile.x >= -16 && tile.x <= -12 && tile.y >= 24 && tile.y <= 28) return "pond";
  return "dry-scrub";
}

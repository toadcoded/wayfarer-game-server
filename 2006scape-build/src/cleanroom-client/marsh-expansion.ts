/**
 * Project Copper Lantern — original eastern Gloamfen marsh district.
 */

import type { GardenTile } from "./welcome-garden/welcome-garden-slice";

export type MarshTerrain =
  | "moisture-soil"
  | "thick-forest"
  | "cave"
  | "creek"
  | "river"
  | "bridge"
  | "stream"
  | "hill"
  | "flat-grassland";

export type MarshLandmark = Readonly<{
  id: string;
  label: string;
  tile: GardenTile;
  terrain: MarshTerrain;
  walkable: boolean;
}>;

export type EasternMarshExpansion = Readonly<{
  districtId: "gloamfen-marsh";
  bounds: Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;
  atmosphere: Readonly<{
    mood: "gloomy";
    humidity: number;
    fogDensity: number;
    rainfall: "drizzle";
    moistureTextureKey: string;
  }>;
  landmarks: readonly MarshLandmark[];
}>;

export const GLOAMFEN_MARSH: EasternMarshExpansion = {
  districtId: "gloamfen-marsh",
  bounds: { minX: 25, minY: 4, maxX: 40, maxY: 30 },
  atmosphere: {
    mood: "gloomy",
    humidity: 0.94,
    fogDensity: 0.72,
    rainfall: "drizzle",
    moistureTextureKey: "copper-lantern-gloamfen-wet-bark-moss-mud",
  },
  landmarks: [
    { id: "gloamfen-east-gate", label: "Gloamfen East Gate", tile: { x: 25, y: 12 }, terrain: "moisture-soil", walkable: true },
    { id: "gloamfen-thickwood", label: "Thickwood Forest", tile: { x: 29, y: 10 }, terrain: "thick-forest", walkable: true },
    { id: "gloamfen-echo-cave", label: "Echo-Mire Cave", tile: { x: 34, y: 8 }, terrain: "cave", walkable: true },
    { id: "gloamfen-creek-bridge", label: "Creekroot Bridge", tile: { x: 31, y: 15 }, terrain: "bridge", walkable: true },
    { id: "gloamfen-river-bridge", label: "Blackwater River Bridge", tile: { x: 37, y: 19 }, terrain: "bridge", walkable: true },
    { id: "gloamfen-stream", label: "Whisperstream", tile: { x: 28, y: 22 }, terrain: "stream", walkable: false },
    { id: "gloamfen-river", label: "Blackwater River", tile: { x: 37, y: 19 }, terrain: "river", walkable: false },
    { id: "gloamfen-hills", label: "Mireback Hills", tile: { x: 34, y: 25 }, terrain: "hill", walkable: true },
    { id: "gloamfen-grasslands", label: "Duskgrass Flats", tile: { x: 27, y: 28 }, terrain: "flat-grassland", walkable: true },
  ],
};

export function marshTerrainAt(tile: GardenTile): MarshTerrain | undefined {
  if (tile.x < GLOAMFEN_MARSH.bounds.minX || tile.x > GLOAMFEN_MARSH.bounds.maxX || tile.y < GLOAMFEN_MARSH.bounds.minY || tile.y > GLOAMFEN_MARSH.bounds.maxY) return undefined;
  if (tile.x >= 28 && tile.x <= 31 && tile.y >= 6 && tile.y <= 13) return "thick-forest";
  if (tile.x >= 33 && tile.x <= 35 && tile.y >= 7 && tile.y <= 10) return "cave";
  if (tile.x === 31 && tile.y >= 14 && tile.y <= 16) return "bridge";
  if (tile.x === 37 && tile.y >= 18 && tile.y <= 20) return "bridge";
  if (tile.x === 37 && tile.y >= 4 && tile.y <= 17) return "river";
  if (tile.x === 28 && tile.y >= 14 && tile.y <= 27) return "stream";
  if (tile.x >= 32 && tile.x <= 36 && tile.y >= 23 && tile.y <= 28) return "hill";
  if (tile.x >= 25 && tile.x <= 29 && tile.y >= 26 && tile.y <= 30) return "flat-grassland";
  return "moisture-soil";
}

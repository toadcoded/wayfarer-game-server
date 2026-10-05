/**
 * Project Copper Lantern — original southern beach and oasis district.
 */

import type { GardenTile } from "./welcome-garden/welcome-garden-slice";

export type BeachZone = "sand" | "waterline" | "oasis" | "oasis-pool";

export type BeachLandmark = Readonly<{
  id: string;
  label: string;
  tile: GardenTile;
  zone: BeachZone;
  walkable: boolean;
}>;

export type SouthernBeachExpansion = Readonly<{
  districtId: "sunwash-coast";
  baseTile: GardenTile;
  shorelineTile: GardenTile;
  oasisTile: GardenTile;
  oasisPoolTile: GardenTile;
  sandBounds: Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;
  waterline: Readonly<{ tileY: number; label: "Sunwash Tidewater" }>;
  landmarks: readonly BeachLandmark[];
}>;

export const SUNWASH_BEACH: SouthernBeachExpansion = {
  districtId: "sunwash-coast",
  baseTile: { x: 12, y: 32 },
  shorelineTile: { x: 12, y: 40 },
  oasisTile: { x: 7, y: 38 },
  oasisPoolTile: { x: 7, y: 39 },
  sandBounds: { minX: 0, minY: 33, maxX: 24, maxY: 44 },
  waterline: { tileY: 44, label: "Sunwash Tidewater" },
  landmarks: [
    { id: "sunwash-sand-gate", label: "Sunwash Sand Gate", tile: { x: 12, y: 33 }, zone: "sand", walkable: true },
    { id: "sunwash-palm-oasis", label: "Palmglass Oasis", tile: { x: 7, y: 38 }, zone: "oasis", walkable: true },
    { id: "sunwash-oasis-pool", label: "Palmglass Pool", tile: { x: 7, y: 39 }, zone: "oasis-pool", walkable: true },
    { id: "sunwash-tidewater", label: "Sunwash Tidewater", tile: { x: 12, y: 44 }, zone: "waterline", walkable: false },
  ],
};

export function beachZoneAt(tile: GardenTile): BeachZone | undefined {
  if (tile.y < SUNWASH_BEACH.sandBounds.minY || tile.y > SUNWASH_BEACH.sandBounds.maxY) return undefined;
  if (tile.y === SUNWASH_BEACH.waterline.tileY) return "waterline";
  if (tile.x === SUNWASH_BEACH.oasisTile.x && tile.y === SUNWASH_BEACH.oasisPoolTile.y) return "oasis-pool";
  if (tile.x >= 4 && tile.x <= 10 && tile.y >= 36 && tile.y <= 40) return "oasis";
  return "sand";
}

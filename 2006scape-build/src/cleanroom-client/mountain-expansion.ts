/**
 * Project Copper Lantern — original traversable snowcap mountain district.
 *
 * The mountain is authored as a route of grounded ramp hills. The peak is a
 * destination tile with an elevation value, not a background decoration.
 */

import type { GardenTile } from "./welcome-garden/welcome-garden-slice";

export type MountainRampHill = Readonly<{
  id: string;
  label: string;
  from: GardenTile;
  to: GardenTile;
  elevationStart: number;
  elevationEnd: number;
  grade: "gentle" | "steady" | "steep";
  walkable: true;
}>;

export type SnowcapMountain = Readonly<{
  mountainId: "frostcrown-peak";
  baseTile: GardenTile;
  peakTile: GardenTile;
  peakElevation: number;
  snowlineElevation: number;
  ramps: readonly MountainRampHill[];
  summitAccessible: true;
  summitLabel: "Frostcrown Summit";
}>;

export const FROSTCROWN_MOUNTAIN: SnowcapMountain = {
  mountainId: "frostcrown-peak",
  baseTile: { x: 12, y: 20 },
  peakTile: { x: 12, y: 32 },
  peakElevation: 18,
  snowlineElevation: 11,
  summitAccessible: true,
  summitLabel: "Frostcrown Summit",
  ramps: [
    { id: "frostcrown-lower-hill", label: "Lower Windstep Ramp", from: { x: 12, y: 20 }, to: { x: 12, y: 23 }, elevationStart: 0, elevationEnd: 4, grade: "gentle", walkable: true },
    { id: "frostcrown-middle-hill", label: "Middle Windstep Ramp", from: { x: 12, y: 23 }, to: { x: 12, y: 26 }, elevationStart: 4, elevationEnd: 8, grade: "steady", walkable: true },
    { id: "frostcrown-snowline-hill", label: "Snowline Switchback", from: { x: 12, y: 26 }, to: { x: 11, y: 29 }, elevationStart: 8, elevationEnd: 12, grade: "steady", walkable: true },
    { id: "frostcrown-upper-hill", label: "Upper Icewind Ramp", from: { x: 11, y: 29 }, to: { x: 12, y: 32 }, elevationStart: 12, elevationEnd: 18, grade: "steep", walkable: true },
  ],
};

export function mountainElevationAt(tile: GardenTile): number | undefined {
  if (tile.x === FROSTCROWN_MOUNTAIN.baseTile.x && tile.y >= FROSTCROWN_MOUNTAIN.baseTile.y && tile.y <= FROSTCROWN_MOUNTAIN.peakTile.y) {
    const progress = (tile.y - FROSTCROWN_MOUNTAIN.baseTile.y) / (FROSTCROWN_MOUNTAIN.peakTile.y - FROSTCROWN_MOUNTAIN.baseTile.y);
    return Math.round(progress * FROSTCROWN_MOUNTAIN.peakElevation * 100) / 100;
  }
  if (tile.x === FROSTCROWN_MOUNTAIN.ramps[2].to.x && tile.y === FROSTCROWN_MOUNTAIN.ramps[2].to.y) return 12;
  return undefined;
}

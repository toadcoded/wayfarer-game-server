/**
 * Project Copper Lantern — Welcome Garden map expansion.
 *
 * The original safe spawn remains centered in the garden while the playable
 * local-demo bounds now extend north, south, east, and west.
 */

export type GardenExpansionDirection = "north" | "south" | "east" | "west";

export type GardenMapBounds = Readonly<{
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}>;

export type GardenMapExpansion = Readonly<{
  mapId: "welcome-garden-expansion-v1";
  bounds: GardenMapBounds;
  extensions: Readonly<Record<GardenExpansionDirection, Readonly<{ tiles: number; theme: string }>>>;
}>;

export const WELCOME_GARDEN_MAP_EXPANSION: GardenMapExpansion = {
  mapId: "welcome-garden-expansion-v1",
  bounds: { minX: -20, minY: 0, maxX: 40, maxY: 44 },
  extensions: {
    north: { tiles: 17, theme: "frostcrown-snowcap-mountain" },
    south: { tiles: 12, theme: "sunwash-sand-and-palm-oasis" },
    east: { tiles: 16, theme: "gloamfen-gloom-marsh" },
    west: { tiles: 20, theme: "redglass-xeriscape-frontier" },
  },
};

import { COLS, LOCATIONS, ROWS, type LocId } from "./world.ts";
import type { RemotePlayer } from "./game-store.ts";

export type MapRegion = "reedhaven" | "mire" | "outer-wilds" | "far-reaches";
export type MapLandmarkKind = "hub" | "quest" | "resource" | "danger" | "archive";

export type MapLandmark = {
  id: string;
  label: string;
  shortLabel: string;
  kind: MapLandmarkKind;
  region: MapRegion;
  x: number;
  y: number;
  radius: number;
  location?: LocId;
  description: string;
};

export type MapRoute = {
  id: string;
  label: string;
  points: Array<{ x: number; y: number }>;
  tone: "civic" | "trade" | "wild";
};

export const MAP_PALETTE = {
  ink: "#17201c",
  paper: "#d8c89d",
  paperLight: "#f0e2b7",
  reedhaven: "#6f9a62",
  mire: "#3c6870",
  wilds: "#5f8061",
  path: "#c7aa76",
  water: "#397b86",
  wall: "#6d655d",
  quest: "#e6bd68",
  archive: "#9d8bd0",
  resource: "#8dc995",
  danger: "#c9776e",
  far: "#b88b68",
  player: "#f4eee0",
  peer: "#d8a8ef",
} as const;

export const MAP_LANDMARKS: MapLandmark[] = [
  { id: "reedhaven-square", label: "Reedhaven Square", shortLabel: "Square", kind: "hub", region: "reedhaven", x: 18, y: 16, radius: 4, location: "square", description: "The fountain, spawn, and the town's meeting stone." },
  { id: "great-library", label: "Great Library", shortLabel: "Library", kind: "archive", region: "reedhaven", x: 6, y: 5, radius: 4, location: "library", description: "Wren's living shelves and the oldest Codex fragments." },
  { id: "tithe-keep", label: "The Keep", shortLabel: "Keep", kind: "quest", region: "reedhaven", x: 20, y: 5, radius: 4, location: "keep", description: "Halden's vault and the first bell of the Quiet Tithe." },
  { id: "toller-shop", label: "Toller's Shop", shortLabel: "Shop", kind: "hub", region: "reedhaven", x: 5, y: 25, radius: 3, location: "shop", description: "Bread, tools, reed blades, and practical advice." },
  { id: "east-pond", label: "East Pond", shortLabel: "Pond", kind: "resource", region: "outer-wilds", x: 34, y: 13, radius: 5, location: "pond", description: "Still water where patient anglers find reed perch." },
  { id: "grey-rocks", label: "Grey Rocks", shortLabel: "Rocks", kind: "resource", region: "outer-wilds", x: 34, y: 26, radius: 4, location: "rocks", description: "Ash ore breaks through the old blackstone shelf." },
  { id: "west-grove", label: "West Grove", shortLabel: "Grove", kind: "resource", region: "mire", x: 4, y: 15, radius: 4, location: "grove", description: "Reedwood grows in a green wall around the western path." },
  { id: "southern-mire", label: "Southern Mire", shortLabel: "Mire", kind: "danger", region: "mire", x: 20, y: 24, radius: 5, description: "Mirelings roam the low ground beneath the lantern road." },
  { id: "ashwatch-camp", label: "Ashwatch Camp", shortLabel: "Camp", kind: "hub", region: "far-reaches", x: 47, y: 6, radius: 5, location: "far-camp", description: "A lonely watchfire beyond the old lantern road." },
  { id: "drowned-observatory", label: "Drowned Observatory", shortLabel: "Lens", kind: "archive", region: "far-reaches", x: 46, y: 24, radius: 5, location: "observatory", description: "A broken lens that still points toward the forgotten sky." },
  { id: "deep-marsh", label: "Deep Marsh", shortLabel: "Marsh", kind: "danger", region: "far-reaches", x: 47, y: 35, radius: 6, location: "deep-marsh", description: "Black water, old stones, and things that move below." },
];

export const MAP_ROUTES: MapRoute[] = [
  { id: "square-to-keep", label: "Keep Road", tone: "civic", points: [{ x: 18, y: 16 }, { x: 20, y: 8 }, { x: 20, y: 5 }] },
  { id: "square-to-library", label: "Archive Walk", tone: "civic", points: [{ x: 18, y: 16 }, { x: 12, y: 16 }, { x: 8, y: 9 }, { x: 6, y: 5 }] },
  { id: "square-to-shop", label: "Market Lane", tone: "trade", points: [{ x: 18, y: 16 }, { x: 12, y: 18 }, { x: 8, y: 22 }, { x: 5, y: 25 }] },
  { id: "square-to-wilds", label: "Lantern Road", tone: "wild", points: [{ x: 18, y: 16 }, { x: 25, y: 16 }, { x: 30, y: 18 }, { x: 34, y: 26 }] },
  { id: "wilds-to-camp", label: "Ashwatch Road", tone: "wild", points: [{ x: 34, y: 26 }, { x: 38, y: 26 }, { x: 39, y: 16 }, { x: 47, y: 6 }] },
  { id: "camp-to-marsh", label: "Blackwater Track", tone: "wild", points: [{ x: 47, y: 10 }, { x: 47, y: 18 }, { x: 46, y: 24 }, { x: 47, y: 35 }] },
];

export const MAP_REGION_SHAPES: Record<MapRegion, Array<{ x: number; y: number }>> = {
  reedhaven: [{ x: 10, y: 1 }, { x: 26, y: 1 }, { x: 29, y: 20 }, { x: 10, y: 21 }],
  mire: [{ x: 0, y: 10 }, { x: 14, y: 10 }, { x: 18, y: 33 }, { x: 0, y: 33 }],
  "outer-wilds": [{ x: 26, y: 4 }, { x: 40, y: 4 }, { x: 40, y: 30 }, { x: 26, y: 33 }],
  "far-reaches": [{ x: 40, y: 2 }, { x: 55, y: 2 }, { x: 55, y: 43 }, { x: 40, y: 43 }],
};

export function mapRegionAt(x: number, y: number): MapRegion {
  if (x >= 40) return "far-reaches";
  if (x >= 26) return "outer-wilds";
  if (x < 14 || y >= 21) return "mire";
  return "reedhaven";
}

export function landmarkFor(id: string): MapLandmark | undefined {
  return MAP_LANDMARKS.find((landmark) => landmark.id === id);
}

export function mapMarkerTone(kind: MapLandmarkKind): string {
  return kind === "quest" ? MAP_PALETTE.quest : kind === "archive" ? MAP_PALETTE.archive : kind === "resource" ? MAP_PALETTE.resource : kind === "danger" ? MAP_PALETTE.danger : MAP_PALETTE.paperLight;
}

export function overviewMarkers(tileX: number, tileY: number, remotePlayers: RemotePlayer[]) {
  return {
    self: { x: tileX + 0.5, y: tileY + 0.5, tone: MAP_PALETTE.player },
    peers: remotePlayers.map((peer) => ({ x: peer.x + 0.5, y: peer.y + 0.5, tone: MAP_PALETTE.peer, label: peer.displayName })),
    landmarks: MAP_LANDMARKS,
  };
}

export function mapBounds() {
  return { width: COLS, height: ROWS };
}

export function mapLegend() {
  return [
    { label: "Town", tone: MAP_PALETTE.paperLight },
    { label: "Quest", tone: MAP_PALETTE.quest },
    { label: "Resource", tone: MAP_PALETTE.resource },
    { label: "Danger", tone: MAP_PALETTE.danger },
  ];
}

export function regionLabel(region: MapRegion): string {
  return region === "reedhaven" ? "Reedhaven" : region === "mire" ? "The Mire" : region === "outer-wilds" ? "Outer Wilds" : "Far Reaches";
}

export const MAP_DIMENSIONS = { width: COLS, height: ROWS, locations: LOCATIONS.length, rows: ROWS } as const;

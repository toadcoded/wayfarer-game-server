export const TILE = 32;
export const COLS = 56;
export const ROWS = 44;

export const T = {
  grass: 0,
  grass2: 1,
  path: 2,
  stone: 3,
  water: 4,
  floor: 5,
  keep: 6,
  wall: 7,
  rock: 8,
  tree: 9,
  fountain: 10,
  dock: 11,
} as const;

export type TileId = (typeof T)[keyof typeof T];

export type LocId =
  | "square"
  | "library"
  | "shop"
  | "keep"
  | "pond"
  | "rocks"
  | "grove"
  | "far-camp"
  | "observatory"
  | "deep-marsh";

export type Location = {
  id: LocId;
  name: string;
  blurb: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const LOCATIONS: Location[] = [
  { id: "library", name: "Great Library", blurb: "Shelves, Wren, living books", x: 2, y: 2, w: 8, h: 7 },
  { id: "shop", name: "Toller's shop", blurb: "Bread, reed blade, ash staff", x: 2, y: 22, w: 7, h: 6 },
  { id: "square", name: "Reedhaven square", blurb: "Fountain, spawn, the Keep nearby", x: 14, y: 12, w: 8, h: 8 },
  { id: "keep", name: "The Keep", blurb: "Keepmaster Halden, vault", x: 16, y: 2, w: 8, h: 6 },
  { id: "pond", name: "East pond", blurb: "Reed perch", x: 28, y: 8, w: 12, h: 12 },
  { id: "rocks", name: "Grey rocks", blurb: "Ore", x: 30, y: 24, w: 8, h: 6 },
  { id: "grove", name: "West grove", blurb: "Reedwood", x: 1, y: 12, w: 8, h: 8 },
  { id: "far-camp", name: "Ashwatch Camp", blurb: "A lantern outpost beyond the old road", x: 42, y: 3, w: 11, h: 8 },
  { id: "observatory", name: "Drowned Observatory", blurb: "A stone lens sunk into the wilds", x: 42, y: 20, w: 9, h: 8 },
  { id: "deep-marsh", name: "Deep Marsh", blurb: "Black water and patient things", x: 40, y: 30, w: 13, h: 11 },
];

export type NpcDef = {
  id: string;
  name: string;
  x: number;
  y: number;
  hue: "indigo" | "keep" | "toller";
  line: string;
};

export const NPCS: NpcDef[] = [
  {
    id: "wren",
    name: "Archivist Wren",
    x: 5,
    y: 4,
    hue: "indigo",
    line: "The books remember what the square forgets. Keep the Codex.",
  },
  {
    id: "halden",
    name: "Keepmaster Halden",
    x: 19,
    y: 4,
    hue: "keep",
    line: "The vault is quiet. Knowledge is the only weapon I still trust.",
  },
  {
    id: "toller",
    name: "Toller",
    x: 5,
    y: 24,
    hue: "toller",
    line: "Bread, a reed blade, an ash staff. Learn first. Swing second.",
  },
];

export const BOOKS = [
  { id: "primer", title: "A Stranger's Primer to Ashfen", author: "Warden Pell", pages: 4 },
  { id: "bestiary", title: "Bestiary of the Mire", author: "Sister Caldew", pages: 3 },
  { id: "catalogue", title: "Great Library Catalogue", author: "Archivist Wren", pages: 3 },
  { id: "reed", title: "Field Guide: Skills of the Reed", author: "Toller the Shop", pages: 3 },
  { id: "names", title: "Codex of Lost Names", author: "Unknown, and Wren", pages: 3 },
  { id: "ledger", title: "Keepmaster's Ledger", author: "Halden, once a clerk", pages: 3 },
  { id: "binding", title: "On the Binding of Memory", author: "Wren", pages: 2 },
];

export const SKILLS = [
  "Vitality",
  "Strike",
  "Guard",
  "Reedcut",
  "Delve",
  "Angle",
  "Binding",
  "Lore",
] as const;

export type SkillId = (typeof SKILLS)[number];

const BLOCK = new Set<number>([T.wall, T.water, T.tree, T.rock, T.fountain]);

export function isBlocked(tiles: Uint8Array, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
  return BLOCK.has(tiles[y * COLS + x]!);
}

export function walkable(tiles: Uint8Array, x: number, y: number): boolean {
  return !isBlocked(tiles, x, y);
}

export function locationAt(x: number, y: number): Location {
  for (const loc of LOCATIONS) {
    if (x >= loc.x && y >= loc.y && x < loc.x + loc.w && y < loc.y + loc.h) return loc;
  }
  return LOCATIONS.find((l) => l.id === "square")!;
}

function fill(tiles: Uint8Array, x: number, y: number, w: number, h: number, t: number) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < COLS && yy < ROWS) tiles[yy * COLS + xx] = t;
    }
  }
}

function room(
  tiles: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  floor: number,
) {
  fill(tiles, x, y, w, h, T.wall);
  fill(tiles, x + 1, y + 1, w - 2, h - 2, floor);
}

export function buildTiles(): Uint8Array {
  const tiles = new Uint8Array(COLS * ROWS);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      tiles[y * COLS + x] = (x + y) % 2 === 0 ? T.grass : T.grass2;
    }
  }

  fill(tiles, 0, 0, COLS, ROWS, T.grass);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2) tiles[y * COLS + x] = T.grass2;
    }
  }

  fill(tiles, 12, 10, 3, 16, T.path);
  fill(tiles, 10, 16, 18, 2, T.path);
  fill(tiles, 22, 6, 2, 12, T.path);
  fill(tiles, 8, 8, 2, 16, T.path);

  fill(tiles, 14, 12, 8, 8, T.stone);
  tiles[16 * COLS + 17] = T.fountain;
  tiles[16 * COLS + 18] = T.fountain;

  room(tiles, 2, 2, 9, 8, T.floor);
  tiles[9 * COLS + 6] = T.path;

  room(tiles, 16, 2, 9, 7, T.keep);
  tiles[8 * COLS + 20] = T.path;

  room(tiles, 2, 22, 8, 7, T.floor);
  tiles[22 * COLS + 5] = T.path;

  fill(tiles, 28, 8, 12, 11, T.water);
  fill(tiles, 28, 18, 8, 1, T.dock);
  fill(tiles, 27, 8, 1, 11, T.grass2);

  for (const [x, y] of [
    [31, 25],
    [33, 26],
    [35, 25],
    [32, 27],
    [36, 27],
    [34, 28],
  ] as const) {
    tiles[y * COLS + x] = T.rock;
  }

  for (const [x, y] of [
    [2, 13],
    [4, 14],
    [3, 16],
    [6, 13],
    [7, 15],
    [5, 17],
    [1, 15],
    [2, 18],
  ] as const) {
    tiles[y * COLS + x] = T.tree;
  }

  fill(tiles, 24, 16, 18, 2, T.path);
  fill(tiles, 38, 8, 2, 22, T.path);
  fill(tiles, 40, 7, 3, 2, T.path);
  fill(tiles, 40, 27, 5, 2, T.path);
  room(tiles, 42, 3, 11, 8, T.floor);
  tiles[10 * COLS + 47] = T.path;
  room(tiles, 42, 20, 9, 8, T.keep);
  tiles[27 * COLS + 46] = T.path;
  fill(tiles, 40, 30, 13, 10, T.water);
  fill(tiles, 39, 30, 1, 10, T.grass2);
  fill(tiles, 44, 29, 7, 1, T.dock);

  for (const [x, y] of [
    [49, 14], [52, 16], [47, 17], [53, 23], [50, 28], [54, 27],
  ] as const) {
    tiles[y * COLS + x] = T.tree;
  }

  for (const [x, y] of [
    [44, 32], [47, 34], [50, 33], [52, 36], [46, 38], [49, 39],
  ] as const) {
    tiles[y * COLS + x] = T.rock;
  }

  fill(tiles, 0, 0, COLS, 1, T.wall);
  fill(tiles, 0, ROWS - 1, COLS, 1, T.wall);
  fill(tiles, 0, 0, 1, ROWS, T.wall);
  fill(tiles, COLS - 1, 0, 1, ROWS, T.wall);

  return tiles;
}

export const SPAWN = { x: 18, y: 18 };

export type NodeKind = "tree" | "ore" | "fish";

export type ResourceNode = {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  ready: boolean;
  readyAt: number;
};

export function seedNodes(): ResourceNode[] {
  return [
    { id: "t1", kind: "tree", x: 4, y: 14, ready: true, readyAt: 0 },
    { id: "t2", kind: "tree", x: 6, y: 13, ready: true, readyAt: 0 },
    { id: "t3", kind: "tree", x: 3, y: 16, ready: true, readyAt: 0 },
    { id: "o1", kind: "ore", x: 33, y: 26, ready: true, readyAt: 0 },
    { id: "o2", kind: "ore", x: 35, y: 25, ready: true, readyAt: 0 },
    { id: "f1", kind: "fish", x: 29, y: 18, ready: true, readyAt: 0 },
    { id: "f2", kind: "fish", x: 32, y: 18, ready: true, readyAt: 0 },
    { id: "t4", kind: "tree", x: 49, y: 14, ready: true, readyAt: 0 },
    { id: "o3", kind: "ore", x: 47, y: 34, ready: true, readyAt: 0 },
    { id: "f3", kind: "fish", x: 45, y: 29, ready: true, readyAt: 0 },
  ];
}

export const MIRE_SPAWNS = [
  { x: 16, y: 22 },
  { x: 20, y: 23 },
  { x: 22, y: 21 },
  { x: 15, y: 24 },
  { x: 24, y: 22 },
  { x: 18, y: 25 },
  { x: 13, y: 22 },
  { x: 21, y: 26 },
  { x: 48, y: 23 },
  { x: 51, y: 27 },
  { x: 45, y: 35 },
];

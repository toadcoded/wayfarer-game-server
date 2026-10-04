import { create } from "zustand";
import { LANDMARKS, SPAWN_TILE, TILES, tileCenter, worldToTile, type Biome } from "./world.ts";

const SAVE_KEY = "wayfarer.save.v2";
const SAVE_VERSION = 2;

export type InvItem = { id: string; name: string; qty: number };
export type Panel = "quest" | "pack" | "skills" | null;

export type GameState = {
  started: boolean;
  paused: boolean;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  stamina: number;
  trails: Record<string, boolean>;
  known: Uint8Array;
  knownCount: number;
  inventory: InvItem[];
  skills: { explore: number; forage: number; woodcraft: number };
  log: { t: number; msg: string }[];
  panel: Panel;
  biome: Biome;
  talked: boolean;
  hydrate: () => void;
  start: () => void;
  setPaused: (v: boolean) => void;
  setPose: (x: number, z: number, yaw: number, biome: Biome) => void;
  setVitals: (hp: number, stamina: number) => void;
  markKnown: (tx: number, tz: number) => void;
  discover: (id: string, flavor: string) => void;
  takeItem: (id: string, name: string) => void;
  pushLog: (msg: string) => void;
  setPanel: (p: Panel) => void;
  talk: () => void;
  reset: () => void;
};

const defaultKnown = () => new Uint8Array(TILES * TILES);

function packKnown(k: Uint8Array) {
  let s = "";
  for (let i = 0; i < k.length; i++) if (k[i]) s += (s ? "," : "") + i;
  return s;
}

function unpackKnown(s: string | undefined) {
  const k = defaultKnown();
  if (!s) return k;
  for (const part of s.split(",")) {
    const n = Number(part);
    if (n >= 0 && n < k.length) k[n] = 1;
  }
  return k;
}

function persist(s: GameState) {
  try {
    const blob = JSON.stringify({
      version: SAVE_VERSION,
      x: s.x,
      z: s.z,
      yaw: s.yaw,
      hp: s.hp,
      stamina: s.stamina,
      trails: s.trails,
      known: packKnown(s.known),
      inventory: s.inventory,
      skills: s.skills,
      log: s.log.slice(-12),
      talked: s.talked,
    });
    localStorage.setItem(SAVE_KEY, blob);
  } catch {
    /* private mode / quota */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(s: GameState) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(s), 700);
}

const fresh = (): Omit<
  GameState,
  | "hydrate"
  | "start"
  | "setPaused"
  | "setPose"
  | "setVitals"
  | "markKnown"
  | "discover"
  | "takeItem"
  | "pushLog"
  | "setPanel"
  | "talk"
  | "reset"
> => ({
  started: false,
  paused: false,
  x: tileCenter(SPAWN_TILE.tx),
  z: tileCenter(SPAWN_TILE.tz),
  yaw: Math.PI / 4,
  hp: 1,
  stamina: 1,
  trails: { west: false, east: false, south: false, north: false },
  known: defaultKnown(),
  knownCount: 0,
  inventory: [],
  skills: { explore: 1, forage: 1, woodcraft: 1 },
  log: [{ t: 0, msg: "The highland keeps four roads. Walk them." }],
  panel: "quest",
  biome: "meadow",
  talked: false,
});

export const useGame = create<GameState>((set, get) => ({
  ...fresh(),

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      const known = unpackKnown(typeof d.known === "string" ? d.known : "");
      let knownCount = 0;
      for (let i = 0; i < known.length; i++) if (known[i]) knownCount++;
      set({
        x: typeof d.x === "number" ? d.x : tileCenter(SPAWN_TILE.tx),
        z: typeof d.z === "number" ? d.z : tileCenter(SPAWN_TILE.tz),
        yaw: typeof d.yaw === "number" ? d.yaw : Math.PI / 4,
        hp: typeof d.hp === "number" ? d.hp : 1,
        stamina: typeof d.stamina === "number" ? d.stamina : 1,
        trails: { ...fresh().trails, ...(d.trails as object) },
        known,
        knownCount,
        inventory: Array.isArray(d.inventory) ? (d.inventory as InvItem[]) : [],
        skills: { ...fresh().skills, ...(d.skills as object) },
        log: Array.isArray(d.log) ? (d.log as GameState["log"]) : fresh().log,
        talked: Boolean(d.talked),
      });
    } catch {
      /* corrupt save */
    }
  },

  start: () => set({ started: true, paused: false }),
  setPaused: (v) => set({ paused: v }),

  setPose: (x, z, yaw, biome) => {
    set({ x, z, yaw, biome });
    scheduleSave(get());
  },

  setVitals: (hp, stamina) => set({ hp, stamina }),

  markKnown: (tx, tz) => {
    const s = get();
    const i = tz * TILES + tx;
    if (s.known[i]) return;
    const known = s.known;
    known[i] = 1;
    set({ known, knownCount: s.knownCount + 1 });
  },

  discover: (id, flavor) => {
    const s = get();
    if (s.trails[id]) return;
    const trails = { ...s.trails, [id]: true };
    const lm = LANDMARKS.find((l) => l.id === id);
    const skills = { ...s.skills, explore: s.skills.explore + 1 };
    const done = LANDMARKS.filter((l) => trails[l.id]).length;
    const log = [
      ...s.log,
      { t: Date.now(), msg: flavor },
      ...(done === 4
        ? [{ t: Date.now(), msg: "The four trails are yours. The highland remembers." }]
        : []),
    ].slice(-16);
    const inventory = lm ? addItem(s.inventory, lm.id + "-item", lm.item) : s.inventory;
    set({ trails, skills, log, inventory });
    persist({ ...get(), trails, skills, log, inventory });
  },

  takeItem: (id, name) => {
    const inventory = addItem(get().inventory, id, name);
    const skills = { ...get().skills, forage: get().skills.forage + 1 };
    set({ inventory, skills });
    get().pushLog(`You take ${name}.`);
  },

  pushLog: (msg) => {
    const log = [...get().log, { t: Date.now(), msg }].slice(-16);
    set({ log });
  },

  setPanel: (p) => set({ panel: p === get().panel ? null : p }),

  talk: () => {
    if (get().talked) {
      get().pushLog("Rowan: The trails still wait.");
      return;
    }
    set({ talked: true });
    get().pushLog("Rowan: Four roads. Shore, rise, gate, bridge. Bring back what they keep.");
  },

  reset: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* */
    }
    set({ ...fresh(), started: true });
  },
}));

function addItem(inv: InvItem[], id: string, name: string): InvItem[] {
  const hit = inv.find((i) => i.id === id);
  if (hit) return inv.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i));
  return [...inv, { id, name, qty: 1 }];
}

export function trailCount(trails: Record<string, boolean>) {
  return LANDMARKS.reduce((n, l) => n + (trails[l.id] ? 1 : 0), 0);
}

export function tileOfPlayer() {
  const { x, z } = useGame.getState();
  return worldToTile(x, z);
}

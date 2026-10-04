import { create } from "zustand";
import { SAVE_KEY, SAVE_VERSION, parseSave } from "./save.ts";
import {
  CROSSROADS,
  FOLK,
  LANDMARKS,
  SPAWN_TILE,
  TILES,
  gatherLine,
  tileCenter,
  worldToTile,
  type Biome,
  type ResourceNode,
} from "./world.ts";
import {
  OFFERING_NAME,
  freshQuietTithe,
  reduceTithe,
  titheObjective,
  type QuietTithe,
} from "./quests.ts";

export type InvItem = { id: string; name: string; qty: number };
export type Panel = "quest" | "pack" | "skills" | "codex" | "map" | "attack";
export type Skills = {
  explore: number;
  forage: number;
  woodcraft: number;
  lore: number;
  binding: number;
};

export type GameState = {
  started: boolean;
  paused: boolean;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  stamina: number;
  tick: number;
  trails: Record<string, boolean>;
  known: Uint8Array;
  knownCount: number;
  inventory: InvItem[];
  skills: Skills;
  log: { t: number; msg: string }[];
  panel: Panel;
  biome: Biome;
  talked: boolean;
  nodeReady: Record<string, number>;
  gold: number;
  tithe: QuietTithe;
  talkLine: { name: string; line: string } | null;
  hydrate: () => void;
  start: () => void;
  setPaused: (v: boolean) => void;
  setPose: (x: number, z: number, yaw: number, biome: Biome) => void;
  setVitals: (hp: number, stamina: number) => void;
  markKnown: (tx: number, tz: number) => void;
  discover: (id: string, flavor: string) => void;
  takeItem: (id: string, name: string) => void;
  gather: (node: ResourceNode) => boolean;
  isNodeReady: (id: string) => boolean;
  advanceTick: () => void;
  pushLog: (msg: string) => void;
  setPanel: (p: Panel) => void;
  talk: (npcId?: string) => void;
  lightLantern: () => boolean;
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
      tick: s.tick,
      trails: s.trails,
      known: packKnown(s.known),
      inventory: s.inventory,
      skills: s.skills,
      log: s.log.slice(-12),
      talked: s.talked,
      nodeReady: s.nodeReady,
      gold: s.gold,
      tithe: s.tithe,
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
  | "gather"
  | "isNodeReady"
  | "advanceTick"
  | "pushLog"
  | "setPanel"
  | "talk"
  | "lightLantern"
  | "reset"
> => ({
  started: false,
  paused: false,
  x: tileCenter(SPAWN_TILE.tx),
  z: tileCenter(SPAWN_TILE.tz),
  yaw: Math.PI / 4,
  hp: 1,
  stamina: 1,
  tick: 0,
  trails: { west: false, east: false, south: false, north: false },
  known: defaultKnown(),
  knownCount: 0,
  inventory: [
    { id: "bread", name: "Bread", qty: 2 },
    { id: "primer", name: "A Stranger's Primer", qty: 1 },
  ],
  skills: { explore: 1, forage: 1, woodcraft: 1, lore: 1, binding: 1 },
  log: [
    { t: 0, msg: "Reedhaven square. The fountain is the spawn." },
    { t: 1, msg: "Halden waits with the Quiet Tithe. Four trails leave the fork." },
  ],
  panel: "quest",
  biome: "path",
  talked: false,
  nodeReady: {},
  gold: 20,
  tithe: freshQuietTithe(),
  talkLine: null,
});

export const useGame = create<GameState>((set, get) => ({
  ...fresh(),

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw =
        localStorage.getItem(SAVE_KEY) ??
        localStorage.getItem("wayfarer.save.v3") ??
        localStorage.getItem("wayfarer.save.v2");
      if (!raw) return;
      const d = parseSave(raw);
      if (!d) return;
      const known = unpackKnown(d.known);
      let knownCount = 0;
      for (let i = 0; i < known.length; i++) if (known[i]) knownCount++;
      set({
        x: d.x,
        z: d.z,
        yaw: d.yaw,
        hp: d.hp,
        stamina: d.stamina,
        tick: d.tick,
        trails: { ...fresh().trails, ...d.trails },
        known,
        knownCount,
        inventory: d.inventory.length ? d.inventory : fresh().inventory,
        skills: { ...fresh().skills, ...d.skills },
        log: d.log.length ? d.log : fresh().log,
        talked: d.talked,
        nodeReady: d.nodeReady,
        gold: d.gold,
        tithe: d.tithe,
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
      { t: Date.now() + 1, msg: `A folio opens: ${lm?.name ?? id}.` },
      ...(done === 4
        ? [{ t: Date.now() + 2, msg: "The four trails are yours. The highland remembers." }]
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

  isNodeReady: (id) => {
    const s = get();
    const readyAt = s.nodeReady[id] ?? 0;
    return s.tick >= readyAt;
  },

  gather: (node) => {
    const s = get();
    const readyAt = s.nodeReady[node.id] ?? 0;
    if (s.tick < readyAt) {
      get().pushLog("Stripped bare. Wait for the next growth.");
      return false;
    }
    const inventory = addItem(s.inventory, node.id, node.item);
    const skillKey = node.kind === "wood" ? "woodcraft" : "forage";
    const skills = { ...s.skills, [skillKey]: s.skills[skillKey] + 1 };
    const nodeReady = { ...s.nodeReady, [node.id]: s.tick + node.respawn };
    const offered = reduceTithe(s.tithe, { type: "offer", item: node.id });
    const log = [
      ...s.log,
      { t: Date.now(), msg: gatherLine(node.kind, node.item) },
      ...(offered.line ? [{ t: Date.now() + 1, msg: offered.line }] : []),
    ].slice(-16);
    set({ inventory, skills, nodeReady, log, tithe: offered.state });
    scheduleSave(get());
    return true;
  },

  advanceTick: () => set({ tick: get().tick + 1 }),

  pushLog: (msg) => {
    const log = [...get().log, { t: Date.now(), msg }].slice(-16);
    set({ log });
  },

  setPanel: (p) => set({ panel: get().panel === p ? "quest" : p, talkLine: null }),

  talk: (npcId) => {
    const folk = FOLK.find((f) => f.id === npcId) ?? FOLK.find((f) => f.id === "rowan")!;
    const s = get();
    const { state, line } = reduceTithe(s.tithe, { type: "talk", npc: folk.id });
    let inventory = s.inventory;
    let gold = s.gold;
    let skills = s.skills;
    if (state.rewarded && !s.tithe.rewarded) {
      inventory = addItem(inventory, "ash-staff", "Ash staff");
      gold += 30;
      skills = { ...skills, lore: skills.lore + 20, binding: skills.binding + 30 };
    }
    set({
      tithe: state,
      talked: true,
      talkLine: { name: folk.name, line },
      inventory,
      gold,
      skills,
    });
    get().pushLog(line);
    scheduleSave(get());
  },

  lightLantern: () => {
    const s = get();
    const { state, line } = reduceTithe(s.tithe, { type: "light" });
    if (state === s.tithe && !state.lantern) {
      get().pushLog(line);
      return false;
    }
    set({ tithe: state });
    get().pushLog(line);
    scheduleSave(get());
    return state.lantern;
  },

  reset: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem("wayfarer.save.v3");
      localStorage.removeItem("wayfarer.save.v2");
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

export { titheObjective, OFFERING_NAME, CROSSROADS };

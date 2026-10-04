import { create } from "zustand";
import type { LandmarkId, Pickup } from "./world";
import { getWorld, TILES, tileCoords } from "./world";

export type PanelTab = "pack" | "skills" | "quest";

export type LogLine = { id: number; text: string };

export type GameSnapshot = {
  x: number;
  z: number;
  yaw: number;
  hp: number;
  stamina: number;
  known: number[];
  walked: LandmarkId[];
  pack: { bloom: number; wood: number; stone: number };
  picked: string[];
  log: string[];
  wayfaring: number;
};

const SAVE_KEY = "wayfarer.save.v1";

function emptyKnown(): Uint8Array {
  return new Uint8Array(TILES * TILES);
}

function loadSave(): Partial<GameSnapshot> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameSnapshot;
  } catch {
    return null;
  }
}

type GameState = {
  started: boolean;
  paused: boolean;
  panel: PanelTab;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  hp: number;
  stamina: number;
  biome: string;
  known: Uint8Array;
  knownCount: number;
  walked: Record<LandmarkId, boolean>;
  pack: { bloom: number; wood: number; stone: number };
  picked: Set<string>;
  remainingPickups: Pickup[];
  log: LogLine[];
  wayfaring: number;
  talkReady: boolean;
  start: () => void;
  pause: (v?: boolean) => void;
  setPanel: (p: PanelTab) => void;
  setPose: (x: number, z: number, yaw: number, speed: number, biome: string) => void;
  setVitals: (hp: number, stamina: number) => void;
  markTile: (x: number, z: number) => void;
  walkLandmark: (id: LandmarkId, message: string) => void;
  gather: (id: string, kind: Pickup["kind"]) => void;
  pushLog: (text: string) => void;
  persist: () => void;
  hydrate: () => void;
  reset: () => void;
};

let logSeq = 1;

const OPENING = [
  "Four trails leave the crossroads. Walk them, and the highland will know you.",
  "You stand at the crossroads. Four trails wait.",
];

function walkedRecord(ids: LandmarkId[] = []): Record<LandmarkId, boolean> {
  return {
    west: ids.includes("west"),
    east: ids.includes("east"),
    south: ids.includes("south"),
    north: ids.includes("north"),
  };
}

export const useGame = create<GameState>((set, get) => {
  const world = getWorld();

  return {
    started: false,
    paused: false,
    panel: "quest",
    x: world.spawn.x,
    z: world.spawn.z,
    yaw: 0,
    speed: 0,
    hp: 1,
    stamina: 1,
    biome: "Forest",
    known: emptyKnown(),
    knownCount: 0,
    walked: walkedRecord(),
    pack: { bloom: 0, wood: 0, stone: 0 },
    picked: new Set(),
    remainingPickups: world.pickups.slice(),
    log: OPENING.map((text) => ({ id: logSeq++, text })),
    wayfaring: 0,
    talkReady: true,
    start: () => set({ started: true, paused: false }),
    pause: (v) =>
      set((s) => ({ paused: typeof v === "boolean" ? v : !s.paused })),
    setPanel: (panel) => set({ panel }),
    setPose: (x, z, yaw, speed, biome) => set({ x, z, yaw, speed, biome }),
    setVitals: (hp, stamina) => set({ hp, stamina }),
    markTile: (x, z) => {
      const { tx, tz } = tileCoords(x, z);
      if (tx < 0 || tz < 0 || tx >= TILES || tz >= TILES) return;
      const i = tz * TILES + tx;
      const k = get().known;
      if (k[i]) return;
      const next = k.slice();
      next[i] = 1;
      set((s) => ({
        known: next,
        knownCount: s.knownCount + 1,
        wayfaring: s.wayfaring + 1,
      }));
    },
    walkLandmark: (id, message) => {
      if (get().walked[id]) return;
      set((s) => ({
        walked: { ...s.walked, [id]: true },
      }));
      get().pushLog(message);
      const done = Object.values(get().walked).filter(Boolean).length;
      if (done === 4) {
        get().pushLog("The four trails are walked. The highland knows you.");
      }
      get().persist();
    },
    gather: (id, kind) => {
      if (get().picked.has(id)) return;
      const picked = new Set(get().picked);
      picked.add(id);
      set((s) => ({
        picked,
        remainingPickups: s.remainingPickups.filter((p) => p.id !== id),
        pack: { ...s.pack, [kind]: s.pack[kind] + 1 },
      }));
      const label =
        kind === "bloom" ? "a trail bloom" : kind === "wood" ? "driftwood" : "a river stone";
      get().pushLog(`You take ${label}.`);
    },
    pushLog: (text) =>
      set((s) => ({
        log: [...s.log.slice(-7), { id: logSeq++, text }],
      })),
    persist: () => {
      const s = get();
      const knownIdx: number[] = [];
      s.known.forEach((v, i) => {
        if (v) knownIdx.push(i);
      });
      const snap: GameSnapshot = {
        x: s.x,
        z: s.z,
        yaw: s.yaw,
        hp: s.hp,
        stamina: s.stamina,
        known: knownIdx,
        walked: (Object.keys(s.walked) as LandmarkId[]).filter((k) => s.walked[k]),
        pack: s.pack,
        picked: [...s.picked],
        log: s.log.map((l) => l.text),
        wayfaring: s.wayfaring,
      };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
      } catch {
        /* ignore quota */
      }
    },
    hydrate: () => {
      const saved = loadSave();
      if (!saved) return;
      const world = getWorld();
      const known = emptyKnown();
      if (saved.known) {
        for (const i of saved.known) {
          if (i >= 0 && i < known.length) known[i] = 1;
        }
      }
      const remaining = world.pickups.filter((p) => !saved.picked?.includes(p.id));
      logSeq = 1;
      set({
        x: saved.x ?? world.spawn.x,
        z: saved.z ?? world.spawn.z,
        yaw: saved.yaw ?? 0,
        hp: saved.hp ?? 1,
        stamina: saved.stamina ?? 1,
        known,
        knownCount: saved.known?.length ?? 0,
        walked: walkedRecord(saved.walked),
        pack: saved.pack ?? { bloom: 0, wood: 0, stone: 0 },
        picked: new Set(saved.picked ?? []),
        remainingPickups: remaining,
        log: (saved.log?.length ? saved.log : OPENING).map((text) => ({
          id: logSeq++,
          text,
        })),
        wayfaring: saved.wayfaring ?? 0,
      });
    },
    reset: () => {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        /* ignore */
      }
      const w = getWorld();
      logSeq = 1;
      set({
        started: true,
        paused: false,
        x: w.spawn.x,
        z: w.spawn.z,
        yaw: 0,
        speed: 0,
        hp: 1,
        stamina: 1,
        known: emptyKnown(),
        knownCount: 0,
        walked: walkedRecord(),
        pack: { bloom: 0, wood: 0, stone: 0 },
        picked: new Set(),
        remainingPickups: w.pickups.slice(),
        log: OPENING.map((text) => ({ id: logSeq++, text })),
        wayfaring: 0,
        talkReady: true,
      });
    },
  };
});

export function walkedCount(walked: Record<LandmarkId, boolean>): number {
  return (Object.keys(walked) as LandmarkId[]).reduce((n, k) => n + (walked[k] ? 1 : 0), 0);
}

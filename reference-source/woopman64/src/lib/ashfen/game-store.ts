import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  BOOKS,
  MIRE_SPAWNS,
  SKILLS,
  SPAWN,
  seedNodes,
  type ResourceNode,
  type SkillId,
} from "./world";
import { BOOK_PAGES } from "./lore";
import { clampZoom, RUN_MAX, ZOOM_DEFAULT } from "./physics";
import { freshQuietTithe, type QuietTithe } from "./quests";
import type { CommandResult, TitheSyncStatus } from "./commands";
import type { AttackStyle } from "./rpg";

export type Dir = "down" | "left" | "right" | "up";
export type Panel = "pack" | "skills" | "codex" | "map" | "attack" | null;
export type ViewMode = "3d" | "2d";

export type InvItem = { id: string; name: string; qty: number };

export type Mireling = {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnAt: number;
  frame: number;
};

export type ChatLine = { t: number; text: string };
export type TitheSync = { status: TitheSyncStatus; text: string };

type SkillState = Record<SkillId, { level: number; xp: number }>;

function freshSkills(): SkillState {
  const out = {} as SkillState;
  for (const id of SKILLS) {
    out[id] = { level: id === "Vitality" ? 10 : 1, xp: 0 };
  }
  return out;
}

function freshMire(): Mireling[] {
  return MIRE_SPAWNS.map((p, i) => ({
    id: `m${i}`,
    x: p.x,
    y: p.y,
    hp: 6,
    maxHp: 6,
    alive: true,
    respawnAt: 0,
    frame: 0,
  }));
}

export type GameSnap = {
  tileX: number;
  tileY: number;
  dir: Dir;
  hp: number;
  maxHp: number;
  skills: SkillState;
  pack: InvItem[];
  gold: number;
  booksRead: string[];
  log: ChatLine[];
  panel: Panel;
  overlays: { walk: boolean; respawn: boolean };
  attackMode: boolean;
  nodes: ResourceNode[];
  mirelings: Mireling[];
  openBook: string | null;
  talk: { npc: string; line: string } | null;
  entered: boolean;
  tick: number;
  zoom: number;
  runEnergy: number;
  walkSpeed: number;
  boostUntil: number;
  viewMode: ViewMode;
  tithe: QuietTithe;
  titheReward: boolean;
  titheSync: TitheSync;
  paused: boolean;
  attackStyle: AttackStyle;
  addXp: (id: SkillId, amount: number) => void;
  addItem: (id: string, name: string, qty?: number) => void;
  spendGold: (n: number) => boolean;
  setPanel: (p: Panel) => void;
  toggleOverlay: (k: "walk" | "respawn") => void;
  setAttack: (on: boolean) => void;
  setDir: (d: Dir) => void;
  setTile: (x: number, y: number) => void;
  setHp: (n: number) => void;
  say: (text: string) => void;
  readBook: (id: string) => void;
  setOpenBook: (id: string | null) => void;
  setTalk: (talk: { npc: string; line: string } | null) => void;
  setNodes: (nodes: ResourceNode[]) => void;
  setMirelings: (m: Mireling[]) => void;
  setEntered: () => void;
  setTick: (n: number) => void;
  setZoom: (z: number) => void;
  setRunEnergy: (n: number) => void;
  setBoostUntil: (t: number) => void;
  setViewMode: (m: ViewMode) => void;
  setPaused: (on: boolean) => void;
  setAttackStyle: (style: AttackStyle) => void;
  setTitheSync: (sync: TitheSync) => void;
  applyCommand: (result: CommandResult) => void;
  resetWorld: () => void;
};

const MAX_LOG = 24;
const UNIQUE_REWARDS = new Set(["lantern-of-ash", "tithe-charm"]);

export const useGame = create<GameSnap>()(
  persist(
    (set, get) => ({
      tileX: SPAWN.x,
      tileY: SPAWN.y,
      dir: "down",
      hp: 10,
      maxHp: 10,
      skills: freshSkills(),
      pack: [
        { id: "bread", name: "Bread", qty: 2 },
        { id: "primer", name: "A Stranger's Primer", qty: 1 },
      ],
      gold: 20,
      booksRead: [],
      log: [
        { t: Date.now(), text: "Reedhaven square. The fountain is the spawn." },
        { t: Date.now(), text: "Halden waits with the Quiet Tithe. Four trails leave the fork." },
      ],
      panel: null,
      overlays: { walk: true, respawn: true },
      attackMode: false,
      nodes: seedNodes(),
      mirelings: freshMire(),
      openBook: null,
      talk: null,
      entered: false,
      tick: 0,
      zoom: ZOOM_DEFAULT,
      runEnergy: RUN_MAX,
      walkSpeed: 1,
      boostUntil: 0,
      viewMode: "3d",
      tithe: freshQuietTithe(),
      titheReward: false,
      titheSync: { status: "idle", text: "" },
      paused: false,
      attackStyle: "melee",
      addXp: (id, amount) => {
        const skills = { ...get().skills };
        const cur = { ...skills[id] };
        cur.xp += amount;
        const need = cur.level * 80;
        if (cur.xp >= need) {
          cur.xp -= need;
          cur.level += 1;
          get().say(`${id} rises to ${cur.level}.`);
          if (id === "Vitality") {
            set({ maxHp: 8 + cur.level * 2, hp: Math.min(get().hp + 2, 8 + cur.level * 2) });
          }
        }
        skills[id] = cur;
        set({ skills });
      },
      addItem: (id, name, qty = 1) => {
        const pack = [...get().pack];
        const hit = pack.find((p) => p.id === id);
        if (hit) hit.qty += qty;
        else pack.push({ id, name, qty });
        set({ pack: pack.filter((p) => p.qty > 0) });
      },
      spendGold: (n) => {
        if (get().gold < n) return false;
        set({ gold: get().gold - n });
        return true;
      },
      setPanel: (p) => set({ panel: get().panel === p ? null : p, openBook: null, talk: null }),
      toggleOverlay: (k) =>
        set({ overlays: { ...get().overlays, [k]: !get().overlays[k] } }),
      setAttack: (on) => set({ attackMode: on, panel: on ? "attack" : get().panel }),
      setDir: (d) => set({ dir: d }),
      setTile: (x, y) => set({ tileX: x, tileY: y }),
      setHp: (n) => set({ hp: Math.max(0, Math.min(get().maxHp, n)) }),
      say: (text) =>
        set({ log: [...get().log, { t: Date.now(), text }].slice(-MAX_LOG) }),
      readBook: (id) => {
        const pages = BOOK_PAGES[id];
        const book = BOOKS.find((b) => b.id === id);
        if (!pages || !book) return;
        const read = get().booksRead.includes(id) ? get().booksRead : [...get().booksRead, id];
        set({ booksRead: read, openBook: id, panel: "codex" });
        get().addXp("Lore", 12);
        get().say(`Opened ${book.title}.`);
      },
      setOpenBook: (id) => set({ openBook: id }),
      setTalk: (talk) => set({ talk }),
      setNodes: (nodes) => set({ nodes }),
      setMirelings: (m) => set({ mirelings: m }),
      setEntered: () => set({ entered: true }),
      setTick: (n) => set({ tick: n }),
      setZoom: (z) => set({ zoom: clampZoom(z) }),
      setRunEnergy: (n) => set({ runEnergy: Math.min(RUN_MAX, Math.max(0, n)) }),
      setBoostUntil: (t) => set({ boostUntil: t }),
      setViewMode: (m) => set({ viewMode: m }),
      setPaused: (on) => set({ paused: on }),
      setAttackStyle: (style) => set({ attackStyle: style }),
      setTitheSync: (sync) => set({ titheSync: sync }),
      applyCommand: (result) => {
        const st = get();
        let pack = st.pack.map((item) => ({ ...item }));
        for (const spent of result.consume) {
          const hit = pack.find((item) => item.id === spent.itemId);
          if (hit) hit.qty -= spent.qty;
        }
        for (const grant of result.grants) {
          if (UNIQUE_REWARDS.has(grant.itemId) && pack.some((item) => item.id === grant.itemId && item.qty > 0)) {
            continue;
          }
          const hit = pack.find((item) => item.id === grant.itemId);
          if (hit) hit.qty += grant.qty;
          else pack.push({ id: grant.itemId, name: grant.name, qty: grant.qty });
        }
        pack = pack.filter((item) => item.qty > 0);
        let nodes = st.nodes;
        if (result.nodeCooldown) {
          const now = typeof performance !== "undefined" ? performance.now() : Date.now();
          nodes = st.nodes.map((node) =>
            node.id === result.nodeCooldown!.id
              ? { ...node, ready: false, readyAt: now + result.nodeCooldown!.cooldownMs }
              : node,
          );
        }
        const next: Partial<GameSnap> = {
          pack,
          nodes,
          tithe: result.tithe,
          titheReward: result.rewardGranted,
        };
        if (result.goldDelta) next.gold = st.gold + result.goldDelta;
        if (result.talk) next.talk = result.talk;
        if (result.panel !== undefined) {
          next.panel = result.panel;
          if (result.panel !== "codex") next.openBook = null;
        }
        if (result.say) {
          next.log = [...st.log, { t: Date.now(), text: result.say }].slice(-MAX_LOG);
          next.titheSync = { status: result.ok ? "accepted" : "rejected", text: result.say };
        }
        set(next);
        for (const grant of result.xp) get().addXp(grant.skill, grant.amount);
      },
      resetWorld: () =>
        set({
          tileX: SPAWN.x,
          tileY: SPAWN.y,
          hp: get().maxHp,
          nodes: seedNodes(),
          mirelings: freshMire(),
          runEnergy: RUN_MAX,
          boostUntil: 0,
        }),
    }),
    {
      name: "ashfen-keep-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tileX: s.tileX,
        tileY: s.tileY,
        dir: s.dir,
        hp: s.hp,
        maxHp: s.maxHp,
        skills: s.skills,
        pack: s.pack,
        gold: s.gold,
        booksRead: s.booksRead,
        overlays: s.overlays,
        entered: s.entered,
        zoom: s.zoom,
        viewMode: s.viewMode,
        tithe: s.tithe,
        titheReward: s.titheReward,
      }),
      merge: (persisted, current) => {
        const raw = { ...((persisted ?? {}) as Partial<GameSnap>) };
        delete (raw as { runEnergy?: number }).runEnergy;
        return {
          ...current,
          ...raw,
          tithe: raw.tithe ?? freshQuietTithe(),
          titheReward: raw.titheReward ?? false,
          titheSync: { status: "idle", text: "" },
          paused: false,
        };
      },
    },
  ),
);

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
import { freshQuietTithe, nextTithePhase, recordOffering, type QuietTithe } from "./quests";
import { DEFAULT_COSMETICS, normalizeCosmetics, type CharacterCosmetics } from "./cosmetics";
import { DEFAULT_PREFERENCES, normalizePreferences, type AshfenPreferences } from "./settings";
import { beginEmote, advanceEmote, type ActiveEmote, type EmoteId } from "./emotes";
import { craftRecipe, EMPTY_EQUIPMENT, type Equipment, type PvpStatus } from "./rpg";

export type Dir = "down" | "left" | "right" | "up";
export type Panel = "pack" | "skills" | "codex" | "map" | "attack" | null;

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

export type HudPreferences = {
  reduceEffects: boolean;
  largeUi: boolean;
  showMinimap: boolean;
  brightness: AshfenPreferences["brightness"];
  audio: AshfenPreferences["audio"];
};

export type NetworkStatus = "offline" | "connecting" | "connected" | "reconnecting" | "error";
export type RemotePlayer = { playerId: string; displayName: string; x: number; y: number; lastServerSeq: number };

type SkillState = Record<SkillId, { level: number; xp: number }>;
type PreferencePatch = Partial<Omit<AshfenPreferences, "audio">> & { audio?: Partial<AshfenPreferences["audio"]> };

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
  runToggle: boolean;
  walkSpeed: number;
  boostUntil: number;
  hud: HudPreferences;
  settingsOpen: boolean;
  controlsOpen: boolean;
  quietTithe: QuietTithe;
  networkStatus: NetworkStatus;
  networkPlayerCount: number;
  remotePlayers: RemotePlayer[];
  cosmetics: CharacterCosmetics;
  equipment: Equipment;
  pvpStatus: PvpStatus;
  activeEmote: ActiveEmote;
  addXp: (id: SkillId, amount: number) => void;
  addItem: (id: string, name: string, qty?: number) => void;
  craft: (recipeId: string) => boolean;
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
  setRunToggle: (on: boolean) => void;
  setBoostUntil: (t: number) => void;
  setHudPreference: <K extends keyof HudPreferences>(key: K, value: HudPreferences[K]) => void;
  setSettingsOpen: (open: boolean) => void;
  setControlsOpen: (open: boolean) => void;
  progressTithe: (event: "halden" | "wren" | "bind" | "light" | "report") => void;
  recordTitheOffering: (itemId: string) => void;
  finishTithe: () => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setNetworkPlayerCount: (count: number) => void;
  setRemotePlayers: (players: RemotePlayer[]) => void;
  setCosmetics: (next: Partial<CharacterCosmetics>) => void;
  setPreference: (next: PreferencePatch) => void;
  triggerEmote: (id: EmoteId) => void;
  advanceEmote: () => void;
  setPvpStatus: (status: PvpStatus) => void;
  applyAuthoritativeQuest: (quest: QuietTithe) => void;
  resetWorld: () => void;
};

const MAX_LOG = 24;

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
        { t: Date.now(), text: "WASD or click a tile. Scroll to zoom the realm." },
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
      runToggle: false,
      walkSpeed: 1,
      boostUntil: 0,
      hud: { ...DEFAULT_PREFERENCES },
      settingsOpen: false,
      controlsOpen: false,
      quietTithe: freshQuietTithe(),
      networkStatus: "offline",
      networkPlayerCount: 1,
      remotePlayers: [],
      cosmetics: DEFAULT_COSMETICS,
      equipment: EMPTY_EQUIPMENT,
      pvpStatus: { kind: "unskulled" },
      activeEmote: null,
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
      craft: (recipeId) => {
        const result = craftRecipe(recipeId, get().pack);
        if (!result.ok) {
          if (result.reason === "missing-materials") get().say("Not enough materials for that recipe.");
          return false;
        }
        set({ pack: result.pack });
        get().say(`Crafted ${result.result.name}.`);
        return true;
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
      setRunToggle: (on) => set({ runToggle: on }),
      setBoostUntil: (t) => set({ boostUntil: t }),
      setHudPreference: (key, value) => set({ hud: { ...get().hud, [key]: value } }),
      setSettingsOpen: (open) => set({ settingsOpen: open, controlsOpen: open ? false : get().controlsOpen }),
      setControlsOpen: (open) => set({ controlsOpen: open, settingsOpen: open ? false : get().settingsOpen }),
      progressTithe: (event) => {
        const next = nextTithePhase(get().quietTithe, event);
        if (next.phase !== get().quietTithe.phase) set({ quietTithe: next });
      },
      recordTitheOffering: (itemId) => {
        const next = recordOffering(get().quietTithe, itemId);
        if (next.offerings !== get().quietTithe.offerings) set({ quietTithe: next });
      },
      finishTithe: () => {
        const tithe = get().quietTithe;
        if (tithe.phase !== "report") return;
        set({ quietTithe: { ...tithe, phase: "complete", favor: Math.max(1, tithe.favor) } });
        get().addItem("staff", "Ash staff", 1);
        set({ gold: get().gold + 30 });
        get().addXp("Lore", 20);
        get().addXp("Binding", 30);
        get().say("Reedhaven remembers. Favor I earned.");
      },
      setNetworkStatus: (status) => set({ networkStatus: status }),
      setNetworkPlayerCount: (count) => set({ networkPlayerCount: Math.max(1, Math.floor(count)) }),
      setRemotePlayers: (players) => set({ remotePlayers: players, networkPlayerCount: players.length + 1 }),
      setCosmetics: (next) => set({ cosmetics: normalizeCosmetics({ ...get().cosmetics, ...next }) }),
      setPreference: (next) => {
        const prefs = normalizePreferences({ ...get().hud, ...next, audio: { ...get().hud.audio, ...(next.audio ?? {}) } });
        set({ hud: { ...get().hud, ...prefs } });
      },
      triggerEmote: (id) => set({ activeEmote: beginEmote(id, get().tick, get().tick + 1) }),
      advanceEmote: () => set({ activeEmote: advanceEmote(get().activeEmote, get().tick) }),
      setPvpStatus: (status) => set({ pvpStatus: status }),
      applyAuthoritativeQuest: (quest) => set({ quietTithe: quest }),
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
        runEnergy: s.runEnergy,
        hud: s.hud,
        quietTithe: s.quietTithe,
        cosmetics: s.cosmetics,
      }),
    },
  ),
);

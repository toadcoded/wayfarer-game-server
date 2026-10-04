import type { QuietTithe } from "./quests.ts";
import { freshQuietTithe } from "./quests.ts";

export const SAVE_KEY = "wayfarer.save.v4";
export const SAVE_VERSION = 4;

export type SaveBlob = {
  version: number;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  stamina: number;
  tick: number;
  trails: Record<string, boolean>;
  known: string;
  inventory: { id: string; name: string; qty: number }[];
  skills: { explore: number; forage: number; woodcraft: number; lore: number; binding: number };
  log: { t: number; msg: string }[];
  talked: boolean;
  nodeReady: Record<string, number>;
  gold: number;
  tithe: QuietTithe;
};

function parseTithe(raw: unknown): QuietTithe {
  const base = freshQuietTithe();
  if (!raw || typeof raw !== "object") return base;
  const t = raw as Partial<QuietTithe>;
  const phases = ["meet", "recipe", "gather", "bind", "light", "report", "complete"];
  return {
    phase: phases.includes(t.phase as string) ? (t.phase as QuietTithe["phase"]) : "meet",
    offerings: Array.isArray(t.offerings) ? (t.offerings as QuietTithe["offerings"]) : [],
    lantern: Boolean(t.lantern),
    rewarded: Boolean(t.rewarded),
  };
}

/**
 * Versioned save parser. v2/v3 persist world coordinates.
 * Legacy rounded tile IDs (v1 `tx`/`tz` without world x/z) are refused —
 * they must not be reinterpreted through floor mapping.
 */
export function parseSave(raw: unknown): SaveBlob | null {
  let d: Record<string, unknown>;
  try {
    d = typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : (raw as Record<string, unknown>);
  } catch {
    return null;
  }
  if (!d || typeof d !== "object") return null;
  const version = Number(d.version);
  if (version < 2 || version > SAVE_VERSION) return null;
  if (typeof d.x !== "number" || typeof d.z !== "number" || !Number.isFinite(d.x) || !Number.isFinite(d.z)) {
    return null;
  }
  const skillsIn = d.skills && typeof d.skills === "object" ? (d.skills as Record<string, number>) : {};
  return {
    version,
    x: d.x,
    z: d.z,
    yaw: typeof d.yaw === "number" ? d.yaw : Math.PI / 4,
    hp: typeof d.hp === "number" ? d.hp : 1,
    stamina: typeof d.stamina === "number" ? d.stamina : 1,
    tick: typeof d.tick === "number" ? d.tick : 0,
    trails: d.trails && typeof d.trails === "object" ? (d.trails as Record<string, boolean>) : {},
    known: typeof d.known === "string" ? d.known : "",
    inventory: Array.isArray(d.inventory) ? (d.inventory as SaveBlob["inventory"]) : [],
    skills: {
      explore: skillsIn.explore ?? 1,
      forage: skillsIn.forage ?? 1,
      woodcraft: skillsIn.woodcraft ?? 1,
      lore: skillsIn.lore ?? 1,
      binding: skillsIn.binding ?? 1,
    },
    log: Array.isArray(d.log) ? (d.log as SaveBlob["log"]) : [],
    talked: Boolean(d.talked),
    nodeReady: d.nodeReady && typeof d.nodeReady === "object" ? (d.nodeReady as Record<string, number>) : {},
    gold: typeof d.gold === "number" ? d.gold : 20,
    tithe: parseTithe(d.tithe),
  };
}

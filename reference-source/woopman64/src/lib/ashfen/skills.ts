import type { NodeKind, SkillId } from "./world";

export type SkillScript = {
  targetKind: NodeKind;
  skill: SkillId;
  requiredLevel: number;
  toolIds: string[];
  tickDelay: number;
  yieldItemId: string;
  yieldName: string;
  xp: number;
  cooldownMs: number;
};

/** Immutable content pack — original Reedhaven tables, not a legacy cache. */
export const SKILL_SCRIPTS: SkillScript[] = [
  {
    targetKind: "tree",
    skill: "Reedcut",
    requiredLevel: 1,
    toolIds: [],
    tickDelay: 2,
    yieldItemId: "reedwood",
    yieldName: "Reedwood",
    xp: 18,
    cooldownMs: 14000,
  },
  {
    targetKind: "ore",
    skill: "Delve",
    requiredLevel: 1,
    toolIds: [],
    tickDelay: 2,
    yieldItemId: "ash-ore",
    yieldName: "Ash ore",
    xp: 18,
    cooldownMs: 16000,
  },
  {
    targetKind: "fish",
    skill: "Angle",
    requiredLevel: 1,
    toolIds: [],
    tickDelay: 2,
    yieldItemId: "perch",
    yieldName: "Reed perch",
    xp: 16,
    cooldownMs: 12000,
  },
];

export function scriptFor(kind: NodeKind): SkillScript | undefined {
  return SKILL_SCRIPTS.find((s) => s.targetKind === kind);
}

export function canGather(
  kind: NodeKind,
  level: number,
  packIds: string[],
): { ok: boolean; reason?: string; script?: SkillScript } {
  const script = scriptFor(kind);
  if (!script) return { ok: false, reason: "unknown node" };
  if (level < script.requiredLevel) {
    return { ok: false, reason: `${script.skill} ${script.requiredLevel} needed`, script };
  }
  if (script.toolIds.length && !script.toolIds.some((id) => packIds.includes(id))) {
    return { ok: false, reason: "missing tool", script };
  }
  return { ok: true, script };
}

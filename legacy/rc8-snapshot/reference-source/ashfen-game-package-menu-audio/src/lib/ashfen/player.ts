import { SPAWN, type SkillId } from "./world.ts";
import { SKILLS } from "./world.ts";
import { DEFAULT_COSMETICS, normalizeCosmetics, type CharacterCosmetics } from "./cosmetics.ts";

export type Appearance = CharacterCosmetics & {
  cloak: "reed" | "keep" | "ash";
  staff: boolean;
  blade: boolean;
};

export type Character = {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  hp: number;
  maxHp: number;
  appearance: Appearance;
};

export function freshCharacter(name = "Wayfarer"): Character {
  return {
    id: "self",
    name,
    tileX: SPAWN.x,
    tileY: SPAWN.y,
    hp: 10,
    maxHp: 10,
    appearance: { ...DEFAULT_COSMETICS, cloak: "reed", staff: false, blade: false },
  };
}

export function normalizeAppearance(input: unknown): Appearance {
  const raw = input && typeof input === "object" ? input as Partial<Appearance> : {};
  return {
    ...normalizeCosmetics(raw),
    cloak: raw.cloak === "keep" || raw.cloak === "ash" ? raw.cloak : "reed",
    staff: raw.staff === true,
    blade: raw.blade === true,
  };
}

export function skillNeed(level: number): number {
  return level * 80;
}

export function applyXp(
  skills: Record<SkillId, { level: number; xp: number }>,
  id: SkillId,
  amount: number,
): { skills: Record<SkillId, { level: number; xp: number }>; leveled: boolean } {
  const next = { ...skills, [id]: { ...skills[id]! } };
  const cur = next[id]!;
  cur.xp += amount;
  let leveled = false;
  const need = skillNeed(cur.level);
  if (cur.xp >= need) {
    cur.xp -= need;
    cur.level += 1;
    leveled = true;
  }
  return { skills: next, leveled };
}

export const SKILL_ORDER: SkillId[] = [...SKILLS];

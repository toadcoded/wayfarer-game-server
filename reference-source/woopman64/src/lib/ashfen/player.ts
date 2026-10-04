import { SPAWN, type SkillId } from "./world";
import { SKILLS } from "./world";

export type Appearance = {
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
    appearance: { cloak: "reed", staff: false, blade: false },
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

import { type Skill, type Progression } from './progression.js';
import { type NoncombatSkill, type Skilling } from './skilling.js';
export declare const ALL_SKILLS: readonly ("attack" | "construction" | "strength" | "defence" | "ranged" | "magic" | "hitpoints" | "prayer" | "woodcutting" | "mining" | "fishing" | "agility" | "cooking" | "crafting" | "firemaking" | "fletching" | "herblore" | "runecrafting" | "slayer" | "smithing" | "thieving" | "farming" | "hunter")[];
export type SkillId = Skill | NoncombatSkill;
export declare const SKILL_DIRECTORY: Readonly<Record<SkillId, {
    id: SkillId;
    name: string;
    role: string;
    status: string;
    maxLevel: number;
}>>;
export declare function skillBonuses(id: SkillId, xp: number): {
    level: number;
    tier: number;
    requirementLevel: number;
    flatDamage: number;
    damageReduction: number;
    maxHealth: number | null;
    accuracyRating: number | null;
    gatheringCooldownTicks: number | null;
    capacity: number | null;
    status: string;
};
/** One owner per XP field: combat in Progression, noncombat in Skilling. Detached read model only. */
export declare function skillBook(p: Progression, s: Skilling): {
    bonuses: {
        level: number;
        tier: number;
        requirementLevel: number;
        flatDamage: number;
        damageReduction: number;
        maxHealth: number | null;
        accuracyRating: number | null;
        gatheringCooldownTicks: number | null;
        capacity: number | null;
        status: string;
    };
    level: number;
    xp: number;
    nextLevel: number | null;
    nextThreshold: number | null;
    remaining: number;
    fraction: number;
    maxed: boolean;
    id: SkillId;
    name: string;
    role: string;
    status: string;
    maxLevel: number;
}[];
export declare function meetsSkillRequirements(p: Progression, s: Skilling, requirements: Partial<Record<SkillId, number>>): boolean;

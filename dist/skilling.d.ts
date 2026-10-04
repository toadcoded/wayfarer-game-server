export declare const PROFESSIONS: readonly ["woodcutting", "mining", "fishing"];
export declare const SKILLING_SKILLS: readonly ["woodcutting", "mining", "fishing", "agility", "cooking", "crafting", "firemaking", "fletching", "herblore", "runecrafting", "slayer", "smithing", "thieving", "farming", "construction", "hunter"];
export type NoncombatSkill = typeof SKILLING_SKILLS[number];
export type Profession = typeof PROFESSIONS[number];
export declare const RESOURCES: readonly ["logs", "ore", "fish", "warden_essence"];
export type Resource = typeof RESOURCES[number];
export type SkillCommand = Profession | 'deposit' | 'upgrade';
export interface Skilling {
    xp: Record<NoncombatSkill, number>;
    pack: Record<Resource, number>;
    bank: Record<Resource, number>;
    toolTier: 1 | 2 | 3;
    readyTick: number;
}
export declare const TOOL_RECIPES: Readonly<{
    2: Readonly<{
        level: 2;
        material: 3;
        essence: 1;
        name: "Artisan";
    }>;
    3: Readonly<{
        level: 5;
        material: 20;
        essence: 5;
        name: "Masterwork";
    }>;
}>;
export declare const freshSkilling: () => Skilling;
export declare const isSkillCommand: (v: unknown) => v is SkillCommand;
export declare function checkedSkilling(value: unknown): Skilling;
export type SkillResult = 'skill_gathered' | 'skill_wait' | 'skill_pack_full' | 'skill_banked' | 'skill_bank_full' | 'skill_upgraded' | 'skill_requirements' | 'skill_max_tool';
/** Called only inside the detached server transaction after a range check. */
export declare function skillAction(s: Skilling, command: SkillCommand, tick: number): SkillResult;
export declare function awardWardenEssence(s: Skilling): void;
export declare function gatheringBonuses(xp: number): {
    level: number;
    cooldownTicks: number;
    toolYieldBonus: number;
};
export declare function awardNoncombatXP(s: Skilling, skill: NoncombatSkill, amount: number): void;
export declare function migrateSkilling(value: unknown): Skilling;

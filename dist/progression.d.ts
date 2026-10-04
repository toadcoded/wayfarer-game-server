/** Server-owned independent combat XP and capped exponential levels. */
export declare const SKILLS: readonly ["attack", "strength", "defence", "ranged", "magic", "hitpoints", "prayer"];
export type Skill = typeof SKILLS[number];
export declare const TRAINING_MODES: readonly ["attack", "strength", "defence", "magic"];
export type TrainingMode = typeof TRAINING_MODES[number];
export interface Progression {
    xp: Record<Skill, number>;
    mode: TrainingMode;
}
export declare const XP_LEVEL_99 = 13034431;
export declare const MAX_XP = 200000000;
export declare const freshProgression: () => Progression;
export declare const isTrainingMode: (v: unknown) => v is TrainingMode;
export declare function checkedProgression(v: unknown): Progression;
export declare const MAX_LEVEL = 99, MAX_COMBAT_LEVEL = 126;
/** Cumulative classic exponential XP thresholds. */
export declare const XP_THRESHOLDS: readonly number[];
export declare function xpForLevel(n: number): number;
export declare function level(xp: number): number;
export declare function xpProgress(xp: number): {
    level: number;
    xp: number;
    nextLevel: number | null;
    nextThreshold: number | null;
    remaining: number;
    fraction: number;
    maxed: boolean;
};
export declare function levels(p: Progression): Record<Skill, number>;
export declare function combatLevel(p: Progression): number;
export declare function combatBonuses(p: Progression): {
    meleeDamage: number;
    magicDamage: number;
    damageReduction: number;
    maxHealth: number;
    accuracyRating: number;
    rangedAccuracyRating: number;
    magicAccuracyRating: number;
};
export declare function awardSkillXP(p: Progression, skill: Skill, amount: number): void;
export declare function migrateProgression(value: unknown): Progression;
export declare function eligible(p: Progression, requirements: Partial<Record<Skill, number>>): boolean;
export declare function awardDamage(p: Progression, damage: number): void;
/** Fifteen level bands, separate from an item's requirements, speed, price or identity. */
export declare const TIER_LEVELS: readonly number[];

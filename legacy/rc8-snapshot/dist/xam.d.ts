import { NavigationWorld } from './navigation.js';
import type { Point } from './world.js';
export declare const XAM_ID: "xam";
export declare const XAM_MAX_TRAINING_TICKS: number;
export declare const XAM_SKILLS: readonly ["agility", "attack", "cooking", "crafting", "defence", "farming", "firemaking", "fishing", "fletching", "herblore", "magic", "mining", "prayer", "ranged", "runecrafting", "smithing", "strength", "woodcutting"];
export type XamSkill = typeof XAM_SKILLS[number];
export interface XamSkillProgress {
    skill: XamSkill;
    xp: number;
    sessions: number;
}
export interface XamSnapshot {
    id: typeof XAM_ID;
    name: 'Xam';
    position: Point;
    currentSkill: XamSkill;
    activity: string;
    flavor: string;
    skillStartedTick: number;
    skillEndsAtTick: number;
    lastProgressTick: number;
    rewardPips: number;
    discoveries: number;
    switches: number;
    protected: true;
    untouchable: true;
    autoRetaliate: false;
    collision: 'nonblocking';
    armor: 'legendary_holographic_rustic';
    mainHand: 'diamond_scythe';
    offHand: 'gilded_secateurs';
    progress: XamSkillProgress[];
}
export interface XamHealth {
    status: 'healthy' | 'attention';
    skillAgeTicks: number;
    skillRemainingTicks: number;
    sinceProgressTicks: number;
    blockedTicks: number;
    capTicks: number;
}
export declare const isXamSkill: (v: unknown) => v is XamSkill;
export declare function checkedXamSnapshot(value: unknown, tick: number): XamSnapshot;
/** Server-owned autonomous training character. It has no network decoder, HP, target or retaliation path. */
export declare class XamController {
    private readonly nav;
    private readonly camp;
    private readonly beacon;
    private state;
    constructor(nav: NavigationWorld, camp: Point, beacon: Point);
    private random;
    private chooseSkill;
    private chooseTarget;
    private startSession;
    stagedAdvance(tick: number, requested?: XamSkill): XamController;
    snapshot(): XamSnapshot;
    health(tick: number): XamHealth;
    inspection(tick: number): {
        health: XamHealth;
        target: {
            x: number;
            z: number;
        };
        rng: number;
        nextFlavorTick: number;
        id: typeof XAM_ID;
        name: "Xam";
        position: Point;
        currentSkill: XamSkill;
        activity: string;
        flavor: string;
        skillStartedTick: number;
        skillEndsAtTick: number;
        lastProgressTick: number;
        rewardPips: number;
        discoveries: number;
        switches: number;
        protected: true;
        untouchable: true;
        autoRetaliate: false;
        collision: "nonblocking";
        armor: "legendary_holographic_rustic";
        mainHand: "diamond_scythe";
        offHand: "gilded_secateurs";
        progress: XamSkillProgress[];
    };
}

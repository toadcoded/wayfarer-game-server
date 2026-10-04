import { RealmRuntime } from './realm-runtime.js';
import type { NavigationWorld } from './navigation.js';
import type { Point } from './world.js';
import type { PlayerSave } from './persistence.js';
export declare const XAM_MAX_FOCUS_TICKS: number;
/** Trusted host controller; sends ordinary validated intents, never edits XP or inventory. */
export declare class XamAgent {
    private realm;
    private nav;
    private camp;
    private goal;
    private accepted?;
    readonly connection = "@server-npc/xam";
    readonly id: string;
    private moveSequence;
    private actionSequence;
    private pending;
    private lastTick;
    private path;
    private pathGoal;
    private retryTick;
    private focusStartedTick;
    cursor: number;
    phase: string;
    constructor(realm: RealmRuntime, nav: NavigationWorld, camp: Point, goal: Point, save?: PlayerSave, cursor?: number, accepted?: ((packet: string) => void) | undefined);
    private send;
    private action;
    private move;
    step(): void;
    export(): {
        cursor: number;
        save: PlayerSave;
    };
    examine(): {
        kind: string;
        id: string;
        name: string;
        position: {
            x: number;
            y: number;
            z: number;
        };
        phase: string;
        totalXp: number;
        totalLevel: number;
        skills: {
            id: import("./skill-directory.js").SkillId;
            level: number;
            xp: number;
        }[];
        inventory: {
            slots: ("reed_blade" | "ash_staff" | "granite_maul" | null)[];
            weapon: import("./inventory.js").ItemId | null;
            rewardClaimed: boolean;
        };
        pack: {
            logs: number;
            ore: number;
            fish: number;
            warden_essence: number;
        };
        bank: {
            logs: number;
            ore: number;
            fish: number;
            warden_essence: number;
        };
        protected: boolean;
        untouchable: boolean;
        autoRetaliate: boolean;
        collision: string;
        armor: string;
        mainHand: string;
        offHand: string;
        examine: string;
    };
}
export declare const XAM_TASK_COUNT: number;

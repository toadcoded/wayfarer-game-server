import type { Point } from './world.js';
import type { ItemId } from './inventory.js';
export declare const WEAPONS: Readonly<{
    unarmed: Readonly<{
        damage: 4;
        range: 3;
        cooldown: 16;
    }>;
    reed_blade: Readonly<{
        damage: 7;
        range: 3;
        cooldown: 12;
    }>;
    ash_staff: Readonly<{
        damage: 9;
        range: 8;
        cooldown: 24;
    }>;
    granite_maul: Readonly<{
        damage: 16;
        range: 3;
        cooldown: 32;
    }>;
    steel_warhammer: Readonly<{
        damage: 18;
        range: 3;
        cooldown: 30;
    }>;
    steel_battleaxe: Readonly<{
        damage: 19;
        range: 3;
        cooldown: 32;
    }>;
    steel_dagger: Readonly<{
        damage: 10;
        range: 3;
        cooldown: 10;
    }>;
    steel_sword: Readonly<{
        damage: 15;
        range: 3;
        cooldown: 16;
    }>;
    steel_rapier: Readonly<{
        damage: 13;
        range: 3.5;
        cooldown: 13;
    }>;
}>;
export interface Fighter {
    hp: number;
    attackReady: number;
    guardReady: number;
    guardUntil: number;
    recoverAt: number;
    wins: number;
    contributed: boolean;
}
export interface Encounter {
    hp: number;
    strikeAt: number;
    respawnAt: number;
    round: number;
}
export declare const freshFighter: (maxHealth?: number) => Fighter;
export declare const freshEncounter: () => Encounter;
export declare const distance: (a: Point | undefined, b: Point) => number;
export declare function combatAction(f: Fighter, e: Encounter, kind: 'attack' | 'guard', weapon: ItemId | null, pos: Point | undefined, target: Point, tick: number, damageBonus?: number): "recovering" | "guard_cooldown" | "guarding" | "warden_resting" | "out_of_range" | "attack_cooldown" | "warden_defeated" | "attack_hit";
export declare function finishEncounter(e: Encounter, players: {
    fighter: Fighter;
    position: Point | undefined;
    maxHealth?: number;
    damageReduction?: number;
    protectedCombat?: boolean;
}[], target: Point, camp: Point, tick: number): void;
export declare function checkedFighter(value: unknown, tick: number, maxHealth?: number): Fighter;
export declare function checkedEncounter(value: unknown, tick: number): Encounter;

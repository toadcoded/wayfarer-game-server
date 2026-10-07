import type { Point } from './world.js';
import type { NavigationWorld } from './navigation.js';
import { type Fighter } from './encounter.js';
import { type Inventory, type ItemId } from './inventory.js';
import { type Progression } from './progression.js';
export type MeleeStyle = 'slash' | 'crush' | 'strike' | 'lunge';
export declare const HOSTILE_KINDS: readonly ["skeleton", "zombie", "thug", "bandit", "mugger"];
export type HostileKind = typeof HOSTILE_KINDS[number];
export declare const HOSTILE_CAMPS: readonly ["skeleton-grave", "zombie-marsh", "thug-campsite"];
export type HostileCampId = typeof HOSTILE_CAMPS[number];
export type HostileAttack = 'slash' | 'crush' | 'strike' | 'lunge' | 'arrow' | 'spell';
export interface HostileCamp {
    id: HostileCampId;
    name: string;
    position: Point;
    radius: number;
    multiCombat: boolean;
}
export interface HostileMob {
    id: string;
    camp: HostileCampId;
    kind: HostileKind;
    home: Point;
    position: Point;
    hp: number;
    maxHp: number;
    target: string | null;
    attackAt: number;
    respawnAt: number;
}
export interface HostileProjectile {
    id: string;
    owner: string;
    target: string;
    kind: 'arrow' | 'spell';
    skill: 'ranged' | 'magic';
    position: Point;
    launchTick: number;
    impactTick: number;
    damage: number;
    sequence: number;
}
export interface GroundLoot {
    id: string;
    item: ItemId;
    position: Point;
    bornTick: number;
    expiresTick: number;
}
export interface HostileWorld {
    camps: HostileCamp[];
    mobs: HostileMob[];
    projectiles: HostileProjectile[];
    loot: GroundLoot[];
    rng: number;
    nextProjectile: number;
    nextLoot: number;
}
export interface HostilePlayer {
    id: string;
    position: Point;
    fighter: Fighter;
    inventory: Inventory;
    progression: Progression;
    lifePack: {
        arrows: number;
        runes: number;
    };
    ward: boolean;
    protectedCombat?: boolean;
}
export interface HostileEvent {
    playerId: string;
    sequence?: number | undefined;
    code: string;
    target?: string;
    damage?: number;
    item?: ItemId;
}
export declare const HOSTILE_RESULT_TEXT: {
    readonly enemy_unavailable: "That enemy is no longer available.";
    readonly style_incompatible: "Your weapon cannot use that attack style.";
    readonly combat_protected: "Combat is disabled in this protected area.";
    readonly enemy_drop: "A rare steel weapon has dropped nearby.";
    readonly enemy_defeated: "Enemy defeated. Watch for nearby attackers.";
    readonly enemy_hit: "Your attack hit the enemy.";
    readonly projectile_busy: "Too many projectiles are already in flight.";
    readonly projectile_fired: "Projectile launched; damage resolves on impact.";
    readonly projectile_hit: "Projectile impact resolved.";
    readonly projectile_miss: "The target was gone before impact.";
    readonly hostile_strike: "You are under attack; retreat, guard or use protection.";
    readonly loot_unavailable: "That drop is no longer available.";
    readonly loot_range: "Move closer to collect the drop.";
    readonly loot_collected: "Steel weapon collected.";
};
export type HostileCommand = {
    kind: 'attack';
    target: string;
    style: MeleeStyle;
} | {
    kind: 'projectile';
    target: string;
    projectile: 'arrow' | 'spell';
} | {
    kind: 'loot';
    lootId: string;
};
export declare function parseHostileCommand(value: unknown): HostileCommand | undefined;
export declare const isHostileCommand: (value: unknown) => value is string;
/** The only drop source: every listed gear item is rolled independently at exactly 5%. */
export declare function rollHostileDrop(kind: HostileKind, unit: number): ItemId | undefined;
export declare function createHostileWorld(camp: Point, beacon: Point, nav?: NavigationWorld): HostileWorld;
export declare function checkedHostileWorld(value: unknown, tick: number): HostileWorld;
export declare function attackHostile(world: HostileWorld, player: HostilePlayer, targetId: string, style: MeleeStyle, tick: number, sequence: number): HostileEvent[];
export declare function launchHostileProjectile(world: HostileWorld, player: HostilePlayer, targetId: string, kind: 'arrow' | 'spell', tick: number, sequence: number): HostileEvent[];
export declare function collectHostileLoot(world: HostileWorld, player: HostilePlayer, lootId: string, tick: number, sequence: number): HostileEvent[];
/** Advance enemy decisions and delayed projectile impacts only from the server's fixed tick. */
export declare function advanceHostileWorld(world: HostileWorld, players: HostilePlayer[], tick: number, nav?: NavigationWorld): HostileEvent[];
export declare function hostileView(world: HostileWorld): Pick<HostileWorld, 'camps' | 'mobs' | 'projectiles' | 'loot'>;
export declare function checkedHostileView(value: unknown, tick: number): Pick<HostileWorld, 'camps' | 'mobs' | 'projectiles' | 'loot'>;

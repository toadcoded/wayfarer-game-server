import type { Point } from './world.js';
import type { WalkCheck } from './navigation.js';
import type { HeroAppearance } from './hero-appearance.js';
import type { Skin } from './game-actions.js';
export declare const NPC_IDS: readonly ["halden", "pin", "mirella", "branik", "elowen", "tovik", "yarrow", "kestrel"];
export type NPCId = typeof NPC_IDS[number];
export interface NPCPrototype {
    name: string;
    role: string;
    skin: Skin;
    coat: string;
    trim: string;
    scale: number;
    appearance: HeroAppearance;
    lines: readonly string[];
}
export declare const NPC_PROTOTYPES: Readonly<Record<NPCId, NPCPrototype>>;
export interface NPCPlacement {
    id: NPCId;
    position: Point;
}
/** Fixed ordering and bounded retries; only navigation-checked landing ground. */
export declare function placeRealmCast(camp: Point, goal: Point, check: (p: Point) => WalkCheck): NPCPlacement[];
export declare function nearestNPC(placements: readonly NPCPlacement[], position: Point | undefined, range?: number): NPCPlacement | undefined;

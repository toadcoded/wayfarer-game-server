import { type ResonanceNodeId, type ResonanceEffect } from './resonance-codex.js';
import type { GameState } from './game-actions.js';
import type { RealmSnapshot } from './replication.js';
import type { NPCPlacement } from './npc-prototypes.js';
export interface RealmInterfaceUpdate {
    snapshot: RealmSnapshot | undefined;
    game: GameState | undefined;
    localId: string | undefined;
    npcs: readonly NPCPlacement[];
    now: number;
}
export interface RealmInterfaceController {
    update(input: RealmInterfaceUpdate): void;
    system(message: string): void;
    connection(connected: boolean): void;
    dispose(): void;
}
export declare function initRealmInterface(doc?: Document, onSelection?: (ids: readonly ResonanceNodeId[], effect?: ResonanceEffect) => void, onCast?: (value: string) => void): RealmInterfaceController;

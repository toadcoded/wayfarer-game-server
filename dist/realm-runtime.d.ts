import { type GameState } from './game-actions.js';
import type { Point } from './world.js';
import { type ClockAdvance } from './fixed-clock.js';
import { NavigationWorld, type XZ } from './navigation.js';
import { type RealmSnapshot } from './replication.js';
import type { PlayerSnapshot } from './movement.js';
import { type PlayerSave } from './persistence.js';
export interface RealmOptions {
    capacity?: number;
    visibilityRadius?: number;
    beacon?: Point;
    camp?: Point;
    codex?: Point;
}
export interface RealmJoinTraits {
    combatProtected?: boolean;
}
/** In-process authoritative realm. Authentication and sockets belong to its host adapter. */
export declare class RealmRuntime {
    private committed;
    private get session();
    private readonly clock;
    private readonly identities;
    private nextIdentity;
    private get tickNumber();
    private advancing;
    private failed;
    readonly visibilityRadius: number;
    constructor(nav: NavigationWorld, options?: RealmOptions);
    get tick(): number;
    get size(): number;
    get status(): 'active' | 'faulted';
    private requireActive;
    /** Host binds an opaque connection to a server-selected spawn. No client identity field. */
    join(connectionId: string, spawn: XZ, saved?: PlayerSave, traits?: RealmJoinTraits): {
        id: string;
        state: PlayerSnapshot;
    };
    receive(connectionId: string, packet: string): boolean;
    leave(connectionId: string): boolean;
    stateFor(connectionId: string): PlayerSnapshot | undefined;
    exportPlayer(connectionId: string): PlayerSave | undefined;
    /** Called by the host's monotonic timer, never by packet handlers. Hook supports local bots/preview. */
    advance(elapsedMs: number, beforeTick?: () => void): ClockAdvance;
    gameStateFor(connectionId: string): GameState | undefined;
    /** Detached last-good diagnostics. No connection identifiers or live mutable objects. */
    inspection(): {
        tick: number;
        pendingMs: number;
        nextIdentity: number;
        players: {
            state: PlayerSnapshot;
            intent: {
                sequence: number;
                dx: number;
                dz: number;
                mode?: import("./movement.js").TravelMode;
            };
            inputTick: number;
            options: {
                speed: number;
                ticksPerSecond: number;
                idleTimeoutTicks: number;
            };
            currentSpeed: number;
            energy: number;
            exhausted: boolean;
            id: string;
        }[];
        game: {
            encounter: {
                hp: number;
                strikeAt: number;
                respawnAt: number;
                round: number;
            };
            revision: number;
            tick: number;
            beacon: {
                position: {
                    x: number;
                    y: number;
                    z: number;
                };
                lit: boolean;
            };
            camp: {
                x: number;
                y: number;
                z: number;
            };
            patch: {
                stock: number;
                respawnTick: number;
            };
            players: {
                id: string;
                skin: "adventurer" | "seraphine" | "elder" | "traveler" | "villager" | "vector";
                sequence: number;
                pending: import("./game-actions.js").Action[];
                result: import("./game-actions.js").Result | null;
                quest: import("./game-actions.js").QuestState;
                inventory: import("./inventory.js").Inventory;
                fighter: import("./encounter.js").Fighter;
                progression: import("./progression.js").Progression;
                skilling: import("./skilling.js").Skilling;
                resonance: import("./resonance-authority.js").ResonanceState;
                practiceReadyTick: number;
                practiceChallenge: import("./practice-interaction.js").PracticeChallenge | null;
            }[];
        } | null;
    };
    /** Preview resume discards a fractional tick; a production host normally keeps running. */
    resetClock(): void;
    snapshotFor(connectionId: string): RealmSnapshot | undefined;
}

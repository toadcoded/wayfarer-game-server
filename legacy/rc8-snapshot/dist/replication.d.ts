import type { Point } from './world.js';
export declare const MAX_SNAPSHOT_BYTES = 131072;
export declare const MAX_PLAYERS = 256;
export declare const WORLD_LIMIT = 1000000;
export interface ReplicaPlayer {
    id: string;
    position: Point;
    lastInputSequence: number;
    blocked: boolean;
}
export interface RealmSnapshot {
    version: 1;
    tick: number;
    simulationTimeMs: number;
    players: ReplicaPlayer[];
}
export declare function checkedSnapshot(value: unknown): RealmSnapshot;
export declare function decodeRealmSnapshot(text: string): RealmSnapshot;
export declare function encodeRealmSnapshot(snapshot: RealmSnapshot): string;

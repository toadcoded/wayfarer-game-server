import { type RealmSnapshot, type ReplicaPlayer } from './replication.js';
export interface BufferedFrame {
    players: ReplicaPlayer[];
    stale: boolean;
    ageMs: number;
    tick: number;
}
/** Presentation only. Interpolates known positions; never extrapolates or changes authority. */
export declare class SnapshotBuffer {
    readonly delayMs: number;
    private frames;
    private receivedAt;
    private presentedTime;
    constructor(delayMs?: number);
    get size(): number;
    clear(): void;
    push(value: RealmSnapshot, receivedAt: number): boolean;
    sample(now: number): BufferedFrame;
}

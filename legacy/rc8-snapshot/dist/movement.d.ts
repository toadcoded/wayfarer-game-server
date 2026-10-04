import { NavigationWorld, type XZ } from './navigation.js';
import type { Point } from './world.js';
export interface MoveIntent {
    sequence: number;
    dx: number;
    dz: number;
}
export interface PlayerSnapshot {
    position: Point;
    tick: number;
    lastInputSequence: number;
    blocked: boolean;
}
export interface WalkerOptions {
    speed?: number;
    ticksPerSecond?: number;
    idleTimeoutTicks?: number;
}
/** Client sends a direction and sequence only. No position, speed, elapsed time or player id. */
export declare function decodeMoveIntent(text: string): MoveIntent;
export declare function encodeMoveIntent(intent: MoveIntent): string;
/** Pure single movement step; the authoritative caller owns speed and dt. */
export declare function stepMovement(nav: NavigationWorld, position: Point, direction: XZ, speed: number, dtSeconds: number): {
    position: Point;
    blocked: boolean;
};
/** Call advance() once per HOST simulation tick, never once per incoming packet. */
export declare class ServerWalker {
    private nav;
    private position;
    private intent;
    private tickNumber;
    private inputTick;
    private lastSequence;
    private blocked;
    readonly options: Readonly<Required<WalkerOptions>>;
    constructor(nav: NavigationWorld, spawn: XZ, opts?: WalkerOptions);
    receiveInput(text: string): boolean;
    /** Compute a detached candidate. Navigation is read-only; no live walker changes. */
    stagedAdvance(): ServerWalker;
    advance(): PlayerSnapshot;
    /** Detached deterministic diagnostic state, including held input and its age. */
    inspection(): {
        state: PlayerSnapshot;
        intent: {
            sequence: number;
            dx: number;
            dz: number;
        };
        inputTick: number;
        options: {
            speed: number;
            ticksPerSecond: number;
            idleTimeoutTicks: number;
        };
    };
    snapshot(): PlayerSnapshot;
}

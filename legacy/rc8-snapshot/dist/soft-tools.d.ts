import { SoftPatch } from './soft-patch.js';
import { Multitool } from './multitool.js';
/** Testable local controller shared by mesh UI buttons and shortcuts. */
export declare class SoftTools {
    readonly patch: SoftPatch;
    paused: boolean;
    reducedMotion: boolean;
    selected: number;
    lastMessage: string;
    readonly registry: Multitool;
    constructor(onFocus?: () => void, onWireframe?: () => void);
    selectedForce(): import("./soft-patch.js").ForceVector;
    select(index: number): void;
    advance(ms: number): void;
}

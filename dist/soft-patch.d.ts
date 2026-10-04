import { type ABCWind } from './abc-wind.js';
export interface ForceVector {
    x: number;
    y: number;
    z: number;
}
/** Small anchored cloth patch for the mesh lab; no world/self collision. */
export declare class SoftPatch {
    readonly columns = 7;
    readonly rows = 9;
    readonly positions: Float32Array;
    readonly indices: Uint32Array;
    private abc;
    private seconds;
    private wind;
    private previous;
    private anchors;
    private remainder;
    constructor();
    /** Wind is acceleration; gravity is added separately. Vector length is capped at 12. */
    setWind(vector: ForceVector): void;
    getWind(): ForceVector;
    setABC(options: ABCWind): void;
    getABC(): ABCWind;
    get simulationSeconds(): number;
    forceAt(point: ForceVector): ForceVector;
    reset(): void;
    private validateVector;
    /** Local grid-radius impulse. Anchors are immutable; accumulated speed is capped at 6. */
    impulse(point: number, vector: ForceVector, radius?: number): number;
    advance(elapsedMs: number): {
        steps: number;
        droppedMs: number;
    };
    private step;
    private constrain;
}

import type { Point } from './world.js';
export interface CharacterPose {
    phase: number;
    stride: number;
    lean: number;
    cloth: number;
    facing: number;
    breath: number;
    sway: number;
    headBob: number;
}
/** Bounded presentation simulation. Never feeds back into authoritative position or collision. */
export declare class CharacterMotion {
    private previous;
    private clock;
    private phase;
    private stride;
    private lean;
    private velocity;
    private cloth;
    private clothVelocity;
    private facing;
    private idleTime;
    reset(): void;
    sample(position: Point, now: number, reduced?: boolean): CharacterPose;
}
/** Remove the supplied assets' saturated magenta matte only at rendering time. */
export declare function keyMagenta(data: Uint8ClampedArray): void;
export declare function animationFrame(durations: readonly number[], elapsedMs: number): number;

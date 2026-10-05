import { Scene, TransformNode } from '@babylonjs/core';
import type { Point } from './world.js';
export interface CelestialExpansion {
    readonly observatory: TransformNode;
    readonly cavern: TransformNode;
    update(now: number, paused: boolean, activeEffect?: string): void;
    dispose(): void;
}
/**
 * Procedural art layer inspired by the supplied orchard, crystal mine, luminous
 * forest, enchanted archive and neon observatory references. It owns no game
 * state and cannot award XP, move actors, or mutate collision.
 */
export declare function createCelestialExpansion(scene: Scene, camp: Point, codex: Point, cavernPoint: Point): CelestialExpansion;

import { Scene } from '@babylonjs/core';
import { type WildlifeNPC } from './wildlife.js';
import type { GroundSampler } from './navigation.js';
/** Bounded decorative NPC layer. Wildlife is never pickable, collidable or registered as a fighter. */
export declare class Wildlife3D {
    private scene;
    private ground;
    private animals;
    private materials;
    private disposed;
    constructor(scene: Scene, ground: GroundSampler);
    get count(): number;
    sync(npcs: readonly WildlifeNPC[]): void;
    update(now: number, paused: boolean): void;
    dispose(): void;
}

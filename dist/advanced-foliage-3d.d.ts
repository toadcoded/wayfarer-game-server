import { TransformNode, type Scene } from '@babylonjs/core';
import type { GroundSampler } from './navigation.js';
import type { Point } from './world.js';
export declare class AdvancedFoliage3D {
    private scene;
    private ground;
    readonly root: TransformNode;
    private readonly trees;
    private readonly materials;
    private disposed;
    constructor(scene: Scene, seed: number, anchors: readonly Point[], ground: GroundSampler);
    update(now: number, paused: boolean): void;
    get count(): number;
    dispose(): void;
}

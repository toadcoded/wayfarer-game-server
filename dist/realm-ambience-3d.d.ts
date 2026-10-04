import { Scene, TransformNode } from '@babylonjs/core';
import type { Point } from './world.js';
/** Bounded decorative scene. No collision, networking, reward or persistence authority. */
export declare class RealmAmbience3D {
    private scene;
    private seed;
    readonly root: TransformNode;
    private materials;
    private balloons;
    private toys;
    private flies;
    private sparks;
    private lightning;
    private child;
    private woodcutter;
    private disposed;
    readonly childPosition: Point;
    readonly woodcutterPosition: Point;
    constructor(scene: Scene, seed: number, anchors: readonly Point[], height: (p: Point) => number, cast?: {
        pin: Point;
        branik: Point;
    });
    update(now: number, paused: boolean, flashes?: boolean): string | undefined;
    dispose(): void;
}

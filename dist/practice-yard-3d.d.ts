import { type Scene, type Mesh } from '@babylonjs/core';
import type { Point } from './world.js';
export declare const PRACTICE_FIXTURES: readonly [{
    readonly name: "dummy";
    readonly dx: -1;
    readonly dz: -1.4;
}, {
    readonly name: "altar";
    readonly dx: 0;
    readonly dz: -1.4;
}, {
    readonly name: "bench";
    readonly dx: 1;
    readonly dz: -1.4;
}, {
    readonly name: "course";
    readonly dx: -1;
    readonly dz: 1.4;
}, {
    readonly name: "pond";
    readonly dx: 0;
    readonly dz: 1.4;
}, {
    readonly name: "garden";
    readonly dx: 1;
    readonly dz: 1.4;
}];
/** Small cosmetic fixtures: no collision, combat targets, resource yield or clocks. */
export declare function createPracticeYard(scene: Scene, camp: Point, check: (p: Point) => {
    ok: boolean;
    position?: Point;
}): {
    meshes: Mesh[];
    dispose(): void;
};

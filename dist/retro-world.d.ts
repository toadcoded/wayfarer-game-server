import { Mesh, type Scene } from '@babylonjs/core';
import type { Point } from './world.js';
import type { GroundSampler } from './navigation.js';
export declare const RETRO_PALETTE: Readonly<{
    grass: "#75a342";
    grassLight: "#b2c96a";
    grassDark: "#3a6738";
    earth: "#85774f";
    sky: "#172b48";
    water: "#3f91ad";
    gold: "#d5b578";
}>;
/** Renderer-only deterministic foliage: at most256 tufts, three blades per tuft, one draw mesh. */
export declare function grassGeometry(seed: number, anchors: readonly Point[], ground: GroundSampler): {
    positions: number[];
    indices: number[];
    colors: number[];
    centres: Point[];
};
export declare function createRetroGrass(scene: Scene, seed: number, anchors: readonly Point[], ground: GroundSampler): {
    mesh: Mesh;
    count: number;
    dispose(): void;
};
/** Matte saturated colours and deterministic terrain vertex tint without moving any geometry. */
export declare function styleRetroMesh(mesh: Mesh, terrain?: boolean): void;

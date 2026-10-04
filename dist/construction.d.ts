import type { Point } from './world.js';
import type { GroundSampler, GroundSample, Bounds, Collider } from './navigation.js';
import type { TerrainMesh, Primitive } from './geometry.js';
export declare const CONSTRUCTION_VERSION = 1;
/** Flat interior plus a smooth earthwork skirt. All bounds use integer world coordinates. */
export interface FoundationPad {
    id: string;
    bounds: Bounds;
    elevation: number;
    blend: number;
}
/** An axis-aligned, linear walkable surface, suitable for a deck or ramp. */
export interface WalkSurface {
    id: string;
    bounds: Bounds;
    axis: 'x' | 'z';
    startY: number;
    endY: number;
    thickness: number;
    color: string;
}
export interface MeshData {
    positions: Float32Array;
    indices: Uint32Array;
    color: string;
}
export declare const contains: (b: Bounds, x: number, z: number) => boolean;
export declare function surfaceHeight(surface: WalkSurface, x: number, z: number): number;
/** Terrain edits and support surfaces share this single authority with render geometry. */
export declare class ConstructionWorld {
    private readonly base;
    private pads;
    private supports;
    private revisionNumber;
    get revision(): number;
    constructor(base: GroundSampler);
    addPad(pad: FoundationPad): void;
    addSurface(surface: WalkSurface): void;
    removeSurface(id: string): boolean;
    removePad(id: string): boolean;
    private vertexHeight;
    /** A globally aligned 1-unit lattice, using the same triangle diagonal as the mesh. */
    terrainAt(x: number, z: number): GroundSample;
    /** 2.5D: selects a support above terrain. Walking beneath bridges is intentionally unsupported. */
    sample: (x: number, z: number) => GroundSample;
    /** Replace the original ground mesh in edited areas; do not render both layers. */
    terrainMesh(bounds: Bounds, color: string): TerrainMesh;
}
/** Closed six-face prism. Its top is exactly surfaceHeight at every point. */
export declare function surfaceMesh(s: WalkSurface): MeshData;
/** Side rails are conservative solid bounds; the deck/ramp itself is a support, not an obstacle. */
export declare function railColliders(s: WalkSurface, railHeight?: number, railWidth?: number): Collider[];
export declare function railMeshes(s: WalkSurface, height?: number, width?: number): MeshData[];
/** Foundation facing ends below the ground plane, avoiding duplicate coplanar floor faces. */
export declare function foundationStones(base: GroundSampler, pad: FoundationPad, color: string): Primitive[];
export declare function pointOnSurface(s: WalkSurface, t: number): Point;

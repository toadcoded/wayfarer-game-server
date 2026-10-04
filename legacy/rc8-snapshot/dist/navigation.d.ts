import { type WorldConfig, type Point } from './world.js';
import type { Primitive } from './geometry.js';
export interface XZ {
    x: number;
    z: number;
}
export interface Bounds {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}
export interface GroundSample {
    height: number;
    slopeDegrees: number;
    waterDepth: number;
}
export type GroundSampler = (x: number, z: number) => GroundSample;
export interface Collider extends Bounds {
    id: string;
    minY: number;
    maxY: number;
}
export interface NavigationOptions {
    bounds: Bounds;
    cellSize?: number;
    radius?: number;
    height?: number;
    maxSlopeDegrees?: number;
    maxStepHeight?: number;
    maxWaterDepth?: number;
    sampleSpacing?: number;
}
export type BlockReason = 'bounds' | 'water' | 'slope' | 'obstacle' | 'step' | 'invalid-ground';
export type WalkCheck = {
    ok: true;
    position: Point;
} | {
    ok: false;
    reason: BlockReason;
};
export interface PathResult {
    status: 'found' | 'blocked' | 'unreachable' | 'budget-exceeded';
    points: Point[];
    visited: number;
}
/** Matches the diagonal and vertices in terrainMesh, rather than the smooth source function. */
export declare function terrainSampler(config: WorldConfig): GroundSampler;
/** Conservative AABBs for cones/spheres; exact box colliders for box blockouts. */
export declare function collidersFromPrimitives(primitives: readonly Primitive[]): Collider[];
/** A bounded local navigation area. Server and client can each maintain one. */
export declare class NavigationWorld {
    private readonly sample;
    readonly options: Readonly<Required<NavigationOptions>>;
    private colliders;
    private revisionNumber;
    get revision(): number;
    constructor(sample: GroundSampler, opts: NavigationOptions);
    upsertCollider(c: Collider): void;
    removeCollider(id: string): boolean;
    /** The host must add all relevant prop/structure colliders, including neighboring chunk overlaps. */
    addPrimitives(primitives: readonly Primitive[]): void;
    private ground;
    check(p: XZ): WalkCheck;
    traverse(a: XZ, b: XZ): WalkCheck;
    findPath(start: XZ, goal: XZ, maxVisited?: number): PathResult;
}

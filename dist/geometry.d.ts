import { type Chunk, type Point, type WorldConfig, type BiomeId } from './world.js';
/** Engine-independent triangle buffers. Each vertex stores three world coordinates. */
export interface TerrainMesh {
    positions: Float32Array;
    indices: Uint32Array;
    color: string;
}
export declare function terrainMesh(chunk: Chunk): TerrainMesh;
export interface Primitive {
    id: string;
    shape: 'box' | 'cone' | 'sphere';
    position: Point;
    /** Full extents in world units; primitive centered at position. */
    size: Point;
    color: string;
    collision: 'solid' | 'none';
}
/** Low-poly blockouts. Replace asset appearance while preserving semantic IDs. */
export declare function landmarkPrimitives(chunk: Chunk): Primitive[];
/** Simple cell-center water planes; coastline clipping and smoothing belong to the renderer. */
export declare function waterCells(config: WorldConfig, chunk: Chunk): Array<{
    position: Point;
    size: number;
    color: string;
}>;
export declare function groundColor(biome: BiomeId): string;
/** Shared low-poly prop dimensions for renderers and server collider construction. */
export declare function propPrimitives(chunk: Chunk): Primitive[];

import { BIOMES, type BiomeId, type PropKind, type LandmarkKind, type Weather } from './catalog.js';
export { BIOMES, BIOME_IDS } from './catalog.js';
export type { BiomeId, BiomeDefinition, Weather } from './catalog.js';
export declare const GENERATOR_VERSION = 1;
export declare const CHUNK_SIZE = 64;
export declare const GRID = 16;
export declare const REGION_SIZE = 512;
export declare const MAX_CHUNK_COORD = 4095;
export interface WorldConfig {
    seed: number;
    generatorVersion: 1;
}
export interface Point {
    x: number;
    y: number;
    z: number;
}
export interface Region {
    id: string;
    rx: number;
    rz: number;
    biome: BiomeId;
    name: string;
}
export interface Surface {
    height: number;
    water: boolean;
    waterY: number | null;
}
export interface Prop {
    id: string;
    kind: PropKind;
    position: Point;
    yaw: number;
    scale: number;
}
export interface Landmark {
    id: string;
    kind: LandmarkKind;
    position: Point;
    radius: number;
}
export interface Chunk {
    id: string;
    cx: number;
    cz: number;
    region: Region;
    /** Row-major, (GRID+1)^2 vertex heights including shared edges. */
    heights: number[];
    /** Row-major, GRID^2 cell-center water depths. Zero means dry. */
    waterDepths: number[];
    props: Prop[];
    landmarks: Landmark[];
}
export interface WeatherState {
    kind: Weather;
    visibility: number;
    epoch: number;
}
export declare function validateConfig(c: WorldConfig): void;
export declare function validateChunkCoord(n: number): void;
export declare function regionAt(c: WorldConfig, x: number, z: number): Region;
export declare function surfaceAt(c: WorldConfig, x: number, z: number): Surface;
export declare function weatherAt(c: WorldConfig, region: Region, serverTimeMs: number): WeatherState;
export declare function generateChunk(c: WorldConfig, cx: number, cz: number): Chunk;
/** Visible square of chunks. Host should cache and unload descriptors outside this set. */
export declare function nearbyChunks(x: number, z: number, radius?: number): Array<{
    cx: number;
    cz: number;
}>;
/** Renderer integration boundary: own geometry, collision, asset loading and cleanup here. */
export interface WorldRenderer {
    mount(chunk: Chunk, biome: typeof BIOMES[BiomeId]): void;
    unmount(chunkId: string): void;
}
export declare class ChunkView {
    private config;
    private renderer;
    private mounted;
    constructor(config: WorldConfig, renderer: WorldRenderer);
    update(x: number, z: number, radius?: number): void;
    dispose(): void;
}

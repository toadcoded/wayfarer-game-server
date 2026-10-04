import { type WorldConfig } from './world.js';
import { type BiomeId } from './catalog.js';
export interface RegionStory {
    id: string;
    name: string;
    biome: BiomeId;
    description: string;
    places: readonly string[];
    travelNote: string;
}
/** Authored setting content. Named places are design references, not spawned quest objects. */
export declare const REGION_STORIES: readonly RegionStory[];
export interface AtlasAnchor {
    story: RegionStory;
    rx: number;
    rz: number;
    x: number;
    z: number;
}
export interface AtlasLink {
    from: string;
    to: string;
    name: string;
    status: 'planned';
}
export declare const ATLAS_LINKS: readonly AtlasLink[];
/** Places stories at real matching procedural region centers; never changes generator-v1 terrain. */
export declare function buildAtlas(config: WorldConfig): AtlasAnchor[];
/** Shortest number of authored links. This is itinerary planning, NOT a walkable path query. */
export declare function planItinerary(from: string, to: string): string[];
export declare function inspectAnchor(config: WorldConfig, anchor: AtlasAnchor): {
    regionId: string;
    biome: "river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra";
    chunkId: string;
    propCount: number;
    landmarkKinds: import("./catalog.js").LandmarkKind[];
    minHeight: number;
    maxHeight: number;
    wetCells: number;
    resources: string[];
};

import { type WorldConfig, type Point } from './world.js';
import { type GroundSampler } from './navigation.js';
import type { BiomeId } from './catalog.js';
export declare const WILDLIFE: Readonly<{
    readonly bunny: {
        readonly name: "Bunny";
        readonly family: "rabbit";
        readonly color: "#c5b69c";
        readonly size: 0.65;
        readonly habitats: ("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[];
    };
    readonly rabbit: {
        readonly name: "Rabbit";
        readonly family: "rabbit";
        readonly color: "#a3947c";
        readonly size: 1;
        readonly habitats: readonly [...("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[], "alpine", "tundra"];
    };
    readonly squirrel: {
        readonly name: "Squirrel";
        readonly family: "rodent";
        readonly color: "#a77a51";
        readonly size: 0.7;
        readonly habitats: ("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[];
    };
    readonly fox: {
        readonly name: "Fox";
        readonly family: "fox";
        readonly color: "#b77e4d";
        readonly size: 1.25;
        readonly habitats: readonly [...("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[], "alpine", "tundra", "desert"];
    };
    readonly bird: {
        readonly name: "Songbird";
        readonly family: "bird";
        readonly color: "#879eaf";
        readonly size: 0.45;
        readonly habitats: readonly [...("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[], "mire", "desert", "oasis-coast", "alpine", "tundra", "volcanic"];
    };
    readonly pigeon: {
        readonly name: "Pigeon";
        readonly family: "bird";
        readonly color: "#8e929e";
        readonly size: 0.7;
        readonly habitats: readonly ["river-valley", "grassland", "oasis-coast"];
    };
    readonly otter: {
        readonly name: "Otter";
        readonly family: "mustelid";
        readonly color: "#806c55";
        readonly size: 1.1;
        readonly habitats: readonly ["river-valley", "mire", "oasis-coast"];
    };
    readonly ferret: {
        readonly name: "Ferret";
        readonly family: "mustelid";
        readonly color: "#b5a589";
        readonly size: 0.85;
        readonly habitats: ("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[];
    };
    readonly groundhog: {
        readonly name: "Groundhog";
        readonly family: "rodent";
        readonly color: "#9b8a6c";
        readonly size: 1.05;
        readonly habitats: readonly ["river-valley", "grassland", "alpine"];
    };
    readonly mole: {
        readonly name: "Mole";
        readonly family: "burrower";
        readonly color: "#797377";
        readonly size: 0.65;
        readonly habitats: ("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[];
    };
    readonly shrew: {
        readonly name: "Shrew";
        readonly family: "burrower";
        readonly color: "#927f71";
        readonly size: 0.4;
        readonly habitats: readonly ["river-valley", "forest", "mire", "cavern"];
    };
    readonly mouse: {
        readonly name: "Mouse";
        readonly family: "rodent";
        readonly color: "#aaa08d";
        readonly size: 0.4;
        readonly habitats: readonly [...("river-valley" | "grassland" | "desert" | "oasis-coast" | "forest" | "mire" | "alpine" | "volcanic" | "cavern" | "tundra")[], "mire", "desert", "oasis-coast", "alpine", "tundra", "volcanic", "cavern"];
    };
    readonly hedgehog: {
        readonly name: "Hedgehog";
        readonly family: "burrower";
        readonly color: "#8c7b5b";
        readonly size: 0.65;
        readonly habitats: readonly ["grassland", "forest"];
    };
    readonly duck: {
        readonly name: "Duck";
        readonly family: "bird";
        readonly color: "#758f69";
        readonly size: 0.9;
        readonly habitats: readonly ["river-valley", "mire", "oasis-coast"];
    };
}>;
export type WildlifeSpecies = keyof typeof WILDLIFE;
export interface WildlifeNPC {
    id: string;
    species: WildlifeSpecies;
    position: Point;
    phase: number;
    attackable: false;
    collidable: false;
    drops: false;
}
export declare const WILDLIFE_SPECIES: readonly ("bunny" | "rabbit" | "squirrel" | "fox" | "bird" | "pigeon" | "otter" | "ferret" | "groundhog" | "mole" | "shrew" | "mouse" | "hedgehog" | "duck")[];
export declare function wildlifeHabitat(biome: BiomeId): ("bunny" | "rabbit" | "squirrel" | "fox" | "bird" | "pigeon" | "otter" | "ferret" | "groundhog" | "mole" | "shrew" | "mouse" | "hedgehog" | "duck")[];
/** Separate decorative population protocol: never changes terrain-v1 or realm combat state. */
export declare function wildlifeForChunk(config: WorldConfig, cx: number, cz: number, limit?: number): WildlifeNPC[];
/** Curated wildlife pockets in the playable river realm; dry bank roam sites are ground checked. */
export declare function wildlifeForRealm(config: WorldConfig, anchors: readonly Point[], ground: GroundSampler): WildlifeNPC[];
export declare function wildlifePose(npc: WildlifeNPC, now: number, paused?: boolean): {
    x: number;
    z: number;
    yaw: number;
    hop: number;
    phase: number;
    resting: boolean;
    activity: number;
};

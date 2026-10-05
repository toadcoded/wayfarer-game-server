import { type Primitive } from './geometry.js';
export declare const REALM_WORLD: {
    readonly seed: 20260928;
    readonly generatorVersion: 1;
};
/** Shared deterministic rehearsal geometry and collision setup, independently built on each side. */
export declare function createRealmScene(): {
    worldPrimitives: Primitive[];
    orchardTrees: {
        id: string;
        x: number;
        y: number;
        z: number;
    }[];
    codexPoint: import("./world.js").Point;
    cavernPoint: import("./world.js").Point;
    construction: import("./construction.js").ConstructionWorld;
    navigation: import("./navigation.js").NavigationWorld;
    plan: import("./crossings.js").CrossingPlan;
};
export declare function realmCodexPoint(realm: ReturnType<typeof createRealmScene>): {
    x: number;
    y: number;
    z: number;
};
export declare function realmCavernPoint(realm: ReturnType<typeof createRealmScene>): {
    x: number;
    y: number;
    z: number;
};

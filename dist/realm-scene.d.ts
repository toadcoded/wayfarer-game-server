export declare const REALM_WORLD: {
    readonly seed: 20260928;
    readonly generatorVersion: 1;
};
/** Shared deterministic rehearsal geometry and collision setup, independently built on each side. */
export declare function createRealmScene(): {
    construction: import("./construction.js").ConstructionWorld;
    navigation: import("./navigation.js").NavigationWorld;
    plan: import("./crossings.js").CrossingPlan;
};

import type { Point } from './world.js';
import type { Primitive } from './geometry.js';
import { NavigationWorld, type GroundSampler, type Bounds } from './navigation.js';
import { ConstructionWorld, type FoundationPad, type WalkSurface } from './construction.js';
export declare const CROSSING_STYLES: {
    readonly willowglass: {
        readonly name: "Willowglass Causeway";
        readonly deck: "#857052";
        readonly stone: "#8D9988";
        readonly metal: "#6B9C94";
        readonly glow: "#D7EAC0";
        readonly ground: "#63865C";
        readonly water: "#487F87";
        readonly fog: "#C4D4C5";
        readonly motifs: readonly ["willow-seed lanterns", "rain-dark stone", "votive garden", "braided river marks"];
        readonly lore: "Travelers leave an unlit lantern here for a journey they have not yet dared to begin.";
        readonly ambience: "river / leaf-rustle / hollow-wood chime";
    };
    readonly saffron: {
        readonly name: "Saffron Meridian";
        readonly deck: "#C69563";
        readonly stone: "#AE7350";
        readonly metal: "#557F84";
        readonly glow: "#FFD891";
        readonly ground: "#BC996D";
        readonly water: "#448E91";
        readonly fog: "#E2C7A1";
        readonly motifs: readonly ["sun-disc obelisks", "turquoise inlay", "shadow-calendar court", "star-counting pillars"];
        readonly lore: "At noon the paired obelisks cast a narrow road of shade. The keepers call it the second bridge.";
        readonly ambience: "dry wind / ceramic chime / distant water";
    };
    readonly mothlight: {
        readonly name: "Mothlight Boardwalk";
        readonly deck: "#68634F";
        readonly stone: "#646E5E";
        readonly metal: "#95A69C";
        readonly glow: "#BEE1B3";
        readonly ground: "#52684B";
        readonly water: "#405E5C";
        readonly fog: "#A5B9A4";
        readonly motifs: readonly ["glowcap reliquaries", "reed-woven pylons", "flood-mark posts", "moth-wing screens"];
        readonly lore: "Each flood-mark bears a tiny brass moth. The lowest marks remember houses the marsh has borrowed.";
        readonly ambience: "reeds / frogs / soft wooden knocks";
    };
};
export type CrossingStyle = keyof typeof CROSSING_STYLES;
export interface InspectPoint {
    id: string;
    name: string;
    position: Point;
    radius: number;
    text: string;
}
export interface CrossingPlan {
    constructionVersion: 1;
    id: string;
    style: CrossingStyle;
    name: string;
    pads: FoundationPad[];
    surfaces: WalkSurface[];
    primitives: Primitive[];
    start: Point;
    goal: Point;
    inspection: InspectPoint[];
    bounds: Bounds;
    earthworkBounds: Bounds[];
    verifiedCenterline: Point[];
}
export interface CrossingOptions {
    id: string;
    style: CrossingStyle;
    z: number;
    minX: number;
    maxX: number;
    width?: number;
    clearance?: number;
}
export declare function mountCrossing(base: GroundSampler, plan: CrossingPlan, maxWaterDepth?: number): {
    construction: ConstructionWorld;
    navigation: NavigationWorld;
};
/** Scan an X-axis river crossing. Fail explicitly when this corridor cannot support a safe candidate. */
export declare function planCrossing(base: GroundSampler, o: CrossingOptions): CrossingPlan;
/** Read-only inspection utility; no loot, quest or persistence authority is implied. */
export declare function inspectNearby(plan: CrossingPlan, position: Point): InspectPoint[];

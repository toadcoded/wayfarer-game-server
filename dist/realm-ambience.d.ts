import type { Point } from './world.js';
export declare const DETAIL_KINDS: readonly ["birdhouse", "mushroom", "flower", "bench", "skeleton", "barrel", "keg", "bottle", "fireworks", "balloon", "toy"];
export type DetailKind = typeof DETAIL_KINDS[number];
export type AmbientKind = 'conversation' | 'sneeze' | 'toy' | 'lightning' | 'fireworks';
export declare const AMBIENT_LINES: readonly string[];
/** Decorative descriptors are seeded; none are colliders, loot or interactable resources. */
export declare function realmDetails(seed: number, anchors: readonly Point[]): {
    id: string;
    kind: "skeleton" | "flower" | "mushroom" | "bench" | "birdhouse" | "barrel" | "keg" | "bottle" | "fireworks" | "balloon" | "toy";
    position: {
        x: number;
        y: number;
        z: number;
    };
    phase: number;
}[];
export declare function ambientFrame(seed: number, now: number, paused?: boolean): {
    seconds: number;
    night: boolean;
    event: {
        id: string;
        kind: AmbientKind;
        progress: number;
        line: string;
    } | undefined;
};

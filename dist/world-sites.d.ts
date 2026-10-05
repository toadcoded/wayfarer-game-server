import type { Bounds, XZ } from './navigation.js';
/** Expanded, still bounded play space around the original causeway route. */
export declare const REALM_MAP_PADDING: Readonly<{
    x: 32;
    z: 64;
}>;
export declare function expandedRealmBounds(bounds: Bounds): Bounds;
/** Shared orchard trunk positions, relative to the camp; render and collision use this list. */
export declare const ORCHARD_TREE_OFFSETS: readonly XZ[];
/** Clear, walkable sites deliberately separated from the camp orchard and the far landing. */
export declare function observatoryCandidates(anchor: XZ): readonly XZ[];
export declare function cavernCandidates(anchor: XZ): readonly XZ[];

import { type ArtId } from './art-directory.js';
import { Scene, TransformNode, Texture } from '@babylonjs/core';
import type { Point } from './world.js';
export declare const PAINTING_URL = "/preview/art/causeway-adventurer.jpeg";
/** One locally bundled portrait on a decorative tavern wall. */
export declare function createWallPainting(scene: Scene, position: Point, loadTexture?: boolean, artId?: ArtId): {
    root: TransformNode;
    canvas: import("@babylonjs/core").Mesh;
    title: "The Causeway Adventurer" | "Harvest Festival";
    readonly texture: Texture | undefined;
    readonly state: "loading" | "ready" | "unavailable" | "placeholder";
    retryTexture: () => void;
    dispose(): void;
};

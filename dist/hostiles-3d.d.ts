import { Scene, TransformNode } from '@babylonjs/core';
import type { GameState } from './game-actions.js';
import type { Point } from './world.js';
type HostileSnapshot = GameState['hostiles'];
type PlayerPosition = {
    id: string;
    position: Point;
};
/** Server snapshots drive presentation only; this layer never predicts combat or changes navigation. */
export declare class Hostiles3D {
    private scene;
    readonly root: TransformNode;
    private materials;
    private actors;
    private shots;
    private drops;
    private camps;
    private disposed;
    constructor(scene: Scene, parent?: TransformNode);
    private mat;
    private box;
    private sphere;
    private group;
    private actor;
    private camp;
    private moving;
    update(state: HostileSnapshot | undefined, players: readonly PlayerPosition[], now: number, paused?: boolean): void;
    setVisible(visible: boolean): void;
    dispose(): void;
}
export {};

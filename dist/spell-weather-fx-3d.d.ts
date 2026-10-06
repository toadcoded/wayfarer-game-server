import { type Scene } from '@babylonjs/core';
import type { Point } from './world.js';
import type { GameState } from './game-actions.js';
export declare class SpellWeatherFX3D {
    private scene;
    private readonly rain;
    private readonly sparks;
    private readonly materials;
    private readonly lightning;
    private readonly flash;
    private disposed;
    private lastStrike;
    private seed;
    constructor(scene: Scene);
    private material;
    private next;
    castSpell(origin: Point, color?: string): void;
    update(now: number, paused: boolean, target: Point, game: GameState | undefined, localPosition?: Point): void;
    dispose(): void;
}

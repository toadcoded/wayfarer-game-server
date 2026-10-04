import type { Point } from './world.js';
export declare class CharacterRenderer {
    private motions;
    private reduced;
    clear(): void;
    retain(ids: readonly string[]): void;
    draw(ctx: CanvasRenderingContext2D, id: string, position: Point, q: {
        x: number;
        y: number;
    }, now: number, skin?: string, local?: boolean, paused?: boolean): void;
}

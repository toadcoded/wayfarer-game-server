import { SoftPatch } from './soft-patch.js';
/** Character-relative presentation only. It never feeds forces into realm movement. */
export declare class GameCape {
    readonly patch: SoftPatch;
    private last;
    reset(): void;
    draw(ctx: CanvasRenderingContext2D, q: {
        x: number;
        y: number;
    }, now: number, paused: boolean): void;
}

import type { Point } from './world.js';
export interface RasterFace {
    points: Point[];
    color: string;
}
/** Static orthographic depth buffer; centroid sorting cannot resolve intersecting surfaces. */
export declare function rasterIso(width: number, height: number, faces: readonly RasterFace[], project: (p: Point) => {
    x: number;
    y: number;
}): Uint8ClampedArray;

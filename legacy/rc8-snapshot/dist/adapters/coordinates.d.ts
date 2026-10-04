/** Explicit unit conversion; foreign Y is a ground axis, never altitude. */
export interface GridFrame {
    tileSize: number;
    originX: number;
    originZ: number;
    columns: number;
    rows: number;
}
export declare const REFERENCE_GRIDS: {
    readonly ashfen: {
        readonly tileSize: 32;
        readonly originX: 0;
        readonly originZ: 0;
        readonly columns: 42;
        readonly rows: 34;
    };
    readonly wayfarer: {
        readonly tileSize: 4;
        readonly originX: -192;
        readonly originZ: -192;
        readonly columns: 96;
        readonly rows: 96;
    };
    readonly papyrus: {
        readonly tileSize: 1;
        readonly originX: 0;
        readonly originZ: 0;
        readonly columns: 72;
        readonly rows: 72;
    };
};
export declare function worldToCell(f: GridFrame, x: number, z: number): {
    column: number;
    row: number;
} | null;
export declare function cellCenter(f: GridFrame, column: number, row: number): {
    x: number;
    z: number;
};
/** Translate authored points without clamping: placement validation is the caller's job. */
export declare function rebasePoint(point: {
    x: number;
    z: number;
}, source: GridFrame, target: GridFrame): {
    x: number;
    z: number;
};

export declare const QUALITY_PRESETS: {
    readonly maximum: {
        readonly fps: 60;
        readonly pixelRatio: 2;
        readonly samples: 4;
        readonly bloom: true;
        readonly fxaa: true;
    };
    readonly high: {
        readonly fps: 45;
        readonly pixelRatio: 1.5;
        readonly samples: 2;
        readonly bloom: true;
        readonly fxaa: true;
    };
    readonly balanced: {
        readonly fps: 30;
        readonly pixelRatio: 1;
        readonly samples: 1;
        readonly bloom: false;
        readonly fxaa: true;
    };
};
export type VisualQuality = keyof typeof QUALITY_PRESETS;
export declare function isVisualQuality(value: unknown): value is VisualQuality;
/** Plugin surface deliberately has no gameplay state, account or inventory API. */
export interface VisualSurface {
    readonly id: 'wayfarer.visual-preferences.v1';
    getQuality(): Promise<VisualQuality | undefined>;
    setQuality(value: VisualQuality): Promise<void>;
    clear(): Promise<void>;
    close(): Promise<void>;
}
export interface VisualSQL {
    query(sql: string, params?: unknown[]): Promise<{
        rows: unknown[];
    }>;
    close(): Promise<void>;
}
export declare class PGliteVisualSurface implements VisualSurface {
    private db;
    readonly id: "wayfarer.visual-preferences.v1";
    private ready;
    private closed;
    constructor(db: VisualSQL);
    private check;
    getQuality(): Promise<"balanced" | "high" | "maximum" | undefined>;
    setQuality(value: VisualQuality): Promise<void>;
    clear(): Promise<void>;
    close(): Promise<void>;
}

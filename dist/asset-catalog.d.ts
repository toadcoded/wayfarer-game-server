export interface AssetRecord {
    id: string;
    width: number;
    height: number;
    frames: number;
    durationsMs: number[];
    source: string;
    role: string;
    crop: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare function parseAssetCatalog(value: unknown): AssetRecord[];

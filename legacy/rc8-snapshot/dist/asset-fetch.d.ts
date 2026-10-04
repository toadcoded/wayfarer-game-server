/** Bounded same-origin asset fetches; cache owns successful bytes, callers receive copies. */
export declare class AssetFetcher {
    private fetcher;
    private timeoutMs;
    private cache;
    private pending;
    private active;
    private waiting;
    constructor(fetcher?: typeof fetch, timeoutMs?: number);
    load(path: string): Promise<Uint8Array>;
    private run;
}
export declare const assetFetcher: AssetFetcher | undefined;
export declare function loadSpriteSheet(id: string, width: number, height: number): Promise<HTMLCanvasElement>;

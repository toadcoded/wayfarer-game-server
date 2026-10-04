export interface DisposableRenderer {
    dispose(): void;
}
/** One renderer owner; stale/closed loads are released and frame faults permit retry. */
export declare class RenderRecovery<T extends DisposableRenderer> {
    private renderer;
    private pending;
    private epoch;
    private closed;
    private mode;
    get current(): T | undefined;
    get state(): "fallback" | "closed" | "loading" | "ready";
    private release;
    load(factory: () => Promise<T>): Promise<T | undefined>;
    run(update: (renderer: T) => void): boolean;
    close(): void;
}

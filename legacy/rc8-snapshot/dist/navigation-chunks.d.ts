import type { Chunk } from './world.js';
import { NavigationWorld } from './navigation.js';
/** Register generated chunk colliders once, and remove only their owned ids on unload. */
export declare class NavigationChunks {
    private readonly navigation;
    private owned;
    constructor(navigation: NavigationWorld);
    mount(chunk: Chunk): void;
    unmount(chunkId: string): void;
    dispose(): void;
}

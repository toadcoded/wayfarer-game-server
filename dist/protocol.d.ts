import { type WorldConfig, type Chunk } from './world.js';
/** Small recipes, not executable code or arbitrary object graphs, travel over the wire. */
export type Message = {
    schema: 1;
    type: 'world.manifest';
    config: WorldConfig;
} | {
    schema: 1;
    type: 'world.request';
    cx: number;
    cz: number;
} | {
    schema: 1;
    type: 'world.chunk';
    config: WorldConfig;
    cx: number;
    cz: number;
    serverTimeMs: number;
};
export declare function decodeMessage(text: string): Message;
export declare function encodeMessage(message: Message): string;
/** Host supplies authenticated, server-owned position. Never use position from request JSON. */
export declare function answerChunkRequest(text: string, world: WorldConfig, player: {
    x: number;
    z: number;
}, serverTimeMs: number): string;
/** Client accepts recipes only for its negotiated world; geometry stays reproducible. */
export declare function chunkFromMessage(text: string, expected: WorldConfig): Chunk;

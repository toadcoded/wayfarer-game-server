import type { Chunk } from './world.js';
import type { CrossingPlan } from './crossings.js';
/** New site overlay only: preserve the generator, stable IDs and source chunk object. */
export declare function reserveSites(chunk: Chunk, plans: readonly CrossingPlan[]): Chunk;

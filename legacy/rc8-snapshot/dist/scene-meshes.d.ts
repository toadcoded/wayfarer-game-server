import { type WorldConfig } from './world.js';
import { type Primitive } from './geometry.js';
import { type MeshData } from './construction.js';
import { type CrossingPlan } from './crossings.js';
/** Literal low-poly primitive geometry; no external assets or renderer dependency. */
export declare function primitiveMesh(p: Primitive): MeshData;
/** A bounded reference scene, using the same construction definition as the walker. */
export declare function crossingScene(world: WorldConfig, plan: CrossingPlan): MeshData[];

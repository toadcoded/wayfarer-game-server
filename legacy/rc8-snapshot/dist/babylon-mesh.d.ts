import { Mesh, Scene } from '@babylonjs/core';
import type { MeshData } from './construction.js';
/** Real Babylon mesh adapter; caller owns scene, returned handle owns mesh/material. */
export declare function mountBabylonMesh(scene: Scene, id: string, data: MeshData, updatable?: boolean): {
    mesh: Mesh;
    update(positions: Float32Array): void;
    dispose(): void;
};

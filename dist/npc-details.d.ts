import { type Scene, type TransformNode } from '@babylonjs/core';
export declare function decorateRealmNPC(scene: Scene, id: string, root: TransformNode, role: 'keeper' | 'warden'): {
    dispose(): void;
};

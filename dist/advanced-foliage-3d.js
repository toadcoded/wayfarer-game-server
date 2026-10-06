import { Color3, MeshBuilder, StandardMaterial, TransformNode } from '@babylonjs/core';
export class AdvancedFoliage3D {
    scene;
    ground;
    root;
    trees = [];
    materials = new Map();
    disposed = false;
    constructor(scene, seed, anchors, ground) {
        this.scene = scene;
        this.ground = ground;
        this.root = new TransformNode('advanced-foliage-layer', scene);
        let state = (seed ^ 0x9e3779b9) >>> 0;
        const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
        const mat = (key, color, rough = true) => { let m = this.materials.get(key); if (!m) {
            m = new StandardMaterial('foliage:' + key, scene);
            m.diffuseColor = Color3.FromHexString(color);
            m.specularColor = Color3.Black();
            if (rough)
                m.roughness = 1;
            this.materials.set(key, m);
        } return m; };
        const trunk = mat('trunk', '#684632'), trunkLight = mat('trunk-light', '#94633f'), leafA = mat('leaf-a', '#315c39'), leafB = mat('leaf-b', '#6fa14c'), leafC = mat('leaf-c', '#c0c86b'), rootMat = mat('roots', '#5a3e2d'), flower = mat('flower', '#f0c86d');
        const createPart = (parent, name, shape, position, scale, material) => { const m = shape === 'cylinder' ? MeshBuilder.CreateCylinder(name, { height: 1, diameter: 1, tessellation: 8 }, scene) : shape === 'sphere' ? MeshBuilder.CreateSphere(name, { diameter: 1, segments: 8 }, scene) : MeshBuilder.CreateBox(name, { size: 1 }, scene); m.parent = parent; m.position.set(position[0], position[1], position[2]); m.scaling.set(scale[0], scale[1], scale[2]); m.material = material; m.isPickable = false; m.checkCollisions = false; return m; };
        const addTree = (x, z, scale, phase) => { const g = ground(x, z); if (!Number.isFinite(g.height) || g.waterDepth > .05 || g.slopeDegrees > 28)
            return; const root = new TransformNode('tree:' + this.trees.length, scene); root.parent = this.root; root.position.set(x, g.height, z); root.scaling.setAll(scale); const canopy = new TransformNode(root.name + ':canopy', scene); canopy.parent = root; createPart(root, root.name + ':trunk', 'cylinder', [0, .85, 0], [.28, 1.7, .28], trunk); createPart(root, root.name + ':trunk-highlight', 'cylinder', [.12, .9, .03], [.08, 1.35, .08], trunkLight); for (const side of [-1, 1])
            createPart(root, root.name + ':root' + side, 'sphere', [side * .28, .12, 0], [.42, .12, .28], rootMat); const crowns = [[0, 2.05, 0, .95, leafA], [.42, 1.86, .04, .7, leafB], [-.42, 1.82, -.03, .72, leafB], [0, 2.42, -.06, .64, leafC], [.08, 1.75, .35, .55, leafA]]; for (const [cx, cy, cz, size, material] of crowns)
            createPart(canopy, root.name + ':crown', 'sphere', [cx, cy, cz], [size, size * .86, size], material); if (this.trees.length % 3 === 0) {
            for (const side of [-1, 1])
                createPart(root, root.name + ':flower' + side, 'sphere', [side * .4, .36, .16], [.06, .06, .06], flower);
        } this.trees.push({ root, canopy, phase }); };
        for (const anchor of anchors) {
            for (let i = 0; i < 22; i++) {
                const x = anchor.x + (random() - .5) * 34, z = anchor.z + (random() - .5) * 28;
                if (Math.abs(z - anchor.z) < 4.5)
                    continue;
                addTree(x, z, 2.1 + random() * .9, random() * Math.PI * 2);
            }
        }
    }
    update(now, paused) { if (this.disposed)
        return; for (const tree of this.trees) {
        const sway = paused ? 0 : Math.sin(now * .00055 + tree.phase) * .018;
        tree.canopy.rotation.z = sway;
        tree.canopy.rotation.x = Math.cos(now * .00043 + tree.phase) * .012;
    } }
    get count() { return this.trees.length; }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.root.dispose(); for (const material of this.materials.values())
        material.dispose(); this.materials.clear(); this.trees.length = 0; }
}

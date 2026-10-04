import { MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
export const PRACTICE_FIXTURES = [{ name: 'dummy', dx: -1, dz: -1.4 }, { name: 'altar', dx: 0, dz: -1.4 }, { name: 'bench', dx: 1, dz: -1.4 }, { name: 'course', dx: -1, dz: 1.4 }, { name: 'pond', dx: 0, dz: 1.4 }, { name: 'garden', dx: 1, dz: 1.4 }];
/** Small cosmetic fixtures: no collision, combat targets, resource yield or clocks. */
export function createPracticeYard(scene, camp, check) {
    const material = new StandardMaterial('practice-yard-wood', scene);
    material.diffuseColor = new Color3(.46, .29, .14);
    const soft = new StandardMaterial('practice-yard-straw', scene);
    soft.diffuseColor = new Color3(.7, .61, .3);
    const meshes = [];
    for (const f of PRACTICE_FIXTURES) {
        const ground = check({ x: camp.x + f.dx, y: camp.y, z: camp.z + f.dz });
        if (!ground.ok || !ground.position)
            continue;
        const p = ground.position;
        const box = (part, w, h, d, y, straw = false) => { const m = MeshBuilder.CreateBox('practice:' + f.name + ':' + part, { width: w, height: h, depth: d }, scene); m.position.set(p.x, p.y + y, p.z); m.material = straw ? soft : material; m.isPickable = false; meshes.push(m); };
        if (f.name === 'dummy') {
            box('post', .12, .95, .12, .475);
            box('pad', .38, .45, .25, .85, true);
            box('crossbar', .65, .08, .1, .8);
        }
        else if (f.name === 'course') {
            box('beam', .8, .10, .18, .05);
        }
        else if (f.name === 'pond') {
            const m = MeshBuilder.CreateCylinder('practice:pond:casting-basin', { diameter: .65, height: .18, tessellation: 8 }, scene);
            m.position.set(p.x, p.y + .09, p.z);
            m.material = soft;
            m.isPickable = false;
            meshes.push(m);
            box('rod', .04, .8, .04, .4);
        }
        else if (f.name === 'garden') {
            box('planter', .65, .22, .4, .11);
            box('sample', .18, .2, .18, .32, true);
        }
        else {
            box('base', .4, .4, .3, .2);
            box('top', .75, .12, .5, .46, true);
        }
    }
    return { meshes, dispose() { for (const m of meshes)
            m.dispose(); material.dispose(); soft.dispose(); } };
}

import { Color3, MeshBuilder, PointLight, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { ORCHARD_TREE_OFFSETS } from './world-sites.js';
const mat = (scene, name, diffuse, emissive = Color3.Black(), alpha = 1) => { const material = new StandardMaterial(name, scene); material.diffuseColor = diffuse; material.emissiveColor = emissive; material.specularColor = diffuse.scale(.25); material.alpha = alpha; return material; };
const parent = (mesh, node) => { mesh.parent = node; return mesh; };
const seeded = (seed) => { let n = seed >>> 0; return () => ((n = Math.imul(n ^ n >>> 15, 1 | n) + 0x6d2b79f5 | 0, n = (n ^ n >>> 7) * 61 + n ^ n, n ^ n >>> 14) >>> 0) / 4294967296; };
/**
 * Procedural art layer inspired by the supplied orchard, crystal mine, luminous
 * forest, enchanted archive and neon observatory references. It owns no game
 * state and cannot award XP, move actors, or mutate collision.
 */
export function createCelestialExpansion(scene, camp, codex, cavernPoint) {
    const root = new TransformNode('v12-expansion', scene), observatory = new TransformNode('celestial-observatory', scene), cavern = new TransformNode('moonlight-cavern', scene);
    observatory.parent = root;
    cavern.parent = root;
    observatory.position.set(codex.x, codex.y, codex.z);
    cavern.position.set(cavernPoint.x, cavernPoint.y, cavernPoint.z);
    const stone = mat(scene, 'v12-stone', new Color3(.16, .20, .28)), gold = mat(scene, 'v12-gold', new Color3(.56, .39, .15), new Color3(.13, .08, .02)), cyan = mat(scene, 'v12-cyan', new Color3(.08, .45, .56), new Color3(.05, .72, .9)), violet = mat(scene, 'v12-violet', new Color3(.28, .11, .42), new Color3(.64, .08, .88)), wood = mat(scene, 'v12-wood', new Color3(.28, .16, .08)), leaf = mat(scene, 'v12-leaf', new Color3(.12, .36, .16)), flower = mat(scene, 'v12-flower', new Color3(.85, .47, .08), new Color3(.1, .04, 0)), water = mat(scene, 'v12-water', new Color3(.04, .33, .46), new Color3(.02, .16, .24), .68), mushroom = mat(scene, 'v12-mushroom', new Color3(.33, .20, .5), new Color3(.18, .42, .72)), shell = mat(scene, 'v12-shell', new Color3(.24, .34, .58), new Color3(.08, .18, .4));
    // Celestial observatory: layered dais, orbit cages, eight columns and an open codex.
    const dais = parent(MeshBuilder.CreateCylinder('observatory-dais', { height: .45, diameter: 11, tessellation: 12 }, scene), observatory);
    dais.position.y = .2;
    dais.material = stone;
    const inset = parent(MeshBuilder.CreateCylinder('observatory-inset', { height: .08, diameter: 8.2, tessellation: 24 }, scene), observatory);
    inset.position.y = .47;
    inset.material = cyan;
    const rings = [];
    for (const [i, diameter] of [8.8, 10.6, 12.4].entries()) {
        const ring = parent(MeshBuilder.CreateTorus('observatory-orbit-' + i, { diameter, thickness: .055, tessellation: 64 }, scene), observatory);
        ring.position.y = 3.6 + i * .35;
        ring.rotation.x = Math.PI / 2 + i * .38;
        ring.rotation.z = i * .47;
        ring.material = i % 2 ? violet : cyan;
        rings.push(ring);
    }
    for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2, pylon = parent(MeshBuilder.CreateCylinder('observatory-pylon-' + i, { height: 2.3, diameter: .34, tessellation: 6 }, scene), observatory);
        pylon.position.set(Math.cos(a) * 4.5, 1.55, Math.sin(a) * 4.5);
        pylon.material = i % 3 === 0 ? gold : stone;
        const gem = parent(MeshBuilder.CreatePolyhedron('observatory-gem-' + i, { type: 1, size: .34 }, scene), observatory);
        gem.position.set(Math.cos(a) * 4.5, 2.85, Math.sin(a) * 4.5);
        gem.material = i % 2 ? violet : cyan;
    }
    const lectern = parent(MeshBuilder.CreateBox('codex-lectern', { width: 2.2, height: .85, depth: 1.4 }, scene), observatory);
    lectern.position.set(0, .92, 0);
    lectern.material = stone;
    const pageL = parent(MeshBuilder.CreateBox('codex-page-l', { width: 1.1, height: .08, depth: 1.35 }, scene), observatory), pageR = parent(MeshBuilder.CreateBox('codex-page-r', { width: 1.1, height: .08, depth: 1.35 }, scene), observatory);
    pageL.position.set(-.55, 1.43, 0);
    pageR.position.set(.55, 1.43, 0);
    pageL.rotation.z = .12;
    pageR.rotation.z = -.12;
    pageL.material = pageR.material = gold;
    const obsLight = new PointLight('observatory-light', new Vector3(codex.x, codex.y + 4, codex.z), scene);
    obsLight.diffuse = new Color3(.3, .8, 1);
    obsLight.intensity = 1.6;
    obsLight.range = 18;
    // Reedhaven sunward orchard: lush but geometric fruit trees and giant flowers.
    const orchard = new TransformNode('sunward-orchard', scene);
    orchard.parent = root;
    orchard.position.set(camp.x, camp.y, camp.z);
    const rnd = seeded(0x51f17a);
    for (const [i, { x, z }] of ORCHARD_TREE_OFFSETS.entries()) {
        const trunk = parent(MeshBuilder.CreateCylinder('orchard-trunk-' + i, { height: 3.8, diameter: .55, tessellation: 7 }, scene), orchard);
        trunk.position.set(x, 1.9, z);
        trunk.rotation.z = (rnd() - .5) * .12;
        trunk.material = wood;
        for (let c = 0; c < 3; c++) {
            const canopy = parent(MeshBuilder.CreateSphere('orchard-canopy-' + i + '-' + c, { diameter: 2.7 - (c * .2), segments: 7 }, scene), orchard);
            canopy.position.set(x + (c - 1) * .65, 3.7 + (c % 2) * .35, z + (c === 1 ? .35 : -.2));
            canopy.material = leaf;
        }
        for (let f = 0; f < 5; f++) {
            const fruit = parent(MeshBuilder.CreateSphere('orchard-fruit-' + i + '-' + f, { diameter: .34, segments: 6 }, scene), orchard);
            fruit.position.set(x + (rnd() - .5) * 2.2, 3.2 + rnd() * 1.6, z + (rnd() - .5) * 1.8);
            fruit.material = f % 2 ? flower : violet;
        }
    }
    for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, rad = 5.7 + (i % 2) * .5, stem = parent(MeshBuilder.CreateCylinder('sunflower-stem-' + i, { height: 1.25, diameter: .08, tessellation: 5 }, scene), orchard);
        stem.position.set(Math.cos(a) * rad, .63, Math.sin(a) * rad);
        stem.material = leaf;
        const bloom = parent(MeshBuilder.CreateDisc('sunflower-bloom-' + i, { radius: .28, tessellation: 10 }, scene), orchard);
        bloom.position.set(Math.cos(a) * rad, 1.3, Math.sin(a) * rad);
        bloom.rotation.x = Math.PI / 2;
        bloom.material = flower;
    }
    // Prism dew garden: leaf-like flattened shapes and glassy droplets.
    for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, leafMesh = parent(MeshBuilder.CreateDisc('prism-leaf-' + i, { radius: 1, tessellation: 5 }, scene), observatory);
        leafMesh.position.set(Math.cos(a) * 3.1, .58, Math.sin(a) * 3.1);
        leafMesh.scaling.set(1.35, .65, 1);
        leafMesh.rotation.x = Math.PI / 2;
        leafMesh.rotation.z = a;
        leafMesh.material = i % 2 ? violet : cyan;
        const drop = parent(MeshBuilder.CreateSphere('prism-dew-' + i, { diameter: .42, segments: 12 }, scene), observatory);
        drop.position.set(Math.cos(a) * 3.1, 1.0, Math.sin(a) * 3.1);
        drop.material = gold;
    }
    // Moonlight Cavern: dark mouth, cyan crystal seams, timber walks, lanterns, water and bioluminescent fauna.
    const caveFloor = parent(MeshBuilder.CreateDisc('cavern-floor', { radius: 9, tessellation: 20 }, scene), cavern);
    caveFloor.rotation.x = Math.PI / 2;
    caveFloor.position.y = .05;
    caveFloor.material = stone;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, rock = parent(MeshBuilder.CreatePolyhedron('cave-rock-' + i, { type: 1, size: 1.25 + (i % 3) * .38 }, scene), cavern);
        rock.position.set(Math.cos(a) * 7.2, 1.1 + (i % 2) * .45, Math.sin(a) * 7.2);
        rock.scaling.y = 1.4 + (i % 3) * .45;
        rock.material = stone;
    }
    const crystalMats = [cyan, violet, gold];
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + .12, rad = 4.6 + (i % 3) * .7, crystal = parent(MeshBuilder.CreateCylinder('moon-crystal-' + i, { height: 1.6 + (i % 3) * .45, diameterTop: 0, diameterBottom: .55 + (i % 2) * .2, tessellation: 5 }, scene), cavern);
        crystal.position.set(Math.cos(a) * rad, .8 + (i % 4) * .22, Math.sin(a) * rad);
        crystal.rotation.z = (i % 3 - 1) * .18;
        crystal.material = crystalMats[i % crystalMats.length];
    }
    const pool = parent(MeshBuilder.CreateDisc('moon-pool', { radius: 3.1, tessellation: 28 }, scene), cavern);
    pool.rotation.x = Math.PI / 2;
    pool.position.set(2.8, .12, 2.7);
    pool.material = water;
    const bridge = parent(MeshBuilder.CreateBox('cavern-walkway', { width: 8, height: .22, depth: 1.7 }, scene), cavern);
    bridge.position.set(-1.2, .65, -2.4);
    bridge.rotation.y = -.28;
    bridge.material = wood;
    for (let i = -4; i <= 4; i++) {
        const post = parent(MeshBuilder.CreateCylinder('walk-post-' + i, { height: 1.35, diameter: .14, tessellation: 5 }, scene), cavern);
        post.position.set(i * .86, .0, -2.4 + i * .25);
        post.material = wood;
    }
    const portal = parent(MeshBuilder.CreateTorus('cavern-portal', { diameter: 4.7, thickness: .23, tessellation: 40 }, scene), cavern);
    portal.position.set(-4.5, 3.2, 2.1);
    portal.rotation.y = Math.PI / 2;
    portal.material = violet;
    const lanternPositions = [[-3, 2.4, -2.4], [1.2, 2.4, -3.1], [4.4, 2.2, 1.6]];
    const cavernLights = [];
    for (const [i, [x, y, z]] of lanternPositions.entries()) {
        const lamp = parent(MeshBuilder.CreatePolyhedron('cavern-lantern-' + i, { type: 1, size: .32 }, scene), cavern);
        lamp.position.set(x, y, z);
        lamp.material = gold;
        const light = new PointLight('cavern-lantern-light-' + i, new Vector3(cavernPoint.x + x, cavernPoint.y + y, cavernPoint.z + z), scene);
        light.diffuse = new Color3(1, .54, .18);
        light.intensity = 1.35;
        light.range = 9;
        cavernLights.push(light);
    }
    for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + .4, stem = parent(MeshBuilder.CreateCylinder('glowshroom-stem-' + i, { height: .35, diameter: .09, tessellation: 5 }, scene), cavern);
        stem.position.set(Math.cos(a) * 5.7, .2, Math.sin(a) * 5.7);
        stem.material = cyan;
        const cap = parent(MeshBuilder.CreateSphere('glowshroom-cap-' + i, { diameter: .42, segments: 7, slice: .55 }, scene), cavern);
        cap.position.set(Math.cos(a) * 5.7, .5, Math.sin(a) * 5.7);
        cap.material = mushroom;
    }
    const snail = new TransformNode('astral-snail', scene);
    snail.parent = cavern;
    snail.position.set(3.9, .35, -.2);
    const body = parent(MeshBuilder.CreateCapsule('astral-snail-body', { height: 1.5, radius: .22, tessellation: 8 }, scene), snail);
    body.rotation.z = Math.PI / 2;
    body.material = cyan;
    const snailShell = parent(MeshBuilder.CreateTorus('astral-snail-shell', { diameter: 1.05, thickness: .26, tessellation: 22 }, scene), snail);
    snailShell.rotation.y = Math.PI / 2;
    snailShell.position.set(0, .58, 0);
    snailShell.material = shell;
    const moonLight = new PointLight('moonlight-cavern-blue', new Vector3(cavernPoint.x, cavernPoint.y + 6, cavernPoint.z), scene);
    moonLight.diffuse = new Color3(.25, .72, 1);
    moonLight.intensity = 2.0;
    moonLight.range = 24;
    let t = 0;
    return { observatory, cavern, update(now, paused, activeEffect) { if (!paused)
            t = now; const pulse = .5 + .5 * Math.sin(t * .0024); for (const [i, ring] of rings.entries()) {
            ring.rotation.y = (i % 2 ? 1 : -1) * t * .00012 * (i + 1);
            ring.rotation.z += paused ? 0 : .00035 * (i + 1);
        } obsLight.intensity = 1.35 + pulse * .55 + (activeEffect ? 1.0 : 0); moonLight.intensity = 1.7 + pulse * .55; portal.scaling.setAll(1 + pulse * .035); portal.rotation.z = t * .00018; snail.rotation.y = Math.sin(t * .0007) * .25; for (const [i, light] of cavernLights.entries())
            light.intensity = 1.0 + .45 * Math.sin(t * .004 + i); }, dispose() { for (const light of cavernLights)
            light.dispose(); obsLight.dispose(); moonLight.dispose(); root.dispose(); stone.dispose(); gold.dispose(); cyan.dispose(); violet.dispose(); wood.dispose(); leaf.dispose(); flower.dispose(); water.dispose(); mushroom.dispose(); shell.dispose(); } };
}

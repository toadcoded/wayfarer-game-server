import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, Color3, Color4, MeshBuilder, StandardMaterial } from '@babylonjs/core';
import { createHero3D, HERO_PROFILES } from './hero-3d.js';
import { appearanceForSkin, checkedAppearance, SKIN_TONES, HAIR_COLORS, EYE_COLORS } from './hero-appearance.js';
const canvas = document.querySelector('#studio-canvas'), status = document.querySelector('#studio-status');
let engine;
try {
    engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true });
    engine.setHardwareScalingLevel(1 / Math.min(devicePixelRatio || 1, 1.5));
    const scene = new Scene(engine);
    scene.clearColor = new Color4(.065, .075, .12, 1);
    const camera = new ArcRotateCamera('studio-camera', Math.PI / 2, 1.15, 3.8, new Vector3(0, 1.1, 0), scene);
    camera.minZ = .02;
    camera.lowerRadiusLimit = .65;
    camera.upperRadiusLimit = 7;
    camera.lowerBetaLimit = .2;
    camera.upperBetaLimit = 1.5;
    camera.wheelDeltaPercentage = .01;
    camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    camera.attachControl(canvas, false);
    const ambient = new HemisphericLight('studio-ambient', new Vector3(.2, 1, .3), scene);
    ambient.intensity = .85;
    const key = new DirectionalLight('studio-key', new Vector3(-.3, -1, -.6), scene);
    key.intensity = 1.3;
    key.diffuse = new Color3(1, .88, .75);
    const ground = MeshBuilder.CreateDisc('studio-platform', { radius: 2, tessellation: 48 }, scene);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.025;
    const mat = new StandardMaterial('studio-ground', scene);
    mat.diffuseColor = new Color3(.12, .15, .21);
    ground.material = mat;
    const field = (name) => document.querySelector('#' + name);
    const palette = (name, colors) => colors.forEach((color, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = `${index + 1} · ${color}`; field(name).append(option); });
    palette('skinTone', SKIN_TONES);
    palette('hairColor', HAIR_COLORS);
    palette('eyeColor', EYE_COLORS);
    let skin = 'seraphine', rig = createHero3D(scene, 'studio-hero', skin), distance = 0, last = performance.now(), paint = -Infinity, closed = false;
    function fill() { const a = appearanceForSkin(field('skin').value); for (const [key, value] of Object.entries(a))
        field(key).value = String(value); }
    function rebuild() { try {
        skin = field('skin').value;
        if (!Object.hasOwn(HERO_PROFILES, skin))
            throw new Error('Unknown character');
        const appearance = checkedAppearance({ skinTone: Number(field('skinTone').value), hairColor: Number(field('hairColor').value), eyeColor: Number(field('eyeColor').value), hairStyle: field('hairStyle').value, facialHair: field('facialHair').value, makeup: field('makeup').value, build: field('build').value });
        const candidate = createHero3D(scene, 'studio-hero', skin, appearance);
        rig.dispose();
        rig = candidate;
        distance = 0;
        status.textContent = `${rig.details.length} modeled details · ${rig.root.getChildMeshes().length} batched meshes · local preview`;
    }
    catch {
        status.textContent = 'Appearance unavailable; previous model remains.';
    } }
    field('skin').addEventListener('change', () => { fill(); rebuild(); });
    for (const key of ['skinTone', 'hairColor', 'eyeColor', 'hairStyle', 'facialHair', 'makeup', 'build'])
        field(key).addEventListener('change', rebuild);
    document.querySelector('#face-view').addEventListener('click', () => { camera.setTarget(new Vector3(0, 1.80, 0), false, true, true); camera.radius = .9; camera.beta = Math.PI / 2; camera.alpha = Math.PI / 2; });
    document.querySelector('#body-view').addEventListener('click', () => { camera.setTarget(new Vector3(0, 1.1, 0), false, true, true); camera.radius = 3.8; camera.beta = 1.15; camera.alpha = Math.PI / 2; });
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    fill();
    rebuild();
    engine.runRenderLoop(() => { if (closed || document.hidden)
        return; const now = performance.now(); if (now - paint < 1000 / 30)
        return; paint = now; const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now; const pose = field('pose').value, paused = document.querySelector('#studio-pause').checked || media.matches; distance += paused ? 0 : dt * (pose === 'walk' ? 2 : pose === 'jog' ? 4 : pose === 'run' ? 6.25 : 0); rig.update({ x: 0, y: 0, z: distance }, now, paused, 2, ['wave', 'chop', 'sneeze', 'play'].includes(pose) ? pose : 'idle'); rig.root.position.set(0, 0, 0); scene.render(); });
    addEventListener('resize', () => engine?.resize());
    addEventListener('pagehide', () => { closed = true; rig.dispose(); scene.dispose(); engine?.dispose(); });
}
catch {
    engine?.dispose();
    status.textContent = 'WebGL unavailable. This device cannot open the 3D character studio.';
}

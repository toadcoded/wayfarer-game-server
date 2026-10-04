import { TransformNode, MeshBuilder, StandardMaterial, Color3, Mesh, VertexData } from '@babylonjs/core';
import { appearanceForSkin, checkedAppearance, SKIN_TONES, HAIR_COLORS, EYE_COLORS } from './hero-appearance.js';
import { dampAngle } from './travel-controls.js';
import { CharacterMotion } from './character-motion.js';
export const HERO_PROFILES = Object.freeze({
    seraphine: Object.freeze({ coat: '#253b96', trim: '#e9b74e', hair: '#d69c43', skin: '#efbd96', idle: .022, stride: .48, cape: .22, cadence: 1.15 }),
    adventurer: Object.freeze({ coat: '#384c7e', trim: '#c9a45e', hair: '#664726', skin: '#d1a078', idle: .017, stride: .6, cape: .1, cadence: 1 }),
    elder: Object.freeze({ coat: '#455842', trim: '#c4b477', hair: '#a5a099', skin: '#c5a688', idle: .012, stride: .25, cape: .04, cadence: .7 }),
    traveler: Object.freeze({ coat: '#455b67', trim: '#b3aa80', hair: '#665b48', skin: '#d2a17c', idle: .018, stride: .55, cape: .16, cadence: 1.05 }),
    villager: Object.freeze({ coat: '#55764a', trim: '#b5a27a', hair: '#634733', skin: '#d3a783', idle: .026, stride: .42, cape: .07, cadence: .9 }),
    vector: Object.freeze({ coat: '#637895', trim: '#b8c7cf', hair: '#494b54', skin: '#d0af92', idle: .015, stride: .5, cape: .08, cadence: 1 })
});
/** Procedural faceted prototype rig; all motion is cosmetic and never changes collision. */
export function createHero3D(scene, id, skin, customAppearance, wardrobe) {
    const appearance = customAppearance === undefined ? appearanceForSkin(skin) : checkedAppearance(customAppearance);
    if (wardrobe && (Object.keys(wardrobe).sort().join() !== 'coat,trim' || ![wardrobe.coat, wardrobe.trim].every(c => /^#[0-9a-f]{6}$/i.test(c))))
        throw new Error('Invalid NPC wardrobe');
    const profile = Object.freeze({ ...HERO_PROFILES[skin], ...wardrobe, skin: SKIN_TONES[appearance.skinTone], hair: HAIR_COLORS[appearance.hairColor] }), root = new TransformNode(id, scene), motion = new CharacterMotion();
    let previous, facing = 0, lastTurn;
    const details = [], staticParts = [], dynamicParts = new Set();
    let assembling = true;
    const joints = {};
    const materials = new Map();
    const material = (color) => { let m = materials.get(color); if (!m) {
        m = new StandardMaterial(id + ':' + color, scene);
        m.diffuseColor = Color3.FromHexString(color);
        m.specularColor = new Color3(.08, .08, .08);
        materials.set(color, m);
    } return m; };
    const shape = (name, parent, x, y, z, sx, sy, sz, color, round = false) => {
        const m = round ? MeshBuilder.CreateSphere(id + name, { diameter: 1, segments: 6 }, scene) : MeshBuilder.CreateCylinder(id + name, { height: 1, diameterTop: .75, diameterBottom: 1, tessellation: 6 }, scene);
        m.parent = parent;
        m.position.set(x, y, z);
        m.scaling.set(sx, sy, sz);
        m.material = material(color);
        m.isPickable = false;
        m.checkCollisions = false;
        if (assembling) {
            details.push(name.slice(1));
            staticParts.push(m);
        }
        if (color === profile.skin) {
            const count = m.getTotalVertices(), colors = new Float32Array(count * 4);
            for (let i = 0; i < count; i++) {
                const tone = .96 + ((i * 37 + name.length * 13) % 29) / 700;
                colors.set([tone, tone * .99, tone * .98, 1], i * 4);
            }
            m.setVerticesData('color', colors);
        }
        return m;
    };
    const build = appearance.build === 'strong' ? 1.12 : appearance.build === 'lean' ? .92 : 1, shoulder = .34 * build;
    const joint = (name, parent, x, y, z) => { const n = new TransformNode(id + ':' + name, scene); n.parent = parent; n.position.set(x, y, z); joints[name] = n; return n; };
    const pelvis = joint('pelvis', root, 0, .94, 0), torso = joint('torso', root, 0, 1.12, 0);
    shape(':hips', pelvis, 0, 0, -.015, .45 * build, .28, .32, profile.coat, true);
    for (const side of [-1, 1])
        shape(':seat' + side, pelvis, side * .105, -.03, -.095, .22, .23, .2, profile.coat, true);
    shape(':waist', torso, 0, -.035, 0, .42 * build, .22, .31, profile.coat, true);
    shape(':tunic', torso, 0, .18, 0, .58 * build, .65, .36, profile.coat);
    shape(':belt', torso, 0, -.08, 0, .64 * build, .07, .4, profile.trim);
    shape(':ribcage', torso, 0, .25, 0, .5 * build, .34, .35, profile.coat, true);
    shape(':abdomen', torso, 0, .045, .12, .33 * build, .22, .1, profile.coat, true);
    for (const side of [-1, 1]) {
        shape(':chest' + side, torso, side * .13, .32, .14, .25 * build, .24, .13, skin === 'seraphine' ? '#efe2c9' : profile.coat, true);
        shape(':scapula' + side, torso, side * .14, .28, -.14, .27, .32, .12, profile.coat, true);
        shape(':clavicle' + side, torso, side * .11, .46, .11, .24, .055, .09, profile.trim, true);
        shape(':underarm-seam' + side, torso, side * shoulder * .85, .29, 0, .09, .115, .2, profile.coat, true);
    }
    // Small armor seams suggest abdominal/rib structure without drawing bare anatomy over clothing.
    for (let row = 0; row < 3; row++)
        for (const side of [-1, 1])
            shape(':abdomen-panel' + side + row, torso, side * .073, .15 - row * .065, .19, .125, .053, .025, profile.coat, true);
    shape(':spine-seam', torso, 0, .2, -.19, .035, .47, .025, profile.trim);
    shape(':neck', torso, 0, .55, 0, .17, .22, .17, profile.skin, true);
    const head = joint('head', torso, 0, .71, 0);
    shape(':face', head, 0, 0, 0, .38, .45, .32, profile.skin, true);
    shape(':jawline', head, 0, -.12, .035, .29, .16, .255, profile.skin, true);
    shape(':chin', head, 0, -.18, .097, .16, .095, .12, profile.skin, true);
    shape(':hair', head, 0, .15, -.06, .44, .27, .35, profile.hair, true);
    shape(':nose-bridge', head, 0, .015, .16, .052, .12, .05, profile.skin, true);
    shape(':nose', head, 0, -.025, .185, .06, .065, .07, profile.skin, true);
    const eyes = [], lids = [];
    for (const side of [-1, 1]) {
        shape(':cheekbone' + side, head, side * .115, -.045, .095, .145, .11, .12, profile.skin, true);
        shape(':nostril' + side, head, side * .018, -.05, .213, .012, .009, .01, '#80544b', true);
        for (const [part, x, y, z, sx, sy, sz, color] of [['eye', side * .085, .02, .151, .075, .07, .035, '#f4efdf'], ['iris', side * .085, .02, .175, .036, .045, .015, EYE_COLORS[appearance.eyeColor]], ['pupil', side * .085, .02, .184, .018, .027, .008, '#1c202b'], ['eye-glint', side * .075, .031, .189, .009, .011, .004, '#ffffff']]) {
            const mesh = shape(':' + part + side, head, x, y, z, sx, sy, sz, color, true);
            eyes.push({ mesh, height: sy });
            dynamicParts.add(mesh);
        }
        const lid = shape(':eyelid' + side, head, side * .085, .052, .17, .08, .015, .023, profile.skin, true);
        lids.push(lid);
        dynamicParts.add(lid);
        const brow = shape(':eyebrow' + side, head, side * .085, .084, .153, .085, .018, .025, profile.hair, true);
        brow.rotation.z = side * .08;
        shape(':ear' + side, head, side * .19, -.015, 0, .09, .15, .11, profile.skin, true);
        shape(':ear-fold' + side, head, side * .218, -.012, .018, .026, .095, .04, '#b87a69', true);
        shape(':temple' + side, head, side * .18, .08, -.02, .035, .2, .12, profile.hair, true);
        for (let n = 0; n < 2; n++) {
            const lash = shape(':lash' + side + n, head, side * (.085 + n * .025), .056, .179, .005, .021, .005, profile.hair);
            lash.rotation.z = side * .2;
        }
        if (appearance.makeup !== 'none') {
            shape(':cheek-tint' + side, head, side * .122, -.057, .147, .068, .026, .009, appearance.makeup === 'moonlit' ? '#d38f8e' : '#c99c85', true);
            for (let n = 0; n < 3; n++) {
                const lash = shape(':eyelash' + side + n, head, side * (.067 + n * .02), .056, .181, .007, .031, .006, '#302a38');
                lash.rotation.z = side * .2;
            }
        }
    }
    const jaw = joint('jaw', head, 0, -.106, .145);
    shape(':mouth', jaw, 0, 0, .003, .085, .018, .02, '#773f48', true);
    shape(':upper-lip', jaw, 0, .011, .011, .087, .014, .023, appearance.makeup === 'moonlit' ? '#bb667d' : '#a97168', true);
    shape(':lower-lip', jaw, 0, -.012, .011, .078, .017, .023, '#bd8580', true);
    const teeth = shape(':teeth', jaw, 0, .002, .018, .063, .018, .012, '#ece5d4', true);
    dynamicParts.add(teeth);
    teeth.setEnabled(false);
    if (appearance.facialHair !== 'none') {
        for (const side of [-1, 1]) {
            shape(':sideburn' + side, head, side * .173, -.072, .007, .035, .12, .09, profile.hair, true);
            shape(':moustache' + side, head, side * .028, -.084, .168, .06, .025, .025, profile.hair, true);
        }
        shape(':beard', head, 0, -.151, .075, .29, appearance.facialHair === 'beard' ? .19 : .072, .225, profile.hair, true);
    }
    if (appearance.hairStyle === 'swept')
        for (let n = 0; n < 4; n++) {
            const lock = shape(':fringe' + n, head, -.12 + n * .074, .135, .128, .10, .12, .065, profile.hair, true);
            lock.rotation.z = -.25;
        }
    if (appearance.hairStyle === 'long')
        for (const side of [-1, 1])
            for (let n = 0; n < 3; n++) {
                const lock = shape(':hair-lock' + side + n, head, side * (.145 + n * .035), -.15, -.105, .10, .56 + n * .025, .13, profile.hair, true);
                lock.rotation.z = side * .08;
            }
    const legs = [], arms = [], knees = [], ankles = [], elbows = [], wrists = [];
    for (const side of [-1, 1]) {
        const leg = joint('leg' + side, root, side * .15, .94, 0);
        legs.push(leg);
        shape(':thigh' + side, leg, 0, -.19, 0, .23 * build, .38, .23, skin === 'seraphine' ? profile.skin : '#505057', true);
        shape(':quadriceps' + side, leg, 0, -.18, .05, .19 * build, .29, .16, skin === 'seraphine' ? profile.skin : '#505057', true);
        const knee = joint('knee' + side, leg, 0, -.4, 0);
        knees.push(knee);
        shape(':kneecap' + side, knee, 0, 0, .08, .15, .14, .07, profile.trim, true);
        shape(':boot' + side, knee, 0, -.19, .015, .22, .38, .24, profile.coat);
        shape(':calf' + side, knee, 0, -.17, -.045, .22 * build, .27, .22, profile.coat, true);
        shape(':cuff' + side, knee, 0, -.015, .015, .25, .07, .25, profile.trim);
        const ankle = joint('ankle' + side, knee, 0, -.42, 0);
        ankles.push(ankle);
        shape(':ankle' + side, ankle, 0, 0, 0, .16, .12, .18, profile.coat, true);
        shape(':heel' + side, ankle, 0, -.055, -.055, .22, .115, .16, profile.trim, true);
        shape(':foot' + side, ankle, 0, -.052, .085, .235, .12, .34, profile.coat, true);
        shape(':toe-cap' + side, ankle, 0, -.05, .205, .24, .095, .11, profile.trim, true);
        const arm = joint('arm' + side, torso, side * shoulder, .42, 0);
        arms.push(arm);
        shape(':shoulder' + side, arm, 0, -.018, 0, .24 * build, .23, .25, profile.coat, true);
        shape(':pauldron' + side, arm, 0, .012, 0, .3 * build, .21, .31, profile.trim, true);
        shape(':sleeve' + side, arm, 0, -.17, 0, .19 * build, .3, .19, skin === 'seraphine' ? '#eee2c7' : profile.coat, true);
        shape(':biceps' + side, arm, 0, -.18, .035, .16 * build, .23, .16, skin === 'seraphine' ? '#eee2c7' : profile.coat, true);
        const elbow = joint('elbow' + side, arm, 0, -.32, 0);
        elbows.push(elbow);
        shape(':elbow-cap' + side, elbow, 0, 0, -.04, .16, .13, .16, profile.trim, true);
        shape(':forearm' + side, elbow, 0, -.125, 0, .17 * build, .25, .17, profile.coat, true);
        shape(':gauntlet' + side, elbow, 0, -.15, 0, .18, .21, .2, profile.trim);
        const wrist = joint('wrist' + side, elbow, 0, -.28, 0);
        wrists.push(wrist);
        shape(':wrist' + side, wrist, 0, -.015, 0, .11, .075, .12, profile.skin, true);
        shape(':hand' + side, wrist, 0, -.09, 0, .125, .15, .12, profile.skin, true);
        for (let finger = 0; finger < 4; finger++)
            shape(':finger' + side + finger, wrist, -.044 + finger * .029, -.172, .015, .025, .07 - (finger === 3 ? .012 : 0), .04, profile.skin, true);
        const thumb = shape(':thumb' + side, wrist, -side * .067, -.102, .026, .036, .08, .044, profile.skin, true);
        thumb.rotation.z = side * .4;
    }
    if (skin === 'seraphine') {
        shape(':collar', torso, 0, .47, .04, .37, .075, .3, profile.trim);
        shape(':chest-gem', torso, 0, .28, .22, .08, .13, .045, '#629cff');
        for (const side of [-1, 1]) {
            const skirt = shape(':ivory-skirt' + side, torso, side * .23, -.32, .03, .27, .5, .34, '#efe2c9');
            skirt.rotation.z = side * .18;
            shape(':boot-gem' + side, legs[side === -1 ? 0 : 1], 0, -.42, .16, .075, .12, .055, '#629cff');
        }
        shape(':front-tabard', torso, 0, -.32, .23, .25, .53, .06, profile.coat);
        shape(':tabard-hem', torso, 0, -.56, .237, .26, .045, .07, profile.trim);
        shape(':crown', head, 0, .17, .02, .45, .09, .35, profile.trim);
        shape(':diadem', head, 0, .23, .17, .13, .23, .09, '#629cff');
        for (const side of [-1, 1]) {
            const wing = shape(':crown-wing' + side, head, side * .26, .25, -.03, .12, .42, .09, '#b9d0ff');
            wing.rotation.z = -side * .5;
        }
    }
    // Batch static geometry within its own joint coordinate system; animated eyes/teeth stay separate.
    const groups = new Map();
    for (const mesh of staticParts) {
        if (dynamicParts.has(mesh))
            continue;
        const parent = mesh.parent, mat = mesh.material;
        let byMaterial = groups.get(parent);
        if (!byMaterial) {
            byMaterial = new Map();
            groups.set(parent, byMaterial);
        }
        const list = byMaterial.get(mat) ?? [];
        list.push(mesh);
        byMaterial.set(mat, list);
    }
    for (const [parent, byMaterial] of groups)
        for (const [mat, meshes] of byMaterial) {
            if (meshes.length < 2)
                continue;
            const names = meshes.map(m => m.name.slice(id.length + 1));
            for (const m of meshes) {
                m.parent = null;
                m.computeWorldMatrix(true);
            }
            const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
            if (!merged)
                throw new Error('Character detail merge failed');
            merged.name = id + ':detail-batch:' + parent.name + ':' + mat.name;
            merged.parent = parent;
            merged.isPickable = false;
            merged.checkCollisions = false;
            merged.metadata = { features: names };
        }
    assembling = false;
    staticParts.length = 0;
    dynamicParts.clear();
    groups.clear();
    const cape = new Mesh(id + ':cape', scene), cols = 7, rows = 9, positions = [], indices = [], colors = [];
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const v = r / (rows - 1), u = c / (cols - 1), x = (u - .5) * (.75 + v * .48);
            positions.push(x, 1.68 - v * 1.24, -.24 - v * .12);
            const gold = r === rows - 1 || c === 0 || c === cols - 1;
            const moon = skin === 'seraphine' && Math.hypot(u - .47, v - .55) < .2 && Math.hypot(u - .55, v - .5) > .18;
            const rgb = Color3.FromHexString(gold || moon ? profile.trim : profile.coat);
            colors.push(rgb.r, rgb.g, rgb.b, 1);
        }
    for (let r = 0; r < rows - 1; r++)
        for (let c = 0; c < cols - 1; c++) {
            const a = r * cols + c;
            indices.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1);
        }
    const normals = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.colors = colors;
    data.applyToMesh(cape, true);
    cape.parent = root;
    cape.isPickable = false;
    cape.checkCollisions = false;
    cape.material = material('#ffffff');
    cape.material.backFaceCulling = false;
    let disposed = false, held, currentWeapon;
    const animatedPositions = new Float32Array(positions), animatedNormals = new Float32Array(normals), blinkOffset = [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 23 / 10;
    function weapon(value) {
        if (value === currentWeapon)
            return;
        currentWeapon = value;
        held?.dispose();
        held = undefined;
        if (!value)
            return;
        held = shape(':weapon', wrists[1], 0, -.11, .32, value === 'granite_maul' ? .22 : .065, value === 'ash_staff' ? 1.2 : .8, .07, value === 'ash_staff' ? '#b794ed' : value === 'granite_maul' ? '#949caa' : '#95d5ef');
        held.rotation.x = Math.PI / 2;
    }
    function update(position, now, paused = false, wind = 0, gesture = 'idle') {
        if (disposed)
            throw Error('Disposed hero');
        if (!Number.isFinite(wind))
            throw Error('Invalid cape wind');
        const pose = motion.sample(position, now, paused);
        if (previous) {
            const dx = position.x - previous.x, dz = position.z - previous.z;
            if (Math.hypot(dx, dz) > .002)
                facing = paused ? Math.atan2(dx, dz) : dampAngle(facing, Math.atan2(dx, dz), lastTurn === undefined ? .05 : Math.max(0, (now - lastTurn) / 1000));
        }
        lastTurn = now;
        previous = { ...position };
        root.position.set(position.x, position.y, position.z);
        root.rotation.y = facing;
        const t = paused ? 0 : now / 1000, phase = pose.phase * profile.cadence, breathe = paused ? 0 : Math.sin(t * 1.8) * profile.idle;
        torso.position.y = 1.12 + breathe - Math.abs(Math.sin(phase)) * pose.stride * .035;
        head.rotation.y = paused ? 0 : Math.sin(t * .65) * .055 * (1 - pose.stride);
        legs.forEach((l, i) => l.rotation.x = Math.sin(phase + i * Math.PI) * pose.stride * profile.stride);
        arms.forEach((a, i) => a.rotation.x = -Math.sin(phase + i * Math.PI) * pose.stride * profile.stride * .8);
        head.rotation.x = 0;
        torso.rotation.x = pose.stride * .055;
        arms.forEach(a => a.rotation.z = 0);
        knees.forEach((k, i) => { const swing = Math.sin(phase + i * Math.PI); k.rotation.x = paused ? 0 : Math.max(0, swing) * pose.stride * .55; });
        ankles.forEach((a, i) => a.rotation.x = paused ? 0 : -Math.sin(phase + i * Math.PI) * pose.stride * .12);
        elbows.forEach(e => e.rotation.x = paused ? 0 : -.10 - pose.stride * .22);
        wrists.forEach(w => w.rotation.set(0, 0, 0));
        pelvis.rotation.y = paused ? 0 : Math.sin(phase) * pose.stride * .035;
        jaw.rotation.x = paused ? 0 : gesture === 'sneeze' ? .14 : gesture === 'wave' ? Math.max(0, Math.sin(t * 5)) * .08 : 0;
        teeth.setEnabled(!paused && (gesture === 'wave' || gesture === 'sneeze'));
        const blink = paused ? 1 : (t + blinkOffset) % 4.7 < .12 ? .12 : 1;
        eyes.forEach(e => e.mesh.scaling.y = e.height * blink);
        lids.forEach(l => l.position.y = .052 - (1 - blink) * .025);
        if (!paused) {
            if (gesture === 'wave') {
                arms[1].rotation.z = -1.6;
                arms[1].rotation.x = Math.sin(t * 4) * .25;
                elbows[1].rotation.x = -.6;
                wrists[1].rotation.z = Math.sin(t * 4) * .12;
            }
            else if (gesture === 'chop') {
                arms.forEach(a => a.rotation.x = -.6 + Math.sin(t * 2.8) * .65);
                elbows.forEach(e => e.rotation.x = -.45 + Math.sin(t * 2.8) * .2);
                torso.rotation.x = Math.sin(t * 2.8) * .08;
            }
            else if (gesture === 'brace') {
                torso.rotation.x = .12;
                arms.forEach(a => a.rotation.x = -1.1 + Math.sin(t * 2) * .1);
                elbows.forEach(e => e.rotation.x = -.55);
            }
            else if (gesture === 'aim') {
                arms[0].rotation.x = -1.45;
                arms[1].rotation.x = -1.2;
                elbows[1].rotation.x = -1.15;
                head.rotation.y = -.15;
            }
            else if (gesture === 'focus') {
                arms.forEach(a => a.rotation.x = -.9);
                elbows.forEach(e => e.rotation.x = -.7);
                head.rotation.x = .1;
                torso.position.y += Math.sin(t * 1.4) * .012;
            }
            else if (gesture === 'balance') {
                arms.forEach((a, i) => a.rotation.z = i ? -.65 : .65);
                pelvis.rotation.y = Math.sin(t * 1.8) * .06;
                knees.forEach((k, i) => k.rotation.x = .08 + Math.max(0, Math.sin(t * 1.8 + i * Math.PI)) * .12);
            }
            else if (gesture === 'sneeze') {
                head.rotation.x = .35 + Math.sin(t * 9) * .15;
                arms[1].rotation.x = -1.8;
                torso.rotation.x = .15;
            }
            else if (gesture === 'play') {
                torso.rotation.x = .2;
                arms.forEach(a => a.rotation.x = -.9 + Math.sin(t * 3) * .15);
            }
        }
        animatedPositions.set(positions);
        for (let r = 1; r < rows; r++)
            for (let c = 0; c < cols; c++) {
                const v = r / (rows - 1), j = (r * cols + c) * 3;
                animatedPositions[j + 2] = positions[j + 2] - (paused ? 0 : Math.sin(t * 2.4 - v * 3 + c * .4) * profile.cape * v * .25 + pose.stride * v * .28 + Math.max(-12, Math.min(12, wind)) * v * .008);
            }
        VertexData.ComputeNormals(animatedPositions, indices, animatedNormals);
        cape.updateVerticesData('position', animatedPositions);
        cape.updateVerticesData('normal', animatedNormals);
    }
    return { root, cape, profile, appearance, details: Object.freeze([...details]), joints: Object.freeze({ ...joints }), weapon, update, dispose() { if (!disposed) {
            disposed = true;
            root.dispose();
            for (const m of materials.values())
                m.dispose();
        } }, get disposed() { return disposed; } };
}

import { TransformNode, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import { realmDetails, ambientFrame } from './realm-ambience.js';
import { createNamedNPC3D } from './npc-cast-3d.js';
/** Bounded decorative scene. No collision, networking, reward or persistence authority. */
export class RealmAmbience3D {
    scene;
    seed;
    root;
    materials = new Map();
    balloons = [];
    toys = [];
    flies = [];
    sparks = [];
    lightning;
    child;
    woodcutter;
    disposed = false;
    childPosition;
    woodcutterPosition;
    constructor(scene, seed, anchors, height, cast) {
        this.scene = scene;
        this.seed = seed;
        this.root = new TransformNode('realm-ambience', scene);
        const anchor = anchors[0];
        const mat = (color) => { let m = this.materials.get(color); if (!m) {
            m = new StandardMaterial('detail:' + color, scene);
            m.diffuseColor = Color3.FromHexString(color);
            m.specularColor = Color3.Black();
            this.materials.set(color, m);
        } return m; };
        const part = (parent, name, shape, p, s, color) => { const mesh = shape === 'box' ? MeshBuilder.CreateBox(name, { size: 1 }, scene) : shape === 'sphere' ? MeshBuilder.CreateSphere(name, { diameter: 1, segments: 4 }, scene) : MeshBuilder.CreateCylinder(name, { height: 1, diameter: 1, tessellation: 8 }, scene); mesh.parent = parent; mesh.position.set(p[0], p[1], p[2]); mesh.scaling.set(s[0], s[1], s[2]); mesh.material = mat(color); mesh.isPickable = false; return mesh; };
        for (const detail of realmDetails(seed, anchors)) {
            const root = new TransformNode(detail.id, scene);
            root.parent = this.root;
            root.position.set(detail.position.x, height(detail.position), detail.position.z);
            const box = (n, p, s, c = '#866446') => part(root, detail.id + n, 'box', p, s, c), round = (n, p, s, c) => part(root, detail.id + n, 'sphere', p, s, c), cylinder = (n, p, s, c = '#866446') => part(root, detail.id + n, 'cylinder', p, s, c);
            switch (detail.kind) {
                case 'birdhouse':
                    box('post', [0, .8, 0], [.13, 1.6, .13]);
                    box('house', [0, 1.55, 0], [.65, .55, .5], '#bc9758');
                    for (const side of [-1, 1]) {
                        const roof = box('roof' + side, [side * .19, 1.94, 0], [.5, .08, .65], '#647667');
                        roof.rotation.z = -side * .55;
                    }
                    const hole = cylinder('hole', [0, 1.58, .256], [.16, .03, .16], '#29231b');
                    hole.rotation.x = Math.PI / 2;
                    box('perch', [0, 1.4, .35], [.08, .08, .24]);
                    round('bird', [.04, 1.49, .37], [.18, .15, .14], '#c69854');
                    break;
                case 'mushroom':
                    for (let i = 0; i < 3; i++) {
                        cylinder('stem' + i, [i * .22, .15, 0], [.08, .3, .08], '#dcd1b0');
                        round('cap' + i, [i * .22, .32, 0], [.4, .2, .4], i === 1 ? '#7862aa' : '#bd6572');
                        for (let j = 0; j < 3; j++)
                            round('spot' + i + j, [i * .22 + (j - 1) * .07, .415, .04], [.04, .02, .04], '#f5e5c5');
                    }
                    break;
                case 'flower':
                    for (let i = 0; i < 4; i++) {
                        cylinder('stem' + i, [i * .18, .25, 0], [.025, .5, .025], '#527653');
                        for (let j = 0; j < 5; j++) {
                            const a = j * Math.PI * 2 / 5;
                            round('petal' + i + j, [i * .18 + Math.cos(a) * .09, .5, Math.sin(a) * .09], [.12, .06, .12], i % 2 ? '#e5bd67' : '#b59ada');
                        }
                        round('pollen' + i, [i * .18, .53, 0], [.075, .05, .075], '#efdb84');
                    }
                    break;
                case 'bench':
                    box('seat', [0, .48, 0], [1.65, .12, .55]);
                    box('back', [0, .88, -.25], [1.65, .48, .1]);
                    for (const side of [-1, 1])
                        box('leg' + side, [side * .6, .23, 0], [.14, .5, .45], '#5d5547');
                    break;
                case 'skeleton':
                    round('skull', [0, .12, 0], [.28, .22, .3], '#d3ccae');
                    for (const side of [-1, 1])
                        round('eye' + side, [side * .06, .215, .07], [.055, .025, .065], '#554e47');
                    box('spine', [0, .06, -.47], [.05, .06, .7], '#c7c1a7');
                    for (let i = 0; i < 4; i++)
                        box('rib' + i, [0, .08, -.25 - i * .13], [.38 - i * .025, .045, .035], '#d3ccae');
                    for (const side of [-1, 1]) {
                        const bone = box('leg' + side, [side * .13, .045, -1], [.045, .045, .5], '#d3ccae');
                        bone.rotation.y = side * .22;
                    }
                    break;
                case 'barrel':
                case 'keg': {
                    const body = cylinder('staves', [0, .42, 0], [.62, .85, .62]);
                    for (const y of [.13, .68])
                        cylinder('hoop' + y, [0, y, 0], [.66, .055, .66], '#6e7880');
                    if (detail.kind === 'keg') {
                        box('tap', [0, .22, .4], [.1, .13, .3], '#b39b5b');
                        box('stand', [0, .06, 0], [.8, .12, .8]);
                    }
                    body.rotation.y = detail.phase;
                    break;
                }
                case 'bottle':
                    cylinder('bottle', [0, .22, 0], [.16, .4, .16], '#485d42');
                    cylinder('neck', [0, .48, 0], [.07, .16, .07], '#485d42');
                    cylinder('cork', [0, .58, 0], [.065, .065, .065], '#bda275');
                    box('label', [0, .25, .083], [.1, .16, .008], '#e1d2af');
                    break;
                case 'fireworks':
                    box('crate', [0, .22, 0], [.7, .4, .55]);
                    for (let i = 0; i < 4; i++) {
                        cylinder('rocket' + i, [(i - 1.5) * .13, .5, 0], [.07, .45, .07], i % 2 ? '#9974b1' : '#b57265');
                        round('tip' + i, [(i - 1.5) * .13, .73, 0], [.1, .13, .1], '#d8b75c');
                    }
                    break;
                case 'balloon':
                    for (const side of [-1, 1])
                        box('fence-post' + side, [side * .5, .65, 0], [.12, 1.3, .12]);
                    box('fence-rail', [0, .8, 0], [1.1, .08, .08]);
                    {
                        const bob = new TransformNode(detail.id + ':bob', scene);
                        bob.parent = root;
                        round('balloon', [0, 2.4, 0], [.52, .65, .52], '#b86a81').parent = bob;
                        const rope = MeshBuilder.CreateLines('balloon-string', { points: [new Vector3(0, .8, 0), new Vector3(0, 2.12, 0)] }, scene);
                        rope.parent = bob;
                        rope.color = Color3.FromHexString('#d5c4a1');
                        this.balloons.push(bob);
                    }
                    break;
                case 'toy': {
                    const toy = new TransformNode(detail.id + ':beetle', scene);
                    toy.parent = root;
                    const body = round('clockwork-shell', [0, .18, 0], [.45, .26, .35], '#ab9658');
                    body.parent = toy;
                    for (const side of [-1, 1])
                        for (const z of [-.12, .12]) {
                            const wheel = cylinder('wheel' + side + z, [side * .22, .1, z], [.13, .06, .13], '#535b69');
                            wheel.rotation.z = Math.PI / 2;
                            wheel.parent = toy;
                        }
                    for (const side of [-1, 1]) {
                        const ear = round('clockwork-rabbit-ear' + side, [side * .09, .44, .1], [.08, .27, .09], '#c7ac65');
                        ear.parent = toy;
                    }
                    const face = round('clockwork-rabbit-face', [0, .25, .19], [.25, .24, .18], '#c7ac65');
                    face.parent = toy;
                    const key = box('winding-key', [0, .38, 0], [.22, .05, .05], '#c9b679');
                    key.parent = toy;
                    this.toys.push(toy);
                    break;
                }
            }
        }
        // Batch stationary dressing by shared material; animated toys/balloons keep their nodes.
        const groups = new Map();
        for (const mesh of this.root.getChildMeshes())
            if (mesh instanceof Mesh && mesh.name.startsWith('detail:') && !/:toy|:balloon/.test(mesh.name)) {
                const material = mesh.material;
                const group = groups.get(material) ?? [];
                group.push(mesh);
                groups.set(material, group);
            }
        for (const [material, group] of groups)
            if (group.length > 1) {
                const merged = Mesh.MergeMeshes(group, true, true);
                if (merged) {
                    merged.name = 'dressing-batch:' + material.name;
                    merged.parent = this.root;
                    merged.isPickable = false;
                }
            }
        const firstToy = realmDetails(seed, anchors).find(d => d.kind === 'toy').position;
        this.childPosition = cast?.pin ?? { x: firstToy.x + .65, y: height({ ...firstToy, x: firstToy.x + .65, z: firstToy.z + .35 }), z: firstToy.z + .35 };
        this.woodcutterPosition = cast?.branik ?? { x: anchor.x - 3, y: height({ ...anchor, x: anchor.x - 3, z: anchor.z - 4 }), z: anchor.z - 4 };
        if (cast) {
            const toySite = realmDetails(seed, anchors).find(d => d.kind === 'toy'), toyRoot = scene.getTransformNodeByName(toySite.id);
            if (toyRoot)
                toyRoot.position.set(cast.pin.x - .65, height({ ...cast.pin, x: cast.pin.x - .65, z: cast.pin.z - .35 }), cast.pin.z - .35);
        }
        this.child = createNamedNPC3D(scene, 'ambient-child', 'pin');
        this.child.root.parent = this.root;
        this.woodcutter = createNamedNPC3D(scene, 'ambient-woodcutter', 'branik');
        this.woodcutter.root.parent = this.root;
        const hand = scene.getTransformNodeByName('ambient-woodcutter:arm1');
        const shaft = part(hand, 'woodcutter-axe-handle', 'cylinder', [0, -.55, .3], [.055, .8, .055], '#887450');
        shaft.rotation.x = Math.PI / 2;
        part(hand, 'woodcutter-axe-head', 'box', [0, -.55, .63], [.3, .1, .14], '#939b9a');
        part(this.root, 'chopping-stump', 'cylinder', [this.woodcutterPosition.x, this.woodcutterPosition.y + .25, this.woodcutterPosition.z + .7], [.65, .5, .65], '#72563b');
        const glow = mat('#b7d58d');
        glow.emissiveColor = new Color3(.45, .7, .18);
        for (let i = 0; i < 18; i++) {
            const fly = part(this.root, 'firefly:' + i, 'sphere', [anchor.x + (i % 6 - 2.5) * 1.1, anchor.y + .7, anchor.z + (i < 9 ? -3 : 3)], [.035, .035, .035], '#b7d58d');
            this.flies.push(fly);
        }
        this.lightning = MeshBuilder.CreateLines('distant-lightning', { points: [new Vector3(anchor.x + 25, anchor.y + 23, -28), new Vector3(anchor.x + 23, anchor.y + 19, -28), new Vector3(anchor.x + 25, anchor.y + 19, -28), new Vector3(anchor.x + 21, anchor.y + 13, -28)] }, scene);
        this.lightning.parent = this.root;
        this.lightning.color = new Color3(.63, .69, .85);
        for (let i = 0; i < 3; i++)
            part(this.root, 'distant-cloud' + i, 'sphere', [anchor.x + 23 + i * 2, anchor.y + 23, -28], [7, 2.2, 3], '#39445a');
        for (let i = 0; i < 10; i++) {
            const spark = part(this.root, 'firework-spark:' + i, 'sphere', [anchor.x + 5, anchor.y + 3, anchor.z + 6], [.08, .08, .08], i % 2 ? '#c9ad72' : '#9985c0');
            this.sparks.push(spark);
        }
    }
    update(now, paused, flashes = true) {
        if (this.disposed)
            return undefined;
        const frame = ambientFrame(this.seed, now, paused), event = frame.event, t = frame.seconds;
        this.balloons.forEach((b, i) => { b.rotation.z = paused ? 0 : Math.sin(t * .7 + i) * .08; });
        this.toys.forEach((toy, i) => { toy.position.x = event?.kind === 'toy' ? Math.sin(event.progress * Math.PI * 2 + i) * .45 : 0; toy.rotation.y = event?.kind === 'toy' ? event.progress * Math.PI * 2 : 0; });
        this.flies.forEach((fly, i) => { fly.visibility = paused ? .2 : .12 + (Math.sin(t * 1.8 + i * .8) + 1) * .4; fly.position.y = this.woodcutterPosition.y + .8 + (paused ? 0 : Math.sin(t * .6 + i) * .2); });
        this.child.update(this.childPosition, now, paused, 0, event?.kind === 'toy' ? 'play' : event?.kind === 'conversation' ? 'wave' : 'idle');
        this.woodcutter.update(this.woodcutterPosition, now, paused, 0, event?.kind === 'sneeze' ? 'sneeze' : 'chop');
        this.lightning.setEnabled(flashes && event?.kind === 'lightning');
        if (event?.kind === 'lightning')
            this.lightning.visibility = Math.sin(event.progress * Math.PI) * .7;
        this.sparks.forEach((spark, i) => { spark.setEnabled(flashes && event?.kind === 'fireworks'); if (event?.kind === 'fireworks') {
            const angle = i * Math.PI * 2 / 10, r = event.progress * 2;
            spark.position.set(this.childPosition.x + 4 + Math.cos(angle) * r, this.childPosition.y + 4 + Math.sin(angle) * r - event.progress ** 2, this.childPosition.z + 2);
            spark.visibility = 1 - event.progress;
        } });
        return event?.kind === 'conversation' ? event.line : event?.kind === 'sneeze' ? 'The woodcutter sneezes, then carries on.' : event?.kind === 'toy' ? 'The child winds up a tiny clockwork rabbit.' : undefined;
    }
    dispose() { if (!this.disposed) {
        this.disposed = true;
        this.child.dispose();
        this.woodcutter.dispose();
        this.root.dispose();
        for (const m of this.materials.values())
            m.dispose();
    } }
}

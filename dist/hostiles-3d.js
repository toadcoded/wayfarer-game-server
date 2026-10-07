import { Color3, Mesh, MeshBuilder, StandardMaterial, TransformNode } from '@babylonjs/core';
import { ITEMS } from './inventory.js';
const OUTFITS = {
    skeleton: { cloth: '#625b4f', trim: '#d9cfb8', skin: '#e7dec9', metal: '#7d8790' },
    zombie: { cloth: '#465742', trim: '#79875b', skin: '#8b9a65', metal: '#687356' },
    thug: { cloth: '#684d48', trim: '#bd8056', skin: '#b98c70', metal: '#87909a' },
    bandit: { cloth: '#705338', trim: '#d0ae63', skin: '#bb8f6b', metal: '#a5a9a9' },
    mugger: { cloth: '#514660', trim: '#bf7967', skin: '#ab8068', metal: '#9098a0' }
};
/** Server snapshots drive presentation only; this layer never predicts combat or changes navigation. */
export class Hostiles3D {
    scene;
    root;
    materials = new Map();
    actors = new Map();
    shots = new Map();
    drops = new Map();
    camps = new Map();
    disposed = false;
    constructor(scene, parent) {
        this.scene = scene;
        this.root = new TransformNode('hostile-world-v26', scene);
        if (parent)
            this.root.parent = parent;
    }
    mat(hex, glow = false) { const key = hex + (glow ? ':glow' : ''); let value = this.materials.get(key); if (!value) {
        value = new StandardMaterial('hostile:' + key, this.scene);
        const color = Color3.FromHexString(hex);
        value.diffuseColor = color;
        value.specularColor = new Color3(.12, .12, .12);
        if (glow)
            value.emissiveColor = color.scale(.8);
        this.materials.set(key, value);
    } return value; }
    box(name, parent, x, y, z, w, h, d, color) { const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene); m.parent = parent; m.position.set(x, y, z); m.material = this.mat(color); m.isPickable = false; m.checkCollisions = false; return m; }
    sphere(name, parent, x, y, z, size, color, segments = 8) { const m = MeshBuilder.CreateSphere(name, { diameter: size, segments }, this.scene); m.parent = parent; m.position.set(x, y, z); m.material = this.mat(color); m.isPickable = false; m.checkCollisions = false; return m; }
    group(name, parent, x, y, z) { const n = new TransformNode(name, this.scene); n.parent = parent; n.position.set(x, y, z); return n; }
    actor(mob) {
        const outfit = OUTFITS[mob.kind], root = new TransformNode('hostile:' + mob.id, this.scene);
        root.parent = this.root;
        root.scaling.setAll(mob.kind === 'skeleton' ? .88 : .92);
        const torso = this.box(mob.id + ':torso', root, 0, 1.05, 0, .5, .62, .32, outfit.cloth);
        this.box(mob.id + ':belt', root, 0, .78, .02, .54, .1, .36, outfit.trim);
        const arms = [-1, 1].map(side => { const arm = this.group(mob.id + ':arm:' + side, root, side * .34, 1.28, 0); const sleeve = this.box(mob.id + ':sleeve:' + side, arm, side * .09, -.18, 0, .22, .48, .23, outfit.cloth); this.sphere(mob.id + ':hand:' + side, arm, side * .09, -.43, .01, .16, outfit.skin); return arm; });
        const legs = [-1, 1].map(side => { const leg = this.group(mob.id + ':leg:' + side, root, side * .14, .76, 0); this.box(mob.id + ':leg-piece:' + side, leg, 0, -.28, 0, .2, .55, .24, outfit.cloth); this.box(mob.id + ':boot:' + side, leg, 0, -.57, .07, .24, .15, .34, outfit.metal); return leg; });
        this.box(mob.id + ':collar', root, 0, 1.38, .015, .35, .12, .36, outfit.trim);
        if (mob.kind === 'skeleton') {
            this.sphere(mob.id + ':skull', root, 0, 1.65, .025, .4, outfit.skin, 10);
            this.box(mob.id + ':jaw', root, 0, 1.49, .105, .25, .12, .2, outfit.trim);
            for (const side of [-1, 1]) {
                this.sphere(mob.id + ':socket:' + side, root, side * .09, 1.67, .205, .085, '#28252a');
                this.sphere(mob.id + ':eye:' + side, root, side * .09, 1.67, .25, .035, '#ed8e60');
            }
            for (let rib = 0; rib < 3; rib++)
                this.box(mob.id + ':rib:' + rib, root, 0, 1.2 - rib * .12, .18, .42 - rib * .035, .045, .045, outfit.skin);
        }
        else if (mob.kind === 'zombie') {
            this.sphere(mob.id + ':head', root, 0, 1.62, .02, .4, outfit.skin, 8);
            this.box(mob.id + ':jaw', root, 0, 1.45, .11, .27, .12, .18, '#65744e');
            this.sphere(mob.id + ':eye:left', root, -.09, 1.65, .205, .055, '#d4d17b');
            this.sphere(mob.id + ':eye:right', root, .09, 1.65, .205, .055, '#5b403b');
            this.box(mob.id + ':torn-cloth', root, .16, .98, .17, .18, .43, .045, outfit.trim);
            this.box(mob.id + ':shoulder-rag', root, -.25, 1.37, 0, .2, .28, .4, '#697a55');
        }
        else {
            this.sphere(mob.id + ':face', root, 0, 1.63, .035, .37, outfit.skin, 8);
            this.box(mob.id + ':hood', root, 0, 1.79, -.08, .43, .18, .36, outfit.cloth);
            this.box(mob.id + ':mask', root, 0, 1.54, .205, .29, .12, .06, outfit.trim);
            this.box(mob.id + ':scarf', root, 0, 1.35, .18, .45, .09, .08, outfit.trim);
        }
        const weapon = this.group(mob.id + ':weapon', arms[1], 0, -.34, .02);
        this.box(mob.id + ':weapon-shaft', weapon, 0, -.12, .04, .055, .38, .055, outfit.metal);
        this.box(mob.id + ':weapon-edge', weapon, 0, .08, .04, .14, .12, .08, mob.kind === 'bandit' ? '#c4c7c5' : outfit.trim);
        const halo = MeshBuilder.CreateTorus(mob.id + ':aggro-ring', { diameter: 1.35, thickness: .035, tessellation: 18 }, this.scene);
        halo.parent = root;
        halo.position.y = .035;
        halo.rotation.x = Math.PI / 2;
        halo.material = this.mat('#f2a65f', true);
        halo.isPickable = false;
        const health = MeshBuilder.CreatePlane(mob.id + ':hp-bar', { width: 1.1, height: .075 }, this.scene);
        health.parent = root;
        health.position.set(0, 2.12, 0);
        health.billboardMode = Mesh.BILLBOARDMODE_ALL;
        health.material = this.mat('#dc685b', true);
        health.isPickable = false;
        const backdrop = MeshBuilder.CreatePlane(mob.id + ':hp-back', { width: 1.14, height: .11 }, this.scene);
        backdrop.parent = root;
        backdrop.position.set(0, 2.12, -.012);
        backdrop.billboardMode = Mesh.BILLBOARDMODE_ALL;
        backdrop.material = this.mat('#26262b');
        backdrop.isPickable = false;
        health.position.z = .005;
        return { root, torso, arms, legs, health, target: halo, kind: mob.kind };
    }
    camp(id, p) {
        if (this.camps.has(id))
            return;
        const site = new TransformNode('hostile-camp:' + id, this.scene);
        site.parent = this.root;
        site.position.set(p.x, p.y, p.z);
        const ring = MeshBuilder.CreateTorus(id + ':camp-ring', { diameter: id === 'thug-campsite' ? 5.6 : 3.7, thickness: .08, tessellation: 20 }, this.scene);
        ring.parent = site;
        ring.position.y = .05;
        ring.rotation.x = Math.PI / 2;
        ring.material = this.mat(id === 'thug-campsite' ? '#bd8850' : '#777d88');
        ring.isPickable = false;
        const fire = this.sphere(id + ':campfire', site, 0, .24, 0, .32, '#ef9450', 6);
        fire.material = this.mat('#ef9450', true);
        const wood = this.box(id + ':log-a', site, -.12, .09, 0, .5, .09, .09, '#684935');
        wood.rotation.y = .55;
        const wood2 = this.box(id + ':log-b', site, .12, .1, 0, .5, .09, .09, '#886044');
        wood2.rotation.y = -.55;
        if (id === 'thug-campsite') {
            const tent = MeshBuilder.CreateCylinder(id + ':bandit-tent', { diameterTop: .12, diameterBottom: 3.4, height: 2.5, tessellation: 4 }, this.scene);
            tent.parent = site;
            tent.position.set(-2, 1.25, -2.2);
            tent.rotation.y = Math.PI / 4;
            tent.material = this.mat('#765348');
            tent.isPickable = false;
            this.box(id + ':supply-crate', site, 2, .35, -1, .8, .7, .75, '#886044');
            this.box(id + ':crate-band', site, 2, .36, -1, .79, .1, .77, '#c09a5a');
        }
        this.camps.set(id, site);
    }
    moving(kind, id, hex) {
        const root = new TransformNode(kind + ':' + id, this.scene);
        root.parent = this.root;
        let mesh;
        if (kind === 'spell') {
            mesh = MeshBuilder.CreateSphere(kind + ':orb:' + id, { diameter: .23, segments: 8 }, this.scene);
            mesh.material = this.mat('#72c5ff', true);
            const halo = MeshBuilder.CreateTorus(kind + ':halo:' + id, { diameter: .4, thickness: .025, tessellation: 12 }, this.scene);
            halo.parent = root;
            halo.material = this.mat('#b8eaff', true);
            halo.isPickable = false;
        }
        else if (kind === 'arrow') {
            mesh = MeshBuilder.CreateCylinder(kind + ':shaft:' + id, { height: .86, diameter: .045, tessellation: 5 }, this.scene);
            mesh.rotation.x = Math.PI / 2;
            mesh.material = this.mat('#dbc58d');
            const head = this.box(kind + ':tip:' + id, root, 0, 0, .43, .1, .09, .16, '#aab1b5');
            head.isPickable = false;
        }
        else {
            const blade = this.box('loot-blade:' + id, root, 0, .03, 0, .1, .1, .58, hex), hilt = this.box('loot-hilt:' + id, root, 0, .03, .32, .18, .12, .09, '#9a734b');
            mesh = blade;
            if (id.includes('warhammer') || id.includes('battleaxe'))
                this.box('loot-head:' + id, root, 0, .03, -.31, .42, .2, .2, hex);
            else if (id.includes('rapier'))
                this.box('loot-guard:' + id, root, 0, .03, .25, .32, .07, .07, hex);
            hilt.isPickable = false;
        }
        mesh.parent = kind === 'loot' ? root : root;
        mesh.material = kind === 'loot' ? this.mat(hex, true) : mesh.material;
        mesh.isPickable = false;
        return { root, mesh, kind };
    }
    update(state, players, now, paused = false) {
        if (this.disposed)
            return;
        const hostiles = state;
        const playerById = new Map(players.map(p => [p.id, p.position]));
        const visibleMobs = new Set();
        for (const camp of hostiles?.camps ?? [])
            this.camp(camp.id, camp.position);
        for (const mob of hostiles?.mobs ?? []) {
            visibleMobs.add(mob.id);
            let actor = this.actors.get(mob.id);
            if (!actor || actor.kind !== mob.kind) {
                actor?.root.dispose();
                actor = this.actor(mob);
                this.actors.set(mob.id, actor);
            }
            actor.root.setEnabled(mob.hp > 0);
            if (mob.hp === 0)
                continue;
            actor.root.position.set(mob.position.x, mob.position.y, mob.position.z);
            actor.target.setEnabled(!!mob.target);
            const target = mob.target ? playerById.get(mob.target) : undefined;
            if (target)
                actor.root.rotation.y = Math.atan2(target.x - mob.position.x, target.z - mob.position.z);
            const t = paused ? 0 : now * .006 + (mob.id.length * 1.7);
            actor.torso.rotation.z = mob.target ? Math.sin(t) * .055 : Math.sin(t * .45) * .018;
            actor.arms[0].rotation.x = mob.target ? -.45 + Math.sin(t * 1.8) * .18 : Math.sin(t * .7) * .035;
            actor.arms[1].rotation.x = mob.target ? -.78 + Math.sin(t * 2.2) * .22 : Math.sin(t * .7 + 1) * .035;
            actor.legs.forEach((leg, i) => leg.rotation.x = mob.target ? Math.sin(t * .9 + i * Math.PI) * .08 : 0);
            const ratio = Math.max(0, Math.min(1, mob.hp / mob.maxHp));
            actor.health.scaling.x = ratio;
            actor.health.position.x = -(1 - ratio) * .55;
        }
        for (const [id, actor] of this.actors)
            if (!visibleMobs.has(id)) {
                actor.root.dispose();
                this.actors.delete(id);
            }
        const shotIds = new Set();
        for (const shot of hostiles?.projectiles ?? []) {
            shotIds.add(shot.id);
            let visual = this.shots.get(shot.id);
            if (!visual) {
                visual = this.moving(shot.kind, shot.id, '#72c5ff');
                this.shots.set(shot.id, visual);
            }
            visual.root.position.set(shot.position.x, shot.position.y + 1.2, shot.position.z);
            const target = hostiles?.mobs.find(m => m.id === shot.target)?.position;
            if (target)
                visual.root.rotation.y = Math.atan2(target.x - shot.position.x, target.z - shot.position.z);
            if (shot.kind === 'spell')
                visual.root.rotation.y += paused ? 0 : now * .002;
        }
        for (const [id, shot] of this.shots)
            if (!shotIds.has(id)) {
                shot.root.dispose();
                this.shots.delete(id);
            }
        const dropIds = new Set();
        for (const drop of hostiles?.loot ?? []) {
            dropIds.add(drop.id);
            let visual = this.drops.get(drop.id);
            if (!visual) {
                visual = this.moving('loot', drop.id + ':' + drop.item, ITEMS[drop.item].color);
                this.drops.set(drop.id, visual);
            }
            visual.root.position.set(drop.position.x, drop.position.y + .32 + (paused ? 0 : Math.sin(now * .004 + drop.bornTick) * .07), drop.position.z);
            visual.root.rotation.y = paused ? 0 : now * .0012;
        }
        for (const [id, drop] of this.drops)
            if (!dropIds.has(id)) {
                drop.root.dispose();
                this.drops.delete(id);
            }
    }
    setVisible(visible) { this.root.setEnabled(visible); }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.root.dispose(); for (const material of this.materials.values())
        material.dispose(); this.materials.clear(); this.actors.clear(); this.shots.clear(); this.drops.clear(); this.camps.clear(); }
}

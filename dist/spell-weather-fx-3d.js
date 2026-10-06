import { Color3, MeshBuilder, PointLight, StandardMaterial, Vector3 } from '@babylonjs/core';
export class SpellWeatherFX3D {
    scene;
    rain = [];
    sparks = [];
    materials = new Map();
    lightning = [];
    flash;
    disposed = false;
    lastStrike = false;
    seed = 17;
    constructor(scene) {
        this.scene = scene;
        const rainMat = this.material('rain', '#8ad8ee', .35);
        rainMat.emissiveColor = new Color3(.12, .28, .38);
        rainMat.alpha = .42;
        for (let i = 0; i < 96; i++) {
            const drop = MeshBuilder.CreateCylinder('rain-drop', { height: 1, diameter: .018, tessellation: 4 }, scene);
            drop.material = rainMat;
            drop.isPickable = false;
            drop.checkCollisions = false;
            this.rain.push(drop);
        }
        const boltMat = this.material('lightning', '#d8ecff', 1);
        boltMat.emissiveColor = new Color3(.7, .85, 1);
        boltMat.alpha = .8;
        for (let i = 0; i < 3; i++) {
            const bolt = MeshBuilder.CreateLines('lightning-branch', { points: [Vector3.Zero(), new Vector3(.4, -1.2, .1), new Vector3(-.25, -2.4, 0), new Vector3(.25, -3.4, .05)] }, scene);
            bolt.color = Color3.FromHexString('#d8ecff');
            bolt.alpha = 0;
            bolt.isPickable = false;
            this.lightning.push(bolt);
        }
        this.flash = new PointLight('storm-flash', Vector3.Zero(), scene);
        this.flash.diffuse = new Color3(.55, .72, 1);
        this.flash.intensity = 0;
        this.flash.range = 36;
    }
    material(key, color, alpha = 1) { let m = this.materials.get(key); if (!m) {
        m = new StandardMaterial('fx:' + key, this.scene);
        m.diffuseColor = Color3.FromHexString(color);
        m.specularColor = Color3.Black();
        m.alpha = alpha;
        this.materials.set(key, m);
    } return m; }
    next() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
    castSpell(origin, color = '#a978ff') { const mat = this.material('spell:' + color, color, .95); mat.emissiveColor = Color3.FromHexString(color).scale(.8); for (let i = 0; i < 18; i++) {
        const orb = MeshBuilder.CreateSphere('spell-particle', { diameter: .08 + this.next() * .1, segments: 6 }, this.scene);
        orb.material = mat;
        orb.position.set(origin.x, origin.y + 1 + this.next() * .7, origin.z);
        orb.isPickable = false;
        orb.checkCollisions = false;
        this.sparks.push({ mesh: orb, velocity: new Vector3((this.next() - .5) * 1.5, .7 + this.next() * 1.5, (this.next() - .5) * 1.5), life: 0, max: .7 + this.next() * .8 });
    } }
    update(now, paused, target, game, localPosition) {
        if (this.disposed)
            return;
        const t = now / 1000;
        for (let i = 0; i < this.rain.length; i++) {
            const d = this.rain[i], a = (i * 37) % 97 / 97, b = (i * 53) % 89 / 89;
            d.position.set(target.x + (a - .5) * 34, target.y + 5 + ((t * 7 + i * 1.7) % 12), target.z + (b - .5) * 26);
            d.scaling.y = 1.4 + ((i % 5) * .18);
            d.rotation.z = .08 + Math.sin(t + i) * .02;
            d.setEnabled(!paused);
        }
        for (const spark of this.sparks) {
            spark.life += paused ? 0 : .016;
            spark.mesh.position.addInPlace(spark.velocity.scale(paused ? 0 : .016));
            spark.velocity.y -= paused ? 0 : .9 * .016;
            spark.mesh.visibility = Math.max(0, 1 - spark.life / spark.max);
            if (spark.life >= spark.max) {
                spark.mesh.dispose();
            }
        }
        for (let i = this.sparks.length - 1; i >= 0; i--)
            if (this.sparks[i].life >= this.sparks[i].max)
                this.sparks.splice(i, 1);
        const strike = !!game?.encounter.strikeAt;
        if (strike && !this.lastStrike && localPosition)
            this.castSpell(localPosition, '#ff9a5c');
        this.lastStrike = strike;
        const lightningOn = !paused && (Math.sin(t * .21) + Math.sin(t * .071 + 2.1)) > 1.72;
        this.flash.position.set(target.x + 8, target.y + 12, target.z - 10);
        this.flash.intensity = lightningOn ? 7 : 0;
        for (const [i, bolt] of this.lightning.entries()) {
            bolt.position.set(target.x + (i - 1) * 8, target.y + 10, target.z - 12);
            bolt.visibility = lightningOn && Math.sin(t * 17 + i) > 0 ? .9 : 0;
        }
    }
    dispose() { if (this.disposed)
        return; this.disposed = true; for (const m of this.rain)
        m.dispose(); for (const s of this.sparks)
        s.mesh.dispose(); for (const b of this.lightning)
        b.dispose(); this.flash.dispose(); for (const m of this.materials.values())
        m.dispose(); this.materials.clear(); }
}

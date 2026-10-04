import { daylightAt } from './daylight.js';
import { Mesh, MeshBuilder, VertexData, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import { realmWeather } from './realm-weather.js';
import { isVisualQuality } from './visual-surface.js';
/** Bounded sky/cloud/rain dressing; render clock is supplied by the realm client. */
export class RealmSky3D {
    scene;
    seed;
    skyPaint = -Infinity;
    light = daylightAt(0);
    get daylight() { return { ...this.light }; }
    dome;
    clouds;
    rain;
    moon;
    stars;
    materials = [];
    lines = [];
    lastRain = -Infinity;
    frozenTime;
    disposed = false;
    constructor(scene, seed) {
        this.scene = scene;
        this.seed = seed;
        if (!Number.isSafeInteger(seed))
            throw Error('Invalid sky seed');
        const mat = (name, color) => { const m = new StandardMaterial(name, scene); m.diffuseColor = Color3.FromHexString(color); m.specularColor = Color3.Black(); this.materials.push(m); return m; };
        this.dome = MeshBuilder.CreateSphere('realm-sky:gradient', { diameter: 600, segments: 12 }, scene);
        const sky = mat('realm-sky:mat', '#ffffff');
        sky.disableLighting = true;
        sky.emissiveColor = Color3.White();
        sky.backFaceCulling = false;
        sky.fogEnabled = false;
        this.dome.material = sky;
        this.dome.infiniteDistance = true;
        this.dome.isPickable = false;
        const p = this.dome.getVerticesData('position'), colors = [];
        for (let i = 0; i < p.length; i += 3) {
            const n = Math.max(0, Math.min(1, (p[i + 1] + 60) / 320)), c = Color3.Lerp(Color3.FromHexString('#638aa0'), Color3.FromHexString('#172b55'), n);
            colors.push(c.r, c.g, c.b, 1);
        }
        this.dome.setVerticesData('color', colors, true, 4);
        const cloudMat = mat('realm-sky:cloud-matte', '#849ca8'), parts = [];
        for (let i = 0; i < 24; i++) {
            const m = MeshBuilder.CreateSphere('cloud-part', { diameter: 1, segments: 4 }, scene), a = i * Math.PI * 2 / 24;
            m.position.set(72 + Math.cos(a) * 90, 38 + (i % 3) * 4, Math.sin(a) * 90);
            m.scaling.set(15 + (i % 3) * 3, 3 + (i % 2), 9);
            m.material = cloudMat;
            parts.push(m);
        }
        const merged = Mesh.MergeMeshes(parts, true, true);
        if (!merged)
            throw Error('Cloud merge failed');
        this.clouds = merged;
        this.clouds.name = 'realm-sky:cloud-batch';
        this.clouds.isPickable = false;
        this.moon = MeshBuilder.CreateSphere('realm-sky:moon', { diameter: 11, segments: 8 }, scene);
        this.moon.position.set(105, 60, -110);
        const moon = mat('realm-sky:moon-matte', '#dce9e3');
        moon.emissiveColor = Color3.FromHexString('#91aabe');
        this.moon.material = moon;
        this.moon.isPickable = false;
        const points = [], indices = [];
        for (let i = 0; i < 70; i++) {
            const a = i * 2.399963 + (seed % 11), h = 35 + (i % 11) * 7, x = 72 + Math.cos(a) * 150, z = Math.sin(a) * 150, n = points.length / 3;
            points.push(x - .22, h, z, x + .22, h, z, x, h + .45, z);
            indices.push(n, n + 1, n + 2);
        }
        this.stars = new Mesh('realm-sky:stars', scene);
        const data = new VertexData();
        data.positions = points;
        data.indices = indices;
        data.applyToMesh(this.stars);
        const star = mat('realm-sky:star-matte', '#c4d8e5');
        star.disableLighting = true;
        star.emissiveColor = Color3.FromHexString('#c4d8e5');
        star.backFaceCulling = false;
        this.stars.material = star;
        this.stars.isPickable = false;
        for (let i = 0; i < 64; i++)
            this.lines.push([new Vector3(0, 0, 0), new Vector3(0, .7, 0)]);
        this.rain = MeshBuilder.CreateLineSystem('realm-sky:rain', { lines: this.lines, updatable: true }, scene);
        this.rain.color = new Color3(.66, .8, .9);
        this.rain.isPickable = false;
        this.rain.alwaysSelectAsActiveMesh = true;
        this.rain.setEnabled(false);
        for (const m of [this.dome, this.clouds, this.moon, this.stars, this.rain])
            m.checkCollisions = false;
    }
    update(timeMs, focus, paused, quality, retro) {
        if (this.disposed)
            throw Error('Sky layer disposed');
        if (!Number.isFinite(timeMs) || timeMs < 0 || !isVisualQuality(quality) || typeof paused !== 'boolean' || typeof retro !== 'boolean')
            throw Error('Invalid sky options');
        if (![focus.x, focus.y, focus.z].every(Number.isFinite))
            throw Error('Invalid sky focus');
        if (paused) {
            this.frozenTime ??= timeMs;
        }
        else
            this.frozenTime = undefined;
        const clock = this.frozenTime ?? timeMs, w = realmWeather(this.seed, clock);
        this.light = daylightAt(clock);
        const day = this.light.day;
        if (Math.abs(clock - this.skyPaint) >= 1000) {
            this.skyPaint = clock;
            const positions = this.dome.getVerticesData('position'), colors = [];
            for (let i = 0; i < positions.length; i += 3) {
                const n = Math.max(0, Math.min(1, (positions[i + 1] + 60) / 320)), nightColor = Color3.Lerp(new Color3(.2, .3, .4), new Color3(.025, .055, .14), n), dayColor = Color3.Lerp(new Color3(.65, .78, .83), new Color3(.15, .44, .74), n), c = Color3.Lerp(nightColor, dayColor, day);
                colors.push(c.r, c.g, c.b, 1);
            }
            this.dome.updateVerticesData('color', colors);
        }
        this.scene.fogDensity = w.fogDensity * (retro ? 1 : .8);
        this.scene.fogColor = Color3.Lerp(new Color3(.22, .35, .43), new Color3(.12, .2, .28), w.cloudWater);
        this.clouds.position.x = Math.sin(clock / 120000) * 8;
        this.clouds.visibility = .4 + w.cloudWater * .6;
        this.clouds.material.diffuseColor = Color3.Lerp(Color3.FromHexString('#b2c5c7'), Color3.FromHexString('#596c80'), w.cloudWater);
        this.stars.visibility = (1 - w.cloudWater * .8) * (1 - day);
        this.moon.visibility = 1 - w.cloudWater * .65;
        this.moon.material.emissiveColor = Color3.Lerp(new Color3(.57, .67, .75), new Color3(1, .85, .48), day);
        this.scene.fogColor = Color3.Lerp(this.scene.fogColor, new Color3(.55, .68, .74), day * .8);
        this.rain.setEnabled(!paused && w.rain > .02);
        this.rain.alpha = w.rain * .5;
        if (this.rain.isEnabled() && Math.abs(clock - this.lastRain) >= 100) {
            this.lastRain = clock;
            const count = quality === 'balanced' ? 24 : quality === 'high' ? 48 : 64;
            for (let i = 0; i < 64; i++) {
                const x = focus.x + Math.sin(i * 17 + this.seed) * 9, z = focus.z + Math.cos(i * 13 + this.seed) * 9, y = focus.y + 1 + ((i * .618 + clock / 550) % 1) * 9;
                this.lines[i][0].set(x, y, z);
                this.lines[i][1].set(x + w.wind * .2, y - (i < count ? .65 : 0), z);
            }
            MeshBuilder.CreateLineSystem('realm-sky:rain', { lines: this.lines, instance: this.rain });
        }
        return w;
    }
    dispose() { if (!this.disposed) {
        this.disposed = true;
        for (const m of [this.dome, this.clouds, this.moon, this.stars, this.rain])
            m.dispose(false, m === this.rain);
        for (const m of this.materials)
            m.dispose();
    } }
}

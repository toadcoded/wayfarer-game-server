import { BIOMES, BIOME_IDS } from './catalog.js';
export { BIOMES, BIOME_IDS } from './catalog.js';
export const GENERATOR_VERSION = 1;
export const CHUNK_SIZE = 64;
export const GRID = 16;
export const REGION_SIZE = 512;
export const MAX_CHUNK_COORD = 4095;
function integer(n, min, max, label) {
    if (!Number.isInteger(n) || n < min || n > max)
        throw new RangeError(label);
}
export function validateConfig(c) {
    integer(c.seed, 0, 0xffffffff, 'seed must be uint32');
    if (c.generatorVersion !== GENERATOR_VERSION)
        throw new Error('Unsupported generator version');
}
export function validateChunkCoord(n) { integer(n, -MAX_CHUNK_COORD, MAX_CHUNK_COORD, 'chunk coordinate out of range'); }
function coordinate(n) {
    if (!Number.isFinite(n) || (n < -MAX_CHUNK_COORD * CHUNK_SIZE || n > (MAX_CHUNK_COORD + 1) * CHUNK_SIZE))
        throw new RangeError('world coordinate out of range');
}
function hash(seed, x, z, salt = 0) {
    let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(salt, 1274126177)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
}
function random(seed) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
function noise(seed, x, z) {
    const ix = Math.floor(x), iz = Math.floor(z), tx = smooth(x - ix), tz = smooth(z - iz);
    const at = (dx, dz) => hash(seed, ix + dx, iz + dz) / 4294967296;
    return lerp(lerp(at(0, 0), at(1, 0), tx), lerp(at(0, 1), at(1, 1), tx), tz) * 2 - 1;
}
/** Centered region Voronoi grid; negative coordinates use floor, never truncation. */
function regionRaw(seed, x, z) {
    const rx = Math.floor((x + REGION_SIZE / 2) / REGION_SIZE), rz = Math.floor((z + REGION_SIZE / 2) / REGION_SIZE);
    const biome = rx === 0 && rz === 0 ? 'river-valley' : BIOME_IDS[hash(seed, rx, rz, 7) % BIOME_IDS.length];
    return { id: `region:${rx}:${rz}`, rx, rz, biome, name: BIOMES[biome].name };
}
export function regionAt(c, x, z) {
    validateConfig(c);
    coordinate(x);
    coordinate(z);
    return regionRaw(c.seed, x, z);
}
/** Blend adjacent region terrain parameters, preserving vertex continuity. */
function terrain(c, x, z) {
    const gx = x / REGION_SIZE, gz = z / REGION_SIZE, ix = Math.floor(gx), iz = Math.floor(gz);
    const t = (dx, dz) => BIOMES[regionRaw(c.seed, (ix + dx) * REGION_SIZE, (iz + dz) * REGION_SIZE).biome].terrain;
    const h = (dx, dz) => {
        const p = t(dx, dz);
        return p.base + p.amplitude * (0.75 * noise(c.seed, x / p.wavelength, z / p.wavelength) + 0.25 * noise(c.seed ^ 9871, x / 38, z / 38));
    };
    return lerp(lerp(h(0, 0), h(1, 0), smooth(gx - ix)), lerp(h(0, 1), h(1, 1), smooth(gx - ix)), smooth(gz - iz));
}
function surfaceRaw(c, x, z) {
    const base = terrain(c, x, z);
    // Continuous world-space river, independent of chunk visitation order.
    const center = 72 + 36 * Math.sin(z / 190) + 12 * Math.sin(z / 61);
    const distance = Math.abs(x - center);
    const riverBed = terrain(c, center, z) - 5;
    const gx = x / REGION_SIZE, gz = z / REGION_SIZE, ix = Math.floor(gx), iz = Math.floor(gz);
    const wet = (dx, dz) => BIOMES[regionRaw(c.seed, (ix + dx) * REGION_SIZE, (iz + dz) * REGION_SIZE).biome].terrain.river ? 1 : 0;
    const strength = lerp(lerp(wet(0, 0), wet(1, 0), smooth(gx - ix)), lerp(wet(0, 1), wet(1, 1), smooth(gx - ix)), smooth(gz - iz));
    const influence = (1 - smooth(Math.min(distance / 18, 1))) * strength;
    const height = lerp(base, riverBed, influence);
    const waterY = distance < 12 ? terrain(c, center, z) - 1.5 : null;
    return { height, water: waterY !== null && height < waterY, waterY };
}
export function surfaceAt(c, x, z) {
    validateConfig(c);
    coordinate(x);
    coordinate(z);
    return surfaceRaw(c, x, z);
}
export function weatherAt(c, region, serverTimeMs) {
    validateConfig(c);
    if (!Number.isSafeInteger(serverTimeMs) || serverTimeMs < 0)
        throw new RangeError('invalid server time');
    const choices = BIOMES[region.biome].weather, epoch = Math.floor(serverTimeMs / 300000);
    const kind = choices[hash(c.seed, region.rx, region.rz, epoch) % choices.length];
    return { kind, epoch, visibility: kind === 'fog' ? 0.45 : kind === 'sandstorm' ? 0.3 : kind === 'ash' ? 0.6 : 1 };
}
/** One proposed landmark per region. Fixed pads can be sculpted by an engine adapter. */
function landmarkAt(c, r) {
    const choices = BIOMES[r.biome].landmarks;
    const kind = choices[hash(c.seed, r.rx, r.rz, 33) % choices.length];
    const x = r.rx * REGION_SIZE + 32, z = r.rz * REGION_SIZE + 32;
    return { id: `${r.id}:landmark`, kind, position: { x, z, y: surfaceRaw(c, x, z).height }, radius: 24 };
}
export function generateChunk(c, cx, cz) {
    validateConfig(c);
    validateChunkCoord(cx);
    validateChunkCoord(cz);
    const x0 = cx * CHUNK_SIZE, z0 = cz * CHUNK_SIZE, step = CHUNK_SIZE / GRID;
    const region = regionRaw(c.seed, x0 + CHUNK_SIZE / 2, z0 + CHUNK_SIZE / 2);
    const heights = [], waterDepths = [];
    for (let z = 0; z <= GRID; z++)
        for (let x = 0; x <= GRID; x++)
            heights.push(surfaceRaw(c, x0 + x * step, z0 + z * step).height);
    for (let z = 0; z < GRID; z++)
        for (let x = 0; x < GRID; x++) {
            const s = surfaceRaw(c, x0 + (x + .5) * step, z0 + (z + .5) * step);
            waterDepths.push(s.water ? s.waterY - s.height : 0);
        }
    const landmark = landmarkAt(c, region);
    const landmarks = landmark.position.x >= x0 && landmark.position.x < x0 + CHUNK_SIZE && landmark.position.z >= z0 && landmark.position.z < z0 + CHUNK_SIZE ? [landmark] : [];
    const rand = random(hash(c.seed, cx, cz, 99)), props = [];
    for (let i = 0; i < 28; i++) {
        const x = x0 + rand() * CHUNK_SIZE, z = z0 + rand() * CHUNK_SIZE, s = surfaceRaw(c, x, z);
        const yaw = rand() * Math.PI * 2, scale = .7 + rand() * .6;
        const palette = BIOMES[regionRaw(c.seed, x, z).biome].props, kind = palette[Math.floor(rand() * palette.length)];
        // Keep continuous crossing trails and landmark approach space clear.
        const trailX = Math.abs(x - Math.round(x / REGION_SIZE) * REGION_SIZE) < 4;
        const trailZ = Math.abs(z - Math.round(z / REGION_SIZE) * REGION_SIZE) < 4;
        if (s.water || trailX || trailZ || Math.hypot(x - landmark.position.x, z - landmark.position.z) < landmark.radius)
            continue;
        props.push({ id: `${cx}:${cz}:prop:${i}`, kind, position: { x, y: s.height, z }, yaw, scale });
    }
    return { id: `chunk:${cx}:${cz}`, cx, cz, region, heights, waterDepths, props, landmarks };
}
/** Visible square of chunks. Host should cache and unload descriptors outside this set. */
export function nearbyChunks(x, z, radius = 1) {
    coordinate(x);
    coordinate(z);
    integer(radius, 0, 4, 'radius must be 0..4');
    const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE), out = [];
    for (let dz = -radius; dz <= radius; dz++)
        for (let dx = -radius; dx <= radius; dx++) {
            if (Math.abs(cx + dx) <= MAX_CHUNK_COORD && Math.abs(cz + dz) <= MAX_CHUNK_COORD)
                out.push({ cx: cx + dx, cz: cz + dz });
        }
    return out;
}
export class ChunkView {
    config;
    renderer;
    mounted = new Set();
    constructor(config, renderer) {
        this.config = config;
        this.renderer = renderer;
        validateConfig(config);
        this.config = { ...config };
    }
    update(x, z, radius = 1) {
        const desired = new Map(nearbyChunks(x, z, radius).map(p => [`chunk:${p.cx}:${p.cz}`, p]));
        for (const id of this.mounted)
            if (!desired.has(id)) {
                this.renderer.unmount(id);
                this.mounted.delete(id);
            }
        for (const [id, p] of desired)
            if (!this.mounted.has(id)) {
                const chunk = generateChunk(this.config, p.cx, p.cz);
                this.renderer.mount(chunk, BIOMES[chunk.region.biome]);
                this.mounted.add(id);
            }
    }
    dispose() { for (const id of this.mounted) {
        this.renderer.unmount(id);
        this.mounted.delete(id);
    } }
}

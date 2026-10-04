import { regionAt, CHUNK_SIZE, validateConfig, validateChunkCoord } from './world.js';
import { terrainSampler } from './navigation.js';
const land = ['river-valley', 'grassland', 'forest'];
export const WILDLIFE = Object.freeze({
    bunny: { name: 'Bunny', family: 'rabbit', color: '#c5b69c', size: .65, habitats: land },
    rabbit: { name: 'Rabbit', family: 'rabbit', color: '#a3947c', size: 1, habitats: [...land, 'alpine', 'tundra'] },
    squirrel: { name: 'Squirrel', family: 'rodent', color: '#a77a51', size: .7, habitats: land },
    fox: { name: 'Fox', family: 'fox', color: '#b77e4d', size: 1.25, habitats: [...land, 'alpine', 'tundra', 'desert'] },
    bird: { name: 'Songbird', family: 'bird', color: '#879eaf', size: .45, habitats: [...land, 'mire', 'desert', 'oasis-coast', 'alpine', 'tundra', 'volcanic'] },
    pigeon: { name: 'Pigeon', family: 'bird', color: '#8e929e', size: .7, habitats: ['river-valley', 'grassland', 'oasis-coast'] },
    otter: { name: 'Otter', family: 'mustelid', color: '#806c55', size: 1.1, habitats: ['river-valley', 'mire', 'oasis-coast'] },
    ferret: { name: 'Ferret', family: 'mustelid', color: '#b5a589', size: .85, habitats: land },
    groundhog: { name: 'Groundhog', family: 'rodent', color: '#9b8a6c', size: 1.05, habitats: ['river-valley', 'grassland', 'alpine'] },
    mole: { name: 'Mole', family: 'burrower', color: '#797377', size: .65, habitats: land },
    shrew: { name: 'Shrew', family: 'burrower', color: '#927f71', size: .4, habitats: ['river-valley', 'forest', 'mire', 'cavern'] },
    mouse: { name: 'Mouse', family: 'rodent', color: '#aaa08d', size: .4, habitats: [...land, 'mire', 'desert', 'oasis-coast', 'alpine', 'tundra', 'volcanic', 'cavern'] },
    hedgehog: { name: 'Hedgehog', family: 'burrower', color: '#8c7b5b', size: .65, habitats: ['grassland', 'forest'] },
    duck: { name: 'Duck', family: 'bird', color: '#758f69', size: .9, habitats: ['river-valley', 'mire', 'oasis-coast'] },
});
for (const profile of Object.values(WILDLIFE)) {
    Object.freeze(profile.habitats);
    Object.freeze(profile);
}
export const WILDLIFE_SPECIES = Object.freeze(Object.keys(WILDLIFE));
function random(seed, salt) { let n = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); return ((n ^ (n >>> 13)) >>> 0) / 4294967296; }
export function wildlifeHabitat(biome) { return WILDLIFE_SPECIES.filter(s => WILDLIFE[s].habitats.includes(biome)); }
function safe(ground, x, z) { const g = ground(x, z); return Number.isFinite(g.height) && Number.isFinite(g.waterDepth) && g.waterDepth <= .15 && g.slopeDegrees <= 30; }
function descriptor(id, species, x, z, phase, ground) { return { id, species, position: { x, y: ground(x, z).height, z }, phase, attackable: false, collidable: false, drops: false }; }
/** Separate decorative population protocol: never changes terrain-v1 or realm combat state. */
export function wildlifeForChunk(config, cx, cz, limit = 6) {
    validateConfig(config);
    validateChunkCoord(cx);
    validateChunkCoord(cz);
    if (!Number.isInteger(limit) || limit < 0 || limit > 12)
        throw new Error('Invalid wildlife budget');
    const biome = regionAt(config, cx * CHUNK_SIZE + 32, cz * CHUNK_SIZE + 32).biome, choices = wildlifeHabitat(biome), ground = terrainSampler(config), out = [];
    const salt = Math.imul(cx, 374761393) ^ Math.imul(cz, 668265263);
    for (let i = 0; i < limit; i++)
        for (let attempt = 0; attempt < 12; attempt++) {
            const r = i * 40 + attempt * 3, x = cx * CHUNK_SIZE + 4 + random(config.seed, salt + r) * 56, z = cz * CHUNK_SIZE + 4 + random(config.seed, salt + r + 1) * 56;
            if (!safe(ground, x, z) || ![-1, 1].every(d => safe(ground, x + d, z) && safe(ground, x, z + d)))
                continue;
            const species = choices[Math.floor(random(config.seed, salt + r + 2) * choices.length)];
            if ((species === 'otter' || species === 'duck') && ![-4, 4].some(d => ground(x + d, z).waterDepth > .05 || ground(x, z + d).waterDepth > .05))
                continue;
            out.push(descriptor(`wildlife:${cx}:${cz}:${i}`, species, x, z, random(config.seed, salt + r + 10) * Math.PI * 2, ground));
            break;
        }
    return out;
}
/** Curated wildlife pockets in the playable river realm; dry bank roam sites are ground checked. */
export function wildlifeForRealm(config, anchors, ground) {
    validateConfig(config);
    const out = [];
    WILDLIFE_SPECIES.forEach((species, i) => { const a = anchors[i % anchors.length]; if (!a)
        return; for (let attempt = 0; attempt < 12; attempt++) {
        const x = a.x + (i % 4 - 1.5) * 2.5 + (random(config.seed, i * 20 + attempt) - .5), z = a.z + (i % 2 ? 1 : -1) * (8 + Math.floor(i / 4) * 1.1) + attempt * .35;
        if (!safe(ground, x, z))
            continue;
        out.push(descriptor(`wildlife:realm:${species}`, species, x, z, random(config.seed, i + 500) * Math.PI * 2, ground));
        break;
    } });
    return out;
}
export function wildlifePose(npc, now, paused = false) {
    if (!Number.isFinite(now) || now < 0)
        throw new Error('Invalid wildlife time');
    const t = paused ? 0 : now / 1000, p = t * .35 + npc.phase;
    const resting = Math.sin(t * .12 + npc.phase) > .55;
    const activity = paused ? 0 : Math.max(0, Math.min(1, (.55 - Math.sin(t * .12 + npc.phase)) * 8));
    const x = Math.sin(p) * .8 * activity, z = Math.sin(p * .7) * .65 * activity;
    return { x: npc.position.x + x, z: npc.position.z + z, yaw: paused ? npc.phase : Math.atan2(Math.cos(p) * .8, Math.cos(p * .7) * .455), hop: WILDLIFE[npc.species].family === 'rabbit' ? Math.max(0, Math.sin(t * 4 + npc.phase)) * .12 * activity : 0, phase: paused ? npc.phase : t * 4 + npc.phase, resting, activity };
}

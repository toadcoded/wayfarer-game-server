import { terrainSampler } from './navigation.js';
import { planCrossing, mountCrossing } from './crossings.js';
import { generateChunk, CHUNK_SIZE } from './world.js';
import { reserveSites } from './site-placement.js';
import { propPrimitives, landmarkPrimitives } from './geometry.js';
import { REALM_CONTRACT } from './realm-contract.js';
export const REALM_WORLD = { seed: REALM_CONTRACT.worldSeed, generatorVersion: REALM_CONTRACT.generatorVersion };
/** Shared deterministic rehearsal geometry and collision setup, independently built on each side. */
export function createRealmScene() {
    const base = terrainSampler(REALM_WORLD);
    const plan = planCrossing(base, { id: 'local-realm', style: 'willowglass', z: 0, minX: -16, maxX: 176 });
    // The crossing remains the authored start route, but the realm now exposes the
    // surrounding valley, ridges, groves, and landmark sites as one connected map.
    plan.bounds = { minX: -96, maxX: 160, minZ: -128, maxZ: 128 };
    const mounted = mountCrossing(base, plan, .45), b = plan.bounds;
    for (let cz = Math.floor(b.minZ / CHUNK_SIZE); cz <= Math.floor(b.maxZ / CHUNK_SIZE); cz++)
        for (let cx = Math.floor(b.minX / CHUNK_SIZE); cx <= Math.floor(b.maxX / CHUNK_SIZE); cx++) {
            const chunk = reserveSites(generateChunk(REALM_WORLD, cx, cz), [plan]);
            const props = chunk.props.filter(p => p.position.x >= b.minX && p.position.x <= b.maxX && p.position.z >= b.minZ && p.position.z <= b.maxZ)
                .map(p => ({ ...p, position: { ...p.position, y: mounted.construction.terrainAt(p.position.x, p.position.z).height } }));
            const visibleChunk = { ...chunk, props };
            mounted.navigation.addPrimitives(propPrimitives(visibleChunk));
            mounted.navigation.addPrimitives(landmarkPrimitives({ ...visibleChunk, landmarks: chunk.landmarks }));
        }
    return { plan, ...mounted };
}

import { terrainSampler } from './navigation.js';
import { planCrossing, mountCrossing, inspectNearby } from './crossings.js';
import { ServerWalker, encodeMoveIntent } from './movement.js';
const config = { seed: 20260928, generatorVersion: 1 };
const base = terrainSampler(config);
const plan = planCrossing(base, { id: 'willowglass-01', style: 'willowglass', z: 0, minX: -16, maxX: 176 });
const { construction, navigation } = mountCrossing(base, plan);
const player = new ServerWalker(navigation, plan.start, { speed: 4, ticksPerSecond: 20 });
const totalTicks = Math.ceil((plan.goal.x - plan.start.x) / .2);
for (let tick = 0; tick < totalTicks; tick++) {
    const remaining = plan.goal.x - player.snapshot().position.x;
    player.receiveInput(encodeMoveIntent({ sequence: tick, dx: Math.min(1, remaining / .2), dz: 0 }));
    const state = player.advance();
    if (state.blocked)
        throw new Error(`Traversal blocked at tick ${tick}`);
}
console.log({ name: plan.name, constructionVersion: plan.constructionVersion,
    pads: plan.pads.length, surfaces: plan.surfaces.length, detailParts: plan.primitives.length,
    route: navigation.findPath(plan.start, plan.goal).status, arrival: player.snapshot(),
    inscription: inspectNearby(plan, plan.inspection[0].position)[0].text });
// Render construction.terrainMesh(...) instead of the old ground in this edited region.
// Render surfaceMesh(surface), railMeshes(surface), and plan.primitives separately.
console.log('Edited terrain vertices:', construction.terrainMesh(plan.bounds, '#63865C').positions.length / 3);

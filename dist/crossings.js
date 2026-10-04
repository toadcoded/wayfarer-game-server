import { NavigationWorld } from './navigation.js';
import { ConstructionWorld, CONSTRUCTION_VERSION, foundationStones, railColliders, pointOnSurface, surfaceHeight } from './construction.js';
export const CROSSING_STYLES = {
    willowglass: { name: 'Willowglass Causeway', deck: '#857052', stone: '#8D9988', metal: '#6B9C94', glow: '#D7EAC0',
        ground: '#63865C', water: '#487F87', fog: '#C4D4C5', motifs: ['willow-seed lanterns', 'rain-dark stone', 'votive garden', 'braided river marks'],
        lore: 'Travelers leave an unlit lantern here for a journey they have not yet dared to begin.',
        ambience: 'river / leaf-rustle / hollow-wood chime' },
    saffron: { name: 'Saffron Meridian', deck: '#C69563', stone: '#AE7350', metal: '#557F84', glow: '#FFD891',
        ground: '#BC996D', water: '#448E91', fog: '#E2C7A1', motifs: ['sun-disc obelisks', 'turquoise inlay', 'shadow-calendar court', 'star-counting pillars'],
        lore: 'At noon the paired obelisks cast a narrow road of shade. The keepers call it the second bridge.',
        ambience: 'dry wind / ceramic chime / distant water' },
    mothlight: { name: 'Mothlight Boardwalk', deck: '#68634F', stone: '#646E5E', metal: '#95A69C', glow: '#BEE1B3',
        ground: '#52684B', water: '#405E5C', fog: '#A5B9A4', motifs: ['glowcap reliquaries', 'reed-woven pylons', 'flood-mark posts', 'moth-wing screens'],
        lore: 'Each flood-mark bears a tiny brass moth. The lowest marks remember houses the marsh has borrowed.',
        ambience: 'reeds / frogs / soft wooden knocks' },
};
function sampleGrid(b, fn) {
    for (let z = b.minZ; z <= b.maxZ; z++)
        for (let x = b.minX; x <= b.maxX; x++)
            fn(x, z);
}
function padFloor(base, b) {
    let y = -Infinity;
    sampleGrid(b, (x, z) => { const s = base(x, z); if (s.waterDepth > .01)
        throw new Error('Wet landing'); y = Math.max(y, s.height); });
    return y + .15;
}
function ornament(planId, pad, style, side) {
    const c = CROSSING_STYLES[style], x = (pad.bounds.minX + pad.bounds.maxX) / 2, z = (pad.bounds.minZ + pad.bounds.maxZ) / 2, y = pad.elevation;
    const out = [];
    const add = (shape, dx, dy, dz, sx, sy, sz, color, solid = true) => out.push({ id: `${planId}:${side}:ornament:${out.length}`, shape, position: { x: x + dx, y: y + dy, z: z + dz }, size: { x: sx, y: sy, z: sz }, color, collision: solid ? 'solid' : 'none' });
    for (const dz of [-5, 5]) {
        if (style === 'willowglass') {
            add('box', 0, 1.4, dz, .45, 2.8, .45, c.deck);
            add('sphere', 0, 3, dz, .85, 1.1, .85, c.glow, false);
            add('box', -2, .3, dz, 2.2, .6, 1.2, c.stone);
            add('sphere', -2, .8, dz, 1.3, .8, .8, '#709563', false);
        }
        else if (style === 'saffron') {
            add('box', 0, 2.8, dz, 1.2, 5.6, 1.2, c.stone);
            add('cone', 0, 6, dz, 1.5, .8, 1.5, c.glow, false);
            for (let level = 1; level <= 4; level++)
                add('box', .61, level, dz, .025, .18, .55, c.metal, false);
            add('sphere', 0, 4.8, dz, .15, .8, .8, c.glow, false);
        }
        else {
            add('box', 0, 1.7, dz, .5, 3.4, .5, c.deck);
            add('sphere', 0, 3.5, dz, 1.5, .35, 1.5, c.glow, false);
            for (let mark = 1; mark <= 4; mark++)
                add('box', .26, mark * .55, dz, .02, .08, .35, c.metal, false);
            add('box', -2, .5, dz, 2, .25, 1, c.deck);
            add('box', -2, .2, dz, .2, .4, .8, c.deck);
        }
    }
    return out;
}
export function mountCrossing(base, plan, maxWaterDepth = .15) {
    if (plan.constructionVersion !== CONSTRUCTION_VERSION)
        throw new Error('Unsupported construction version');
    const construction = new ConstructionWorld(base);
    for (const p of plan.pads)
        construction.addPad(p);
    for (const s of plan.surfaces)
        construction.addSurface(s);
    const navigation = new NavigationWorld(construction.sample, { bounds: plan.bounds, cellSize: 2, radius: .35, height: 1.8, maxSlopeDegrees: 30, maxWaterDepth });
    for (const s of plan.surfaces)
        for (const rail of railColliders(s))
            navigation.upsertCollider(rail);
    navigation.addPrimitives(plan.primitives);
    return { construction, navigation };
}
/** Scan an X-axis river crossing. Fail explicitly when this corridor cannot support a safe candidate. */
export function planCrossing(base, o) {
    const width = o.width ?? 8, clearance = o.clearance ?? 1.25;
    if (!o.id || !Object.hasOwn(CROSSING_STYLES, o.style) || ![o.z, o.minX, o.maxX, width].every(Number.isInteger) ||
        o.maxX <= o.minX || o.maxX - o.minX > 192 || width < 6 || width > 12 || width % 2 || !Number.isFinite(clearance) || clearance < .5 || clearance > 4)
        throw new Error('Invalid crossing options');
    const half = width / 2, wetColumns = [];
    for (let x = o.minX; x <= o.maxX; x++) {
        let wet = false;
        for (let z = o.z - half; z <= o.z + half; z++)
            if (base(x, z).waterDepth > .05)
                wet = true;
        if (wet)
            wetColumns.push(x);
    }
    if (!wetColumns.length)
        throw new Error('No water corridor found');
    for (let i = 1; i < wetColumns.length; i++)
        if (wetColumns[i] - wetColumns[i - 1] > 1)
            throw new Error('Multiple water corridors; use a narrower search interval');
    const west = wetColumns[0] - 4, east = wetColumns[wetColumns.length - 1] + 4;
    if (west <= o.minX || east >= o.maxX)
        throw new Error('Search interval does not include both dry banks');
    const c = CROSSING_STYLES[o.style];
    // Progressively lengthen approaches; all candidates have fixed bounded sampling cost.
    for (const run of [16, 24, 32, 40, 48]) {
        const lx = west - run, rx = east + run;
        const left = { id: `${o.id}:west-pad`, bounds: { minX: lx - 5, maxX: lx + 5, minZ: o.z - half - 4, maxZ: o.z + half + 4 }, elevation: 0, blend: 6 };
        const right = { id: `${o.id}:east-pad`, bounds: { minX: rx - 5, maxX: rx + 5, minZ: o.z - half - 4, maxZ: o.z + half + 4 }, elevation: 0, blend: 6 };
        try {
            left.elevation = padFloor(base, left.bounds);
            right.elevation = padFloor(base, right.bounds);
        }
        catch (e) {
            if (e instanceof Error && e.message === 'Wet landing')
                continue;
            throw e;
        }
        let top = Math.max(left.elevation, right.elevation);
        sampleGrid({ minX: west, maxX: east, minZ: o.z - half, maxZ: o.z + half }, (x, z) => {
            const s = base(x, z);
            top = Math.max(top, s.height + s.waterDepth + clearance);
        });
        const surfaces = [
            { id: `${o.id}:west-ramp`, bounds: { minX: lx, maxX: west, minZ: o.z - half, maxZ: o.z + half }, axis: 'x', startY: left.elevation, endY: top, thickness: .4, color: c.deck },
            { id: `${o.id}:deck`, bounds: { minX: west, maxX: east, minZ: o.z - half, maxZ: o.z + half }, axis: 'x', startY: top, endY: top, thickness: .5, color: c.deck },
            { id: `${o.id}:east-ramp`, bounds: { minX: east, maxX: rx, minZ: o.z - half, maxZ: o.z + half }, axis: 'x', startY: top, endY: right.elevation, thickness: .4, color: c.deck },
        ];
        if (surfaces.some(s => Math.atan(Math.abs(s.endY - s.startY) / (s.bounds.maxX - s.bounds.minX)) * 180 / Math.PI > 24))
            continue;
        const primitives = [...foundationStones(base, left, c.stone), ...foundationStones(base, right, c.stone),
            ...ornament(o.id, left, o.style, 'west'), ...ornament(o.id, right, o.style, 'east')];
        // Piers end below the deck, so they cannot block walkers on the upper surface.
        for (let x = west + 3; x < east - 2; x += 8)
            for (const z of [o.z - half + .6, o.z + half - .6]) {
                const bottom = base(x, z).height - .5, pierTop = top - .55;
                if (pierTop > bottom)
                    primitives.push({ id: `${o.id}:pier:${primitives.length}`, shape: 'box', position: { x, y: (bottom + pierTop) / 2, z }, size: { x: .65, y: pierTop - bottom, z: .65 }, color: c.stone, collision: 'none' });
            }
        const plan = { constructionVersion: 1, id: o.id, style: o.style, name: c.name, pads: [left, right], surfaces, primitives,
            start: { x: lx - 3, y: left.elevation, z: o.z }, goal: { x: rx + 3, y: right.elevation, z: o.z },
            inspection: [{ id: `${o.id}:inscription`, name: `${c.name}: waystone`, position: { x: lx, y: left.elevation, z: o.z - 2 }, radius: 3, text: c.lore }],
            bounds: { minX: lx - 12, maxX: rx + 12, minZ: o.z - half - 12, maxZ: o.z + half + 12 },
            earthworkBounds: [left, right].map(p => ({ minX: p.bounds.minX - p.blend, maxX: p.bounds.maxX + p.blend, minZ: p.bounds.minZ - p.blend, maxZ: p.bounds.maxZ + p.blend })), verifiedCenterline: [] };
        const { construction, navigation } = mountCrossing(base, plan);
        let buried = false;
        for (const s of surfaces)
            sampleGrid(s.bounds, (x, z) => { if (surfaceHeight(s, x, z) < construction.terrainAt(x, z).height - 1e-6)
                buried = true; });
        if (buried)
            continue;
        const crossing = navigation.traverse(plan.start, plan.goal);
        if (!crossing.ok)
            continue;
        plan.verifiedCenterline = [plan.start, ...surfaces.flatMap(s => [pointOnSurface(s, 0), pointOnSurface(s, 1)]), plan.goal];
        return plan;
    }
    throw new Error('No safe crossing candidate: bank slope, buried ramp, wet landing, or blocked approach');
}
/** Read-only inspection utility; no loot, quest or persistence authority is implied. */
export function inspectNearby(plan, position) {
    if (![position.x, position.y, position.z].every(Number.isFinite))
        throw new Error('Invalid inspection position');
    return plan.inspection.filter(p => Math.hypot(p.position.x - position.x, p.position.y - position.y, p.position.z - position.z) <= p.radius)
        .map(p => ({ ...p, position: { ...p.position } }));
}

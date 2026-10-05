export const CONSTRUCTION_VERSION = 1;
const finite = (v) => Number.isFinite(v);
function checkedBounds(b) {
    if (![b.minX, b.maxX, b.minZ, b.maxZ].every(finite) || b.minX >= b.maxX || b.minZ >= b.maxZ ||
        Math.max(b.maxX - b.minX, b.maxZ - b.minZ) > 256)
        throw new RangeError('Invalid construction bounds (maximum extent 256)');
}
export const contains = (b, x, z) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
const overlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
const expanded = (b, n) => ({ minX: b.minX - n, maxX: b.maxX + n, minZ: b.minZ - n, maxZ: b.maxZ + n });
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.max(0, Math.min(1, v));
function validSample(s) {
    if (![s.height, s.slopeDegrees, s.waterDepth].every(finite) || s.waterDepth < 0 || s.slopeDegrees < 0)
        throw new Error('Invalid base terrain sample');
    return s;
}
export function surfaceHeight(surface, x, z) {
    const b = surface.bounds;
    const t = surface.axis === 'x' ? (x - b.minX) / (b.maxX - b.minX) : (z - b.minZ) / (b.maxZ - b.minZ);
    return mix(surface.startY, surface.endY, clamp(t));
}
/** Terrain edits and support surfaces share this single authority with render geometry. */
export class ConstructionWorld {
    base;
    pads = new Map();
    supports = new Map();
    revisionNumber = 0;
    get revision() { return this.revisionNumber; }
    constructor(base) {
        this.base = base;
    }
    addPad(pad) {
        checkedBounds(pad.bounds);
        if (!pad.id || !finite(pad.elevation) || !Number.isInteger(pad.blend) || pad.blend < 2 || pad.blend > 32 ||
            !Object.values(pad.bounds).every(Number.isInteger))
            throw new Error('Invalid foundation pad');
        if (this.pads.has(pad.id))
            throw new Error('Duplicate pad id');
        for (const existing of this.pads.values())
            if (overlap(expanded(existing.bounds, existing.blend), expanded(pad.bounds, pad.blend)))
                throw new Error('Overlapping earthworks');
        this.pads.set(pad.id, { ...pad, bounds: { ...pad.bounds } });
        this.revisionNumber++;
    }
    addSurface(surface) {
        checkedBounds(surface.bounds);
        if (!surface.id || !['x', 'z'].includes(surface.axis) || ![surface.startY, surface.endY, surface.thickness].every(finite) ||
            surface.thickness <= 0 || surface.thickness > 10)
            throw new Error('Invalid walk surface');
        if (this.supports.has(surface.id))
            throw new Error('Duplicate surface id');
        // Adjacent surfaces can touch but overlapping interiors would be ambiguous for a heightfield walker.
        for (const existing of this.supports.values()) {
            if (overlap(existing.bounds, surface.bounds))
                throw new Error('Overlapping support surfaces');
            const a = existing.bounds, b = surface.bounds, points = [];
            const z0 = Math.max(a.minZ, b.minZ), z1 = Math.min(a.maxZ, b.maxZ), x0 = Math.max(a.minX, b.minX), x1 = Math.min(a.maxX, b.maxX);
            if (z1 > z0 && (a.maxX === b.minX || b.maxX === a.minX)) {
                const x = a.maxX === b.minX ? a.maxX : b.maxX;
                points.push([x, z0], [x, z1]);
            }
            if (x1 > x0 && (a.maxZ === b.minZ || b.maxZ === a.minZ)) {
                const z = a.maxZ === b.minZ ? a.maxZ : b.maxZ;
                points.push([x0, z], [x1, z]);
            }
            if (points.some(([x, z]) => Math.abs(surfaceHeight(existing, x, z) - surfaceHeight(surface, x, z)) > 1e-6))
                throw new Error('Discontinuous support seam');
        }
        this.supports.set(surface.id, { ...surface, bounds: { ...surface.bounds } });
        this.revisionNumber++;
    }
    removeSurface(id) { const removed = this.supports.delete(id); if (removed)
        this.revisionNumber++; return removed; }
    removePad(id) { const removed = this.pads.delete(id); if (removed)
        this.revisionNumber++; return removed; }
    vertexHeight(x, z) {
        const original = validSample(this.base(x, z));
        let y = original.height;
        for (const p of this.pads.values()) {
            const dx = Math.max(p.bounds.minX - x, 0, x - p.bounds.maxX), dz = Math.max(p.bounds.minZ - z, 0, z - p.bounds.maxZ);
            const d = Math.max(dx, dz);
            if (d >= p.blend)
                continue;
            y = mix(original.height, p.elevation, 1 - smooth(d / p.blend));
            break;
        }
        return y;
    }
    /** A globally aligned 1-unit lattice, using the same triangle diagonal as the mesh. */
    terrainAt(x, z) {
        if (!finite(x) || !finite(z))
            throw new Error('Invalid sample coordinates');
        const x0 = Math.floor(x), z0 = Math.floor(z), u = x - x0, v = z - z0;
        const a = this.vertexHeight(x0, z0), b = this.vertexHeight(x0 + 1, z0), c = this.vertexHeight(x0, z0 + 1), d = this.vertexHeight(x0 + 1, z0 + 1);
        const height = u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
        const dx = u + v <= 1 ? b - a : d - c, dz = u + v <= 1 ? c - a : d - b;
        const wet = validSample(this.base(x, z));
        return { height, slopeDegrees: Math.atan(Math.hypot(dx, dz)) * 180 / Math.PI,
            waterDepth: wet.waterDepth > 0 ? Math.max(0, wet.height + wet.waterDepth - height) : 0 };
    }
    /** 2.5D: selects a support above terrain. Walking beneath bridges is intentionally unsupported. */
    sample = (x, z) => {
        let result = this.terrainAt(x, z);
        for (const s of this.supports.values())
            if (contains(s.bounds, x, z)) {
                const height = surfaceHeight(s, x, z);
                if (height < result.height - 1e-7)
                    continue;
                const length = s.axis === 'x' ? s.bounds.maxX - s.bounds.minX : s.bounds.maxZ - s.bounds.minZ;
                // Support is only dry if it actually rises above the water surface.
                const waterY = result.height + result.waterDepth;
                result = { height, slopeDegrees: Math.atan(Math.abs(s.endY - s.startY) / length) * 180 / Math.PI,
                    waterDepth: result.waterDepth > 0 ? Math.max(0, waterY - height) : 0 };
            }
        return result;
    };
    /** Replace the original ground mesh in edited areas; do not render both layers. */
    terrainMesh(bounds, color) {
        checkedBounds(bounds);
        if (!Object.values(bounds).every(Number.isInteger))
            throw new Error('Mesh bounds must align to integer lattice');
        const nx = bounds.maxX - bounds.minX, nz = bounds.maxZ - bounds.minZ;
        const positions = new Float32Array((nx + 1) * (nz + 1) * 3), indices = new Uint32Array(nx * nz * 6);
        for (let z = 0; z <= nz; z++)
            for (let x = 0; x <= nx; x++)
                positions.set([bounds.minX + x, this.vertexHeight(bounds.minX + x, bounds.minZ + z), bounds.minZ + z], (z * (nx + 1) + x) * 3);
        let n = 0;
        for (let z = 0; z < nz; z++)
            for (let x = 0; x < nx; x++) {
                const a = z * (nx + 1) + x, b = a + 1, c = a + nx + 1, d = c + 1;
                indices.set([a, c, b, b, c, d], n);
                n += 6;
            }
        return { positions, indices, color, walkable: true };
    }
}
/** Closed six-face prism. Its top is exactly surfaceHeight at every point. */
export function surfaceMesh(s) {
    checkedBounds(s.bounds);
    const b = s.bounds, corners = [[b.minX, b.minZ], [b.maxX, b.minZ], [b.minX, b.maxZ], [b.maxX, b.maxZ]];
    const p = [];
    for (const offset of [0, -s.thickness])
        for (const [x, z] of corners)
            p.push(x, surfaceHeight(s, x, z) + offset, z);
    return { positions: new Float32Array(p), indices: new Uint32Array([
            0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6,
            0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7,
            0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5,
        ]), color: s.color, walkable: true };
}
/** Side rails are conservative solid bounds; the deck/ramp itself is a support, not an obstacle. */
export function railColliders(s, railHeight = 1.2, railWidth = .3) {
    const b = s.bounds, minY = Math.min(s.startY, s.endY), maxY = Math.max(s.startY, s.endY) + railHeight;
    return s.axis === 'x' ? [
        { id: `${s.id}:rail:north`, minX: b.minX, maxX: b.maxX, minZ: b.minZ - railWidth, maxZ: b.minZ, minY, maxY },
        { id: `${s.id}:rail:south`, minX: b.minX, maxX: b.maxX, minZ: b.maxZ, maxZ: b.maxZ + railWidth, minY, maxY },
    ] : [
        { id: `${s.id}:rail:west`, minX: b.minX - railWidth, maxX: b.minX, minZ: b.minZ, maxZ: b.maxZ, minY, maxY },
        { id: `${s.id}:rail:east`, minX: b.maxX, maxX: b.maxX + railWidth, minZ: b.minZ, maxZ: b.maxZ, minY, maxY },
    ];
}
export function railMeshes(s, height = 1.2, width = .3) {
    const b = s.bounds;
    const sides = s.axis === 'x' ? [
        { ...b, minZ: b.minZ - width, maxZ: b.minZ }, { ...b, minZ: b.maxZ, maxZ: b.maxZ + width },
    ] : [{ ...b, minX: b.minX - width, maxX: b.minX }, { ...b, minX: b.maxX, maxX: b.maxX + width }];
    return sides.map((bounds, i) => ({ ...surfaceMesh({ ...s, id: `${s.id}:rail:${i}`, bounds, startY: s.startY + height, endY: s.endY + height, thickness: height }), walkable: false }));
}
/** Foundation facing ends below the ground plane, avoiding duplicate coplanar floor faces. */
export function foundationStones(base, pad, color) {
    const b = pad.bounds, blocks = [];
    const add = (x, z, sx, sz) => {
        const bottom = Math.min(base(x, z).height - .25, pad.elevation - .5), top = pad.elevation - .03;
        blocks.push({ id: `${pad.id}:foundation:${blocks.length}`, shape: 'box', position: { x, y: (top + bottom) / 2, z },
            size: { x: sx, y: top - bottom, z: sz }, color, collision: 'none' });
    };
    for (let x = b.minX + 1; x < b.maxX; x += 2) {
        add(x, b.minZ, 1.95, .5);
        add(x, b.maxZ, 1.95, .5);
    }
    for (let z = b.minZ + 1; z < b.maxZ; z += 2) {
        add(b.minX, z, .5, 1.95);
        add(b.maxX, z, .5, 1.95);
    }
    return blocks;
}
export function pointOnSurface(s, t) {
    const b = s.bounds, x = s.axis === 'x' ? mix(b.minX, b.maxX, t) : (b.minX + b.maxX) / 2, z = s.axis === 'z' ? mix(b.minZ, b.maxZ, t) : (b.minZ + b.maxZ) / 2;
    return { x, y: surfaceHeight(s, x, z), z };
}

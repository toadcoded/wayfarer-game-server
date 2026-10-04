export const REFERENCE_GRIDS = {
    ashfen: { tileSize: 32, originX: 0, originZ: 0, columns: 42, rows: 34 },
    wayfarer: { tileSize: 4, originX: -192, originZ: -192, columns: 96, rows: 96 },
    papyrus: { tileSize: 1, originX: 0, originZ: 0, columns: 72, rows: 72 },
};
function validate(f) {
    if (![f.tileSize, f.originX, f.originZ, f.columns, f.rows].every(Number.isFinite) || f.tileSize <= 0 || !Number.isInteger(f.columns) || !Number.isInteger(f.rows) || f.columns < 1 || f.rows < 1)
        throw new Error('Invalid grid frame');
}
export function worldToCell(f, x, z) {
    validate(f);
    if (!Number.isFinite(x) || !Number.isFinite(z))
        return null;
    const column = Math.floor((x - f.originX) / f.tileSize), row = Math.floor((z - f.originZ) / f.tileSize);
    return column < 0 || row < 0 || column >= f.columns || row >= f.rows ? null : { column, row };
}
export function cellCenter(f, column, row) {
    validate(f);
    if (!Number.isInteger(column) || !Number.isInteger(row) || column < 0 || row < 0 || column >= f.columns || row >= f.rows)
        throw new Error('Cell outside grid');
    return { x: f.originX + (column + .5) * f.tileSize, z: f.originZ + (row + .5) * f.tileSize };
}
/** Translate authored points without clamping: placement validation is the caller's job. */
export function rebasePoint(point, source, target) {
    validate(source);
    validate(target);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z))
        throw new Error('Invalid point');
    return { x: target.originX + (point.x - source.originX) / source.tileSize * target.tileSize, z: target.originZ + (point.z - source.originZ) / source.tileSize * target.tileSize };
}

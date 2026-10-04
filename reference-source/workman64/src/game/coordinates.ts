/** Single occupancy API. Tile t owns the half-open interval [left, right). */

export const TILES = 96;
export const TILE_SIZE = 4;
export const HALF = (TILES * TILE_SIZE) / 2;
export const VERT = TILES + 1;

/** World coordinate of a tile center. Inverse of worldToTile at that center. */
export function tileToWorld1d(t: number): number {
  return t * TILE_SIZE - HALF + TILE_SIZE * 0.5;
}

export const tileCenter = tileToWorld1d;

export function tileLeftEdge(t: number): number {
  return t * TILE_SIZE - HALF;
}

export function tileToWorld(tx: number, tz: number) {
  return { x: tileToWorld1d(tx), z: tileToWorld1d(tz) };
}

/** Unclamped half-open occupancy. Exact +edge belongs to the next tile. */
export function worldToTileRaw(x: number, z: number) {
  return {
    tx: Math.floor((x + HALF) / TILE_SIZE),
    tz: Math.floor((z + HALF) / TILE_SIZE),
  };
}

/** Gameplay occupancy, clamped to the 96×96 map. */
export function worldToTile(x: number, z: number) {
  const t = worldToTileRaw(x, z);
  return {
    tx: Math.max(0, Math.min(TILES - 1, t.tx)),
    tz: Math.max(0, Math.min(TILES - 1, t.tz)),
  };
}

export function tileIndex(tx: number, tz: number) {
  return tz * TILES + tx;
}

/** Bilinear heightfield cell. Same floor as occupancy; vertices live on tile corners. */
export function heightCell(x: number, z: number) {
  const fx = (x + HALF) / TILE_SIZE;
  const fz = (z + HALF) / TILE_SIZE;
  const ix = Math.max(0, Math.min(TILES - 1, Math.floor(fx)));
  const iz = Math.max(0, Math.min(TILES - 1, Math.floor(fz)));
  return { ix, iz, tx: fx - ix, tz: fz - iz };
}

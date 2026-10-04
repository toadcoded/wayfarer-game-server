import { COLS, ROWS, TILE } from "./world";

/** Canvas pixels → tile. Inverse of tileToWorld. */
export function worldToTile(px: number, py: number): { tx: number; ty: number } {
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

/** Tile index → world pixel at tile center. */
export function tileToWorld(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE * 0.5, y: ty * TILE + TILE * 0.5 };
}

export function inBounds(tx: number, ty: number): boolean {
  return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS;
}

/** worldToTile(tileToWorld(t)) === t for every cell. */
export function testCoordinateInvariants(): { ok: boolean; failures: number } {
  let failures = 0;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const w = tileToWorld(tx, ty);
      const back = worldToTile(w.x, w.y);
      if (back.tx !== tx || back.ty !== ty) failures++;
    }
  }
  return { ok: failures === 0, failures };
}

/** Dimetric screen from cartesian tile (DarkVigor equalizer — original use). */
export function tileToIso(tx: number, ty: number, scale = 16): { x: number; y: number } {
  return { x: (tx - ty) * scale, y: ((tx + ty) * scale) / 2 };
}

export function isoToTile(ix: number, iy: number, scale = 16): { tx: number; ty: number } {
  const tx = Math.floor((iy / (scale / 2) + ix / scale) / 2);
  const ty = Math.floor((iy / (scale / 2) - ix / scale) / 2);
  return { tx, ty };
}

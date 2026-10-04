import { COLS, ROWS } from "./world.ts";

export const CHUNK = 8;

export function chunkId(tx: number, ty: number): string {
  const cx = Math.floor(tx / CHUNK);
  const cy = Math.floor(ty / CHUNK);
  return `${cx}:${cy}`;
}

export function chunkOrigin(id: string): { x: number; y: number } {
  const [cx, cy] = id.split(":").map(Number);
  return { x: (cx ?? 0) * CHUNK, y: (cy ?? 0) * CHUNK };
}

export function chunkBounds(id: string): { x: number; y: number; w: number; h: number } {
  const o = chunkOrigin(id);
  return {
    x: o.x,
    y: o.y,
    w: Math.min(CHUNK, COLS - o.x),
    h: Math.min(CHUNK, ROWS - o.y),
  };
}

export function allChunks(): string[] {
  const out: string[] = [];
  for (let cy = 0; cy < Math.ceil(ROWS / CHUNK); cy++) {
    for (let cx = 0; cx < Math.ceil(COLS / CHUNK); cx++) out.push(`${cx}:${cy}`);
  }
  return out;
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CollisionFlag, FULL_BLOCK, canTravel, findPath, type Grid } from "./osrs-codec.ts";
import { LANDMARKS, SPAWN_TILE, TILES, getWorld, tileCenter, worldToTile } from "./world.ts";

function grid(w: number, h: number, blockedCells: [number, number][] = []): Grid {
  const flags = new Uint32Array(w * h);
  for (const [x, y] of blockedCells) flags[y * w + x] = FULL_BLOCK;
  return { width: w, height: h, flags };
}

describe("tile conversion", () => {
  it("worldToTile(tileCenter(t)) === t for every tile", () => {
    for (let t = 0; t < TILES; t++) {
      const w = tileCenter(t);
      const { tx, tz } = worldToTile(w, w);
      assert.equal(tx, t, `tx ${tx} !== ${t} at world ${w}`);
      assert.equal(tz, t, `tz ${tz} !== ${t} at world ${w}`);
    }
  });
});

describe("canTravel", () => {
  it("refuses a fully blocked cardinal destination", () => {
    const g = grid(5, 5, [[3, 2]]);
    assert.equal(canTravel(g, 2, 2, 1, 0), false);
    assert.equal(canTravel(g, 2, 2, -1, 0), true);
  });

  it("prevents a diagonal that clips a blocked corner", () => {
    const g = grid(5, 5, [[3, 2]]);
    assert.equal(canTravel(g, 2, 2, 1, 1), false);
    assert.equal(canTravel(g, 1, 1, 1, 1), true);
  });

  it("treats (0,0) as a valid no-op", () => {
    const g = grid(3, 3);
    assert.equal(canTravel(g, 1, 1, 0, 0), true);
  });
});

describe("findPath", () => {
  it("routes around a simple wall", () => {
    const blocked: [number, number][] = [
      [2, 0],
      [2, 1],
      [2, 2],
    ];
    const g = grid(5, 5, blocked);
    const path = findPath(g, { x: 0, y: 1 }, { x: 4, y: 1 });
    assert.ok(path.length > 0);
    assert.equal(path.at(-1)?.x, 4);
    assert.ok(path.every((p) => p.x !== 2 || p.y > 2));
  });

  it("returns a fallback instead of a blocked goal", () => {
    const g = grid(5, 5, [[4, 4]]);
    const path = findPath(g, { x: 0, y: 0 }, { x: 4, y: 4 });
    assert.ok(path.length > 0);
    const end = path.at(-1)!;
    assert.ok(!(end.x === 4 && end.y === 4));
  });
});

describe("world landmarks", () => {
  it("keeps a walkable north-bridge cell", () => {
    const world = getWorld();
    const n = LANDMARKS.find((l) => l.id === "north")!;
    const flags = world.collision.flags[n.tz * TILES + n.tx];
    assert.equal(flags & FULL_BLOCK, 0, "bridge tile must not be fully blocked");
    assert.equal(world.biomes[n.tz * TILES + n.tx] > 0, true);
  });

  it("routes spawn to each landmark", () => {
    const world = getWorld();
    for (const lm of LANDMARKS) {
      const path = findPath(
        world.collision,
        { x: SPAWN_TILE.tx, y: SPAWN_TILE.tz },
        { x: lm.tx, y: lm.tz },
      );
      assert.ok(path.length > 0, `no path toward ${lm.name}`);
      const end = path.at(-1)!;
      const d = Math.abs(end.x - lm.tx) + Math.abs(end.y - lm.tz);
      assert.ok(d <= 2, `${lm.name} fallback too far (${end.x},${end.y})`);
    }
  });
});

void CollisionFlag;

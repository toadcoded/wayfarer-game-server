import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BinaryMinHeap,
  CollisionFlag,
  FULL_BLOCK,
  canTravel,
  findPath,
  findPathLinear,
  heapLess,
  pathCost,
  pathValid,
  type Grid,
  type OpenNode,
} from "./osrs-codec.ts";
import { CROSSROADS, LANDMARKS, SPAWN_TILE, TILES, getWorld, sampleGround, sampleWalk, worldToTile } from "./world.ts";
import { tileCenter } from "./coordinates.ts";

function grid(w: number, h: number, blockedCells: [number, number][] = []): Grid {
  const flags = new Uint32Array(w * h);
  for (const [x, y] of blockedCells) flags[y * w + x] = FULL_BLOCK;
  return { width: w, height: h, flags };
}

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

describe("binary min-heap", () => {
  it("pops by f, then h, then insertion seq", () => {
    const h = new BinaryMinHeap<OpenNode>(heapLess);
    h.push({ x: 0, y: 0, g: 10, h: 5, f: 15, i: 0, seq: 2 });
    h.push({ x: 1, y: 0, g: 8, h: 7, f: 15, i: 1, seq: 1 });
    h.push({ x: 2, y: 0, g: 4, h: 4, f: 8, i: 2, seq: 0 });
    h.push({ x: 3, y: 0, g: 10, h: 5, f: 15, i: 3, seq: 3 });
    assert.equal(h.pop()!.i, 2);
    assert.equal(h.pop()!.i, 0);
    assert.equal(h.pop()!.i, 3);
    assert.equal(h.pop()!.i, 1);
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
    assert.equal(pathValid(g, path, { x: 0, y: 1 }), true);
  });

  it("returns a fallback instead of a blocked goal", () => {
    const g = grid(5, 5, [[4, 4]]);
    const path = findPath(g, { x: 0, y: 0 }, { x: 4, y: 4 });
    assert.ok(path.length > 0);
    const end = path.at(-1)!;
    assert.ok(!(end.x === 4 && end.y === 4));
  });

  it("is deterministic across repeated calls", () => {
    const world = getWorld();
    const a = findPath(world.collision, { x: 10, y: 10 }, { x: 80, y: 70 });
    const b = findPath(world.collision, { x: 10, y: 10 }, { x: 80, y: 70 });
    assert.deepEqual(a, b);
  });
});

describe("heap vs linear equivalence", () => {
  function cases(): { name: string; g: Grid; start: { x: number; y: number }; goal: { x: number; y: number } }[] {
    const empty = grid(12, 12);
    const wall: [number, number][] = [];
    for (let y = 0; y < 10; y++) wall.push([6, y]);
    const maze: [number, number][] = [];
    for (let y = 0; y < 11; y++) if (y !== 3) maze.push([4, y]);
    for (let x = 0; x < 11; x++) if (x !== 8) maze.push([x, 7]);
    const world = getWorld();
    const north = LANDMARKS.find((l) => l.id === "north")!;
    return [
      { name: "empty", g: empty, start: { x: 1, y: 1 }, goal: { x: 10, y: 10 } },
      { name: "wall", g: grid(12, 12, wall), start: { x: 1, y: 5 }, goal: { x: 10, y: 5 } },
      { name: "maze", g: grid(12, 12, maze), start: { x: 0, y: 0 }, goal: { x: 11, y: 11 } },
      { name: "start=goal", g: empty, start: { x: 3, y: 3 }, goal: { x: 3, y: 3 } },
      { name: "north bridge", g: world.collision, start: { x: SPAWN_TILE.tx, y: SPAWN_TILE.tz }, goal: { x: north.tx, y: north.tz } },
      { name: "blocked dest", g: grid(8, 8, [[7, 7]]), start: { x: 0, y: 0 }, goal: { x: 7, y: 7 } },
    ];
  }

  for (const c of cases()) {
    it(`matches linear cost on ${c.name}`, () => {
      const heap = findPath(c.g, c.start, c.goal);
      const linear = findPathLinear(c.g, c.start, c.goal);
      assert.equal(pathValid(c.g, heap, c.start), true, `${c.name} heap invalid`);
      assert.equal(pathValid(c.g, linear, c.start), true, `${c.name} linear invalid`);
      assert.equal(pathCost(heap, c.start), pathCost(linear, c.start), `${c.name} cost mismatch`);
    });
  }
});

describe("world landmarks", () => {
  it("keeps a walkable north-bridge cell", () => {
    const world = getWorld();
    const n = LANDMARKS.find((l) => l.id === "north")!;
    const flags = world.collision.flags[n.tz * TILES + n.tx];
    assert.equal(flags & FULL_BLOCK, 0, "bridge tile must not be fully blocked");
    assert.equal(world.biomes[n.tz * TILES + n.tx] > 0, true);
  });

  it("keeps spawn and the fork walkable", () => {
    const world = getWorld();
    for (const t of [SPAWN_TILE, CROSSROADS]) {
      const flags = world.collision.flags[t.tz * TILES + t.tx];
      assert.equal(flags & FULL_BLOCK, 0, `${t.tx},${t.tz} blocked`);
    }
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

  it("places gather nodes on walkable tiles reachable from spawn", () => {
    const world = getWorld();
    assert.ok(world.nodes.length >= 8, `only ${world.nodes.length} nodes`);
    for (const n of world.nodes) {
      const flags = world.collision.flags[n.tz * TILES + n.tx];
      assert.equal(flags & FULL_BLOCK, 0, `${n.id} blocked`);
      const path = findPath(
        world.collision,
        { x: SPAWN_TILE.tx, y: SPAWN_TILE.tz },
        { x: n.tx, y: n.tz },
      );
      assert.ok(path.length > 0, `no path to ${n.id}`);
    }
  });

  it("agrees worldToTile(tileCenter) at spawn", () => {
    const { tx, tz } = worldToTile(tileCenter(SPAWN_TILE.tx), tileCenter(SPAWN_TILE.tz));
    assert.deepEqual({ tx, tz }, SPAWN_TILE);
  });

  it("plants spawn feet on the mesh", () => {
    const world = getWorld();
    const x = tileCenter(SPAWN_TILE.tx);
    const z = tileCenter(SPAWN_TILE.tz);
    const g = sampleGround(world, x, z);
    const w = sampleWalk(world, x, z);
    assert.ok(Math.abs(g - w) < 0.4, `ground ${g} vs walk ${w}`);
    assert.ok(g > 0.4, `spawn buried at ${g}`);
  });
});

void CollisionFlag;

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  HALF,
  TILE_SIZE,
  TILES,
  tileCenter,
  tileLeftEdge,
  tileToWorld,
  tileToWorld1d,
  worldToTile,
  worldToTileRaw,
} from "./coordinates.ts";
import { CollisionFlag, FULL_BLOCK, findPath } from "./osrs-codec.ts";
import {
  BIOME_NAME,
  BRIDGE,
  BRIDGE_DECK,
  LANDMARKS,
  SPAWN_TILE,
  WATER_LEVEL,
  bridgeWorldBounds,
  getWorld,
  isBridgeTile,
} from "./world.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("world/tile coordinate invariants", () => {
  it("round-trips every tile center (the release-blocking contract)", () => {
    for (let t = 0; t < TILES; t++) {
      const w = tileToWorld1d(t);
      assert.equal(worldToTile(w, w).tx, t);
      assert.equal(worldToTile(w, w).tz, t);
      assert.equal(tileCenter(t), w);
    }
  });

  it("round-trips every 96×96 tile center pair", () => {
    for (let tz = 0; tz < TILES; tz++) {
      for (let tx = 0; tx < TILES; tx++) {
        const { x, z } = tileToWorld(tx, tz);
        assert.deepEqual(worldToTile(x, z), { tx, tz });
      }
    }
  });

  it("keeps every interior point in its owning tile", () => {
    const eps = 1e-7;
    for (let t = 0; t < TILES; t++) {
      const center = tileToWorld1d(t);
      assert.equal(worldToTileRaw(center - TILE_SIZE / 2 + eps, 0).tx, t);
      assert.equal(worldToTileRaw(center, 0).tx, t);
      assert.equal(worldToTileRaw(center + TILE_SIZE / 2 - eps, 0).tx, t);
    }
  });

  it("assigns an exact positive tile edge to the next tile", () => {
    const t = 20;
    const rightEdge = tileToWorld1d(t) + TILE_SIZE / 2;
    assert.equal(worldToTileRaw(rightEdge, 0).tx, t + 1);
    assert.equal(rightEdge, tileLeftEdge(t + 1));
  });

  it("uses HALF = 192 and TILE_SIZE = 4", () => {
    assert.equal(TILE_SIZE, 4);
    assert.equal(HALF, 192);
  });
});

describe("source-level occupancy API", () => {
  it("does not reimplement occupancy conversion outside coordinates.ts", () => {
    const files = ["Player.tsx", "Hud.tsx", "store.ts", "Environment.tsx", "world.ts", "Wayfarer.tsx"];
    const banned = /Math\.(round|floor)\s*\(\s*\([^)]*\+\s*HALF\)\s*\/\s*TILE_SIZE/;
    for (const f of files) {
      const src = readFileSync(join(here, f), "utf8");
      assert.equal(banned.test(src), false, `${f} reimplements occupancy conversion`);
    }
  });
});

describe("prop-collision spatial invariant", () => {
  it("places every tree and rock on an OBJECT tile matching worldToTile", () => {
    const world = getWorld();
    const occupied = new Set<number>();
    for (const prop of [...world.trees, ...world.rocks]) {
      const { tx, tz } = worldToTile(prop.x, prop.z);
      const flags = world.collision.flags[tz * TILES + tx];
      assert.notEqual(flags & CollisionFlag.OBJECT, 0, `prop at ${prop.x},${prop.z} tile ${tx},${tz} missing OBJECT`);
      occupied.add(tz * TILES + tx);
    }
    for (let i = 0; i < world.collision.flags.length; i++) {
      const objectOnly = (world.collision.flags[i] & CollisionFlag.OBJECT) !== 0;
      const floor = (world.collision.flags[i] & CollisionFlag.FLOOR) !== 0;
      if (objectOnly && !floor) {
        assert.equal(occupied.has(i), true, `OBJECT at index ${i} has no prop`);
      }
    }
    assert.ok(world.trees.length > 200, `sparse forest (${world.trees.length})`);
  });
});

describe("north bridge first-class surface", () => {
  it("marks the 3×5 deck as walkable bridge biome above water", () => {
    const world = getWorld();
    let n = 0;
    for (let tz = BRIDGE.tz0; tz <= BRIDGE.tz1; tz++) {
      for (let tx = BRIDGE.tx0; tx <= BRIDGE.tx1; tx++) {
        assert.equal(isBridgeTile(tx, tz), true);
        const i = tz * TILES + tx;
        assert.equal(world.collision.flags[i] & FULL_BLOCK, 0, `bridge ${tx},${tz} blocked`);
        assert.equal(BIOME_NAME[world.biomes[i]], "bridge");
        assert.ok(world.walkHeight[i] > WATER_LEVEL, "deck below water");
        assert.ok(Math.abs(world.walkHeight[i] - BRIDGE_DECK) < 1e-5);
        n++;
      }
    }
    assert.equal(n, 15);
  });

  it("routes spawn across the rendered deck, not a cleared water rectangle", () => {
    const world = getWorld();
    const north = LANDMARKS.find((l) => l.id === "north")!;
    const start = { x: SPAWN_TILE.tx, y: SPAWN_TILE.tz };
    const path = findPath(world.collision, start, { x: north.tx, y: north.tz });
    assert.ok(path.length > 0, "no path to north bridge");
    const cells = [start, ...path];
    const onDeck = cells.filter((p) => isBridgeTile(p.x, p.y));
    assert.ok(onDeck.length > 0, "path never steps on the deck");
    const bounds = bridgeWorldBounds();
    for (const p of onDeck) {
      const wx = tileCenter(p.x);
      const wz = tileCenter(p.y);
      assert.ok(wx >= bounds.x0 && wx <= bounds.x1, `deck x ${wx} outside rendered AABB`);
      assert.ok(wz >= bounds.z0 && wz <= bounds.z1, `deck z ${wz} outside rendered AABB`);
      assert.equal(BIOME_NAME[world.biomes[p.y * TILES + p.x]], "bridge");
    }
    for (const p of cells) {
      const biome = BIOME_NAME[world.biomes[p.y * TILES + p.x]];
      assert.notEqual(biome, "water", `path walked water at ${p.x},${p.y}`);
    }
  });
});

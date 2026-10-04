import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTiles, COLS, ROWS, SPAWN, walkable } from "./world.ts";
import { astar } from "./path.ts";
import { route } from "./jps.ts";
import { testCoordinateInvariants, worldToTile, tileToWorld } from "./coords.ts";
import { LocalRealm } from "./realm.ts";
import { canGather } from "./skills.ts";
import { allChunks, CHUNK, chunkId } from "./chunk.ts";
import { mulberry32 } from "./rng.ts";

test("coordinate invariants: worldToTile(tileToWorld(t)) === t", () => {
  const r = testCoordinateInvariants();
  assert.equal(r.ok, true, `failures=${r.failures}`);
  const w = tileToWorld(18, 18);
  const back = worldToTile(w.x, w.y);
  assert.deepEqual(back, { tx: 18, ty: 18 });
});

test("JPS route reaches spawn-adjacent walkable tiles and expands", () => {
  const tiles = buildTiles();
  const path = route(tiles, SPAWN.x, SPAWN.y, SPAWN.x + 3, SPAWN.y);
  assert.ok(path.length >= 3);
  for (const p of path) assert.equal(walkable(tiles, p.x, p.y), true);
  const last = path[path.length - 1]!;
  assert.equal(last.x, SPAWN.x + 3);
  assert.equal(last.y, SPAWN.y);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    assert.equal(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 1);
  }
  const a = astar(tiles, SPAWN.x, SPAWN.y, 5, 24);
  const j = route(tiles, SPAWN.x, SPAWN.y, 5, 24);
  assert.ok(a.length > 0 && j.length > 0);
  assert.deepEqual(j[j.length - 1], a[a.length - 1]);
});

test("seeded RNG is deterministic", () => {
  const a = mulberry32(2730);
  const b = mulberry32(2730);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test("LocalRealm ticks intents at 600ms cadence metadata", async () => {
  const realm = new LocalRealm();
  realm.enqueue({ kind: "move", x: 19, y: 18 });
  const ev = realm.step();
  assert.equal(realm.tick, 1);
  assert.equal(ev.length, 1);
  assert.equal(ev[0]!.type, "move");
  realm.enqueue({ kind: "interact", targetId: "t1", action: "gather" });
  realm.step();
  assert.equal(realm.journal.length, 2);
});

test("skill tables gate Reedcut/Delve/Angle", () => {
  const ok = canGather("tree", 1, []);
  assert.equal(ok.ok, true);
  assert.equal(ok.script?.yieldItemId, "reedwood");
  const blocked = canGather("tree", 0, []);
  assert.equal(blocked.ok, false);
});

test("chunks cover the expanded Ashfen map", () => {
  const ids = allChunks();
  assert.ok(ids.includes(chunkId(0, 0)));
  assert.ok(ids.includes(chunkId(COLS - 1, ROWS - 1)));
  assert.equal(CHUNK, 8);
  assert.ok(ids.length >= 20);
});

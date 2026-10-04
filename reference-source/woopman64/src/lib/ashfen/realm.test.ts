import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTiles, SPAWN, walkable } from "./world.ts";
import { astar } from "./path.ts";
import { route } from "./jps.ts";
import { testCoordinateInvariants, worldToTile, tileToWorld } from "./coords.ts";
import { LocalRealm } from "./realm.ts";
import { canGather } from "./skills.ts";
import { allChunks, CHUNK, chunkId } from "./chunk.ts";
import { mulberry32 } from "./rng.ts";
import { camRig, stepGaitWeight, stepYaw, walkJoints, yawFromDir, yawFromVel } from "./pose.ts";
import {
  approachAngle,
  clampZoom,
  expSmooth,
  followPath,
  integrateBody,
  stepLocomotion,
  ZOOM_CLOSE,
  ZOOM_MAX,
  ZOOM_REALM,
} from "./physics.ts";

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

test("chunks cover the 42x34 map", () => {
  const ids = allChunks();
  assert.ok(ids.includes(chunkId(0, 0)));
  assert.ok(ids.includes(chunkId(41, 33)));
  assert.equal(CHUNK, 8);
  assert.ok(ids.length >= 20);
});

test("3D yaw: A-left decreases x; W faces north (-Z)", () => {
  assert.equal(yawFromDir("down"), 0);
  assert.ok(Math.abs(yawFromDir("up") - Math.PI) < 1e-6);
  const y = yawFromVel(-1, 0, 0);
  assert.ok(y < -0.5, `left yaw ${y}`);
  const north = yawFromVel(0, -1, 0);
  assert.ok(Math.abs(north) > 2.5);
  const tiles = buildTiles();
  const body = integrateBody({ x: SPAWN.x + 0.5, y: SPAWN.y + 0.5, vx: 0, vy: 0 }, -1, 0, 0.1, tiles, 5);
  assert.ok(body.x < SPAWN.x + 0.5, "A / -ax must decrease x");
});

test("walk joints oppose limbs and camera zoom is inward/outward", () => {
  const walk = walkJoints(Math.PI / 2, true, 0);
  const other = walkJoints(Math.PI / 2 + Math.PI, true, 0);
  assert.ok(walk.leftThigh * other.leftThigh < 0 || Math.abs(walk.leftThigh - other.leftThigh) > 0.2);
  assert.ok(walk.leftThigh * walk.rightThigh <= 0.05);
  const idle = walkJoints(0, false, 0);
  assert.ok(Math.abs(idle.bob) < 0.08);
  const far = camRig(ZOOM_REALM);
  const close = camRig(ZOOM_CLOSE);
  assert.ok(far.height > close.height, "realm view is higher");
  assert.ok(far.dist > close.dist, "realm view is farther");
  assert.equal(clampZoom(99), ZOOM_MAX);
});

test("smooth locomotion: A still decreases x; path arrives without teleport", () => {
  const tiles = buildTiles();
  const start = { x: SPAWN.x + 0.5, y: SPAWN.y + 0.5, vx: 0, vy: 0 };
  const a = stepLocomotion(start, -1, 0, [], 0.1, tiles, 5);
  assert.ok(a.body.x < start.x, "A / -ax must decrease x");
  assert.equal(a.path.length, 0);

  const path = [
    { x: SPAWN.x + 1, y: SPAWN.y },
    { x: SPAWN.x + 2, y: SPAWN.y },
  ];
  let body = { ...start };
  let remaining = path;
  for (let i = 0; i < 180; i++) {
    const step = followPath(body, remaining, 1 / 60, tiles, 4.8);
    body = step.body;
    remaining = step.path;
    if (!remaining.length && Math.hypot(body.vx, body.vy) < 0.05) break;
  }
  assert.equal(remaining.length, 0);
  assert.ok(Math.abs(body.x - (SPAWN.x + 2.5)) < 0.2, `arrived x=${body.x}`);
  assert.ok(Math.abs(body.y - (SPAWN.y + 0.5)) < 0.2);

  const yaw = stepYaw(0, -1, 0, 0.2);
  assert.ok(yaw < 0, "turning toward -X (A) decreases yaw");
  const sm = expSmooth(0, 10, 8, 1 / 60);
  assert.ok(sm > 0 && sm < 10);
  const ang = approachAngle(0, Math.PI, 4, 0.1);
  assert.ok(ang > 0 && ang < Math.PI);
  const w = stepGaitWeight(0, 4.8, 0.2);
  assert.ok(w > 0.15 && w <= 1);
});


import assert from "node:assert/strict";
import test from "node:test";
import { buildTiles, T } from "./world.ts";
import { GROUND_BRAKE, integrateBody, speedCap, tickRun, WALK_SPEED } from "./physics.ts";

test("grounded integration normalizes diagonals and respects speed cap", () => {
  const tiles = buildTiles();
  let body = { x: 18.5, y: 18.5, vx: 0, vy: 0 };
  for (let i = 0; i < 60; i++) body = integrateBody(body, 1, 1, 1 / 60, tiles, WALK_SPEED);
  assert.ok(Math.hypot(body.vx, body.vy) <= WALK_SPEED + 0.001);
  assert.ok(Math.abs(Math.abs(body.vx) - Math.abs(body.vy)) < 0.08);
});

test("grounded braking settles faster than the old glide budget", () => {
  const tiles = buildTiles();
  let body = { x: 18.5, y: 18.5, vx: WALK_SPEED, vy: 0 };
  for (let i = 0; i < 20; i++) body = integrateBody(body, 0, 0, 1 / 60, tiles, WALK_SPEED);
  assert.ok(Math.hypot(body.vx, body.vy) <= GROUND_BRAKE / 60);
});

test("run drains only while moving and walking regenerates slowly", () => {
  assert.equal(tickRun(50, true, true, 1), 42);
  assert.equal(tickRun(50, true, false, 1), 54);
  assert.equal(tickRun(50, false, false, 1), 64);
  assert.equal(speedCap(1, 100, false, false), WALK_SPEED);
});

test("blocked tiles remain impassable", () => {
  const tiles = buildTiles();
  assert.equal(tiles[0], T.wall);
  const body = integrateBody({ x: 0.5, y: 1.5, vx: -3, vy: 0 }, -1, 0, 1 / 60, tiles, WALK_SPEED);
  assert.ok(body.x >= 0.5 - 0.001);
});

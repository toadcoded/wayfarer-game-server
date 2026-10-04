import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BODY_R,
  HOP_PEAK,
  WALK_SPEED,
  ZOOM_CLOSE,
  ZOOM_DEFAULT,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_REALM,
  blockedAt,
  clampZoom,
  hopHeight,
  integrateBody,
  rigForZoom,
  separateFrom,
  speedCap,
  tickRun,
} from "./papyrus-physics.ts";

function openWalk(tiles = 64): Uint8Array {
  return new Uint8Array(tiles * tiles).fill(1);
}

describe("papyrus physics", () => {
  it("clamps zoom and realm rig is overhead while close is inward", () => {
    assert.equal(clampZoom(0), ZOOM_MIN);
    assert.equal(clampZoom(9), ZOOM_MAX);
    assert.equal(clampZoom(Number.NaN), ZOOM_DEFAULT);
    const realm = rigForZoom(ZOOM_REALM);
    const street = rigForZoom(ZOOM_DEFAULT);
    const close = rigForZoom(ZOOM_CLOSE);
    assert.ok(realm.height > street.height * 2, "realm view should look down from high");
    assert.ok(close.dist < street.dist, "close view should pull camera inward");
    assert.ok(close.height < street.height, "close view should drop to street height");
  });

  it("accelerates toward walk cap then brakes to rest", () => {
    const walk = openWalk();
    let b = { x: 32.5, z: 40.5, vx: 0, vz: 0 };
    for (let i = 0; i < 90; i++) {
      b = integrateBody(b, 0, -1, 1 / 60, walk, 64, WALK_SPEED);
    }
    const sp = Math.hypot(b.vx, b.vz);
    assert.ok(sp > WALK_SPEED * 0.9 && sp <= WALK_SPEED + 0.02, `speed ${sp}`);
    assert.ok(b.z < 40.5, "forward along -Z");
    for (let i = 0; i < 40; i++) {
      b = integrateBody(b, 0, 0, 1 / 60, walk, 64, WALK_SPEED);
    }
    assert.ok(Math.hypot(b.vx, b.vz) < 0.05, "brake should stop the body");
  });

  it("four-corner collision does not walk into a wall", () => {
    const walk = openWalk();
    for (let x = 0; x < 64; x++) walk[30 * 64 + x] = 0;
    let b = { x: 32.5, z: 32.5, vx: 0, vz: 0 };
    for (let i = 0; i < 180; i++) {
      b = integrateBody(b, 0, -1, 1 / 60, walk, 64, WALK_SPEED);
    }
    assert.ok(b.z > 30 + BODY_R - 0.08, `should rest south of wall, z=${b.z}`);
    assert.equal(blockedAt(walk, 64, 32.5, 30.1), true);
    assert.equal(blockedAt(walk, 64, 32.5, 32.5), false);
  });

  it("hop is a parabola under the peak", () => {
    assert.equal(hopHeight(0), 0);
    assert.equal(hopHeight(1), 0);
    assert.equal(hopHeight(0.5, true), 0);
    const mid = hopHeight(0.5);
    assert.ok(mid > hopHeight(0.2));
    assert.ok(mid <= HOP_PEAK + 1e-9);
  });

  it("run energy drains while sprinting and regenerates at rest", () => {
    let energy = 1;
    energy = tickRun(energy, true, true, 1);
    assert.ok(energy < 0.9);
    energy = tickRun(0.2, false, false, 1);
    assert.ok(energy > 0.4);
    assert.ok(speedCap(1, true) > speedCap(1, false));
    assert.ok(speedCap(0.05, true) < speedCap(1, true));
  });

  it("soft-separates overlapping bodies", () => {
    const out = separateFrom(32, 40, 32.1, 40, 0.56);
    assert.ok(Math.hypot(out.x - 32.1, out.z - 40) >= 0.55);
  });
});

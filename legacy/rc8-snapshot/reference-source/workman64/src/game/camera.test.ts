import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ISO_FWD, ISO_RIGHT, ISO_YAW } from "./iso.ts";
import { applyZoom, CAM_DIST_MIN, camAxes, camOffset, clampCam, defaultCam, liveCam } from "./camera.ts";

describe("third-person camera rig", () => {
  it("sits on a yaw ring behind the player", () => {
    const c = defaultCam();
    const o = camOffset(c);
    assert.ok(o.y > 0);
    assert.ok(Math.abs(Math.hypot(o.x, o.z) - c.dist * Math.cos(c.pitch)) < 1e-9);
  });

  it("matches locked isometric axes at 45° yaw", () => {
    const a = camAxes(ISO_YAW);
    assert.ok(Math.abs(a.fwd.x - ISO_FWD.x) < 1e-12);
    assert.ok(Math.abs(a.fwd.z - ISO_FWD.z) < 1e-12);
    assert.ok(Math.abs(a.right.x - ISO_RIGHT.x) < 1e-12);
    assert.ok(Math.abs(a.right.z - ISO_RIGHT.z) < 1e-12);
  });

  it("clamps zoom", () => {
    const z = clampCam({ ...defaultCam(), dist: 1, pitch: 3 });
    assert.ok(z.dist >= CAM_DIST_MIN);
    assert.ok(z.pitch <= 0.86);
    const before = liveCam.dist;
    applyZoom(-400);
    assert.ok(liveCam.dist <= before);
    applyZoom(400);
  });
});

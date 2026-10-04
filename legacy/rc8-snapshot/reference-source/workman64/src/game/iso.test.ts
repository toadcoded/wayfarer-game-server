import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ISO_PITCH, ISO_YAW, fromIso, isoOffset, toIso } from "./iso.ts";

describe("isometric camera", () => {
  it("locks pitch to arctan(1/√2) and yaw to 45°", () => {
    assert.ok(Math.abs(ISO_PITCH - Math.atan(1 / Math.SQRT2)) < 1e-12);
    assert.ok(Math.abs(ISO_YAW - Math.PI / 4) < 1e-12);
  });

  it("round-trips the equatorial equalizer", () => {
    for (const [tx, tz] of [
      [0, 0],
      [48, 14],
      [80, 44],
      [16, 50],
    ]) {
      const iso = toIso(tx, tz);
      const back = fromIso(iso.isoX, iso.isoY);
      assert.ok(Math.abs(back.tx - tx) < 1e-9);
      assert.ok(Math.abs(back.tz - tz) < 1e-9);
    }
  });

  it("places the camera along (1,1,1) for a 2:1 isometric step", () => {
    const o = isoOffset(1);
    assert.ok(Math.abs(o.x - o.z) < 1e-9);
    assert.ok(Math.abs(o.x - o.y) < 1e-9);
  });
});

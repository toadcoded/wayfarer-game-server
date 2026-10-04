import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TILE_SIZE, tileToWorld1d, worldToTile } from "./coordinates.ts";
import { parseSave } from "./save.ts";
import { SPAWN_TILE, tileCenter } from "./world.ts";

describe("save / Drive Atlas coordinate versioning", () => {
  it("accepts v2/v3 world coordinates at a tile center", () => {
    const x = tileCenter(SPAWN_TILE.tx);
    const z = tileCenter(SPAWN_TILE.tz);
    const s = parseSave({ version: 3, x, z });
    assert.ok(s);
    assert.equal(s!.x, x);
    assert.deepEqual(worldToTile(s!.x, s!.z), SPAWN_TILE);
  });

  it("accepts arbitrary interior world coordinates without snapping", () => {
    const center = tileToWorld1d(40);
    const x = center + 0.37;
    const z = center - 0.91;
    const s = parseSave(JSON.stringify({ version: 2, x, z }));
    assert.ok(s);
    assert.equal(s!.x, x);
    assert.equal(s!.z, z);
    assert.equal(worldToTile(s!.x, s!.z).tx, 40);
  });

  it("keeps a coordinate just inside the positive edge on the owning tile", () => {
    const t = 33;
    const almostEdge = tileToWorld1d(t) + TILE_SIZE / 2 - 1e-6;
    const s = parseSave({ version: 3, x: almostEdge, z: tileToWorld1d(10) });
    assert.ok(s);
    assert.equal(worldToTile(s!.x, s!.z).tx, t);
  });

  it("refuses v1 rounded tile IDs so they are not floor-remapped", () => {
    assert.equal(parseSave({ version: 1, tx: 48, tz: 51 }), null);
    assert.equal(parseSave({ version: 3, tx: 48, tz: 51 }), null);
    assert.equal(parseSave("{not json"), null);
  });
});

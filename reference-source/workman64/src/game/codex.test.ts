import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CODEX_PAGES, codexComplete, openedPages } from "./codex.ts";
import { LANDMARKS, gatherLine } from "./world.ts";

describe("Highland Codex", () => {
  it("has one folio per landmark, in trail order", () => {
    assert.equal(CODEX_PAGES.length, LANDMARKS.length);
    assert.deepEqual(
      CODEX_PAGES.map((p) => p.id),
      LANDMARKS.map((l) => l.id),
    );
  });

  it("stays sealed until a trail is walked", () => {
    assert.equal(openedPages({}).length, 0);
    assert.equal(codexComplete({}), false);
    assert.equal(openedPages({ west: true }).length, 1);
    assert.equal(
      codexComplete({ west: true, east: true, south: true, north: true }),
      true,
    );
  });
});

describe("gather lines", () => {
  it("matches the original realm log phrasing", () => {
    assert.equal(gatherLine("forage", "trail bloom"), "You take a trail bloom.");
    assert.equal(gatherLine("wood", "driftwood"), "You take driftwood.");
  });
});

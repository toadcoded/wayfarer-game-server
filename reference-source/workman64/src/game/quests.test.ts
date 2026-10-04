import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  freshQuietTithe,
  recordOffering,
  reduceTithe,
  TITHE_OFFERINGS,
} from "./quests.ts";

describe("Quiet Tithe reducer", () => {
  it("walks Halden → Wren → four offerings → Toller → lantern → Halden once", () => {
    let s = freshQuietTithe();
    s = reduceTithe(s, { type: "talk", npc: "halden" }).state;
    assert.equal(s.phase, "recipe");
    s = reduceTithe(s, { type: "talk", npc: "wren" }).state;
    assert.equal(s.phase, "gather");
    for (const item of TITHE_OFFERINGS) {
      s = recordOffering(s, item);
    }
    assert.equal(s.phase, "bind");
    assert.equal(s.offerings.length, 4);
    s = reduceTithe(s, { type: "talk", npc: "toller" }).state;
    assert.equal(s.phase, "light");
    s = reduceTithe(s, { type: "light" }).state;
    assert.equal(s.phase, "report");
    assert.equal(s.lantern, true);
    const done = reduceTithe(s, { type: "talk", npc: "halden" });
    assert.equal(done.state.phase, "complete");
    assert.equal(done.state.rewarded, true);
    const again = reduceTithe(done.state, { type: "talk", npc: "halden" });
    assert.equal(again.state.rewarded, true);
    assert.equal(again.state.phase, "complete");
  });

  it("rejects duplicate offerings and out-of-order light", () => {
    let s = freshQuietTithe();
    s = reduceTithe(s, { type: "talk", npc: "wren" }).state;
    s = recordOffering(s, "reedwood");
    const dup = recordOffering(s, "reedwood");
    assert.equal(dup.offerings.length, 1);
    const lit = reduceTithe(s, { type: "light" });
    assert.equal(lit.state.lantern, false);
    assert.equal(s.phase, "gather");
  });
});

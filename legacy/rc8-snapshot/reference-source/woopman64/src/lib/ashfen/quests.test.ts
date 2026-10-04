import assert from "node:assert/strict";
import test from "node:test";
import {
  allOfferings,
  freshQuietTithe,
  nextTithePhase,
  objectiveFor,
  recordOffering,
  reduceQuietTithe,
} from "./quests.ts";

test("Quiet Tithe advances through its authored phases", () => {
  let tithe = freshQuietTithe();
  tithe = nextTithePhase(tithe, "halden");
  assert.equal(tithe.phase, "seekWren");
  tithe = nextTithePhase(tithe, "wren");
  assert.equal(tithe.phase, "collect");
  for (const item of ["reedwood", "ash-ore", "perch", "mire-fibre"]) tithe = recordOffering(tithe, item);
  assert.equal(allOfferings(tithe.offerings), true);
  assert.match(objectiveFor(tithe), /Toller/);
  tithe = nextTithePhase(tithe, "bind");
  assert.equal(tithe.phase, "light");
  assert.equal(tithe.bundle, true);
  tithe = nextTithePhase(tithe, "light");
  assert.equal(tithe.phase, "report");
  tithe = nextTithePhase(tithe, "report");
  assert.equal(tithe.phase, "complete");
});

test("Quiet Tithe ignores duplicate and out-of-order offerings", () => {
  let tithe = freshQuietTithe();
  tithe = recordOffering(tithe, "reedwood");
  assert.equal(tithe.offerings.reedwood, false);
  tithe = nextTithePhase(nextTithePhase(tithe, "halden"), "wren");
  tithe = recordOffering(tithe, "reedwood");
  tithe = recordOffering(tithe, "reedwood");
  assert.equal(Object.values(tithe.offerings).filter(Boolean).length, 1);
  tithe = reduceQuietTithe(tithe, { kind: "offering", itemId: "reedwood" });
  assert.equal(tithe.offerings.reedwood, true);
});

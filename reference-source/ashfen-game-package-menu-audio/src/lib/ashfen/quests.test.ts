import assert from "node:assert/strict";
import test from "node:test";
import { allOfferings, freshQuietTithe, nextTithePhase, recordOffering } from "./quests.ts";

test("Quiet Tithe advances through its authored phases", () => {
  let tithe = freshQuietTithe();
  tithe = nextTithePhase(tithe, "halden");
  tithe = nextTithePhase(tithe, "wren");
  for (const item of ["reedwood", "ash-ore", "perch", "mire-fibre"]) tithe = recordOffering(tithe, item);
  assert.equal(allOfferings(tithe.offerings), true);
  tithe = nextTithePhase(tithe, "bind");
  tithe = nextTithePhase(tithe, "light");
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
});

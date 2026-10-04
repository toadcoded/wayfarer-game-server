import assert from "node:assert/strict";
import test from "node:test";
import { actionProgress, advanceAction, beginAction, gatherDurationMs, phaseAt } from "./actions.ts";

test("woodcut, mining, and fishing have distinct authored beats", () => {
  const wood = beginAction("woodcut", 10, 1, "t1");
  const fish = beginAction("fish", 10, 2, "f1");
  assert.equal(wood.impactTick, 11);
  assert.equal(fish.impactTick, 12);
  assert.equal(phaseAt(wood, 10), "windup");
  assert.equal(phaseAt(wood, 11), "active");
  assert.equal(phaseAt(wood, 12), "recover");
  assert.ok(gatherDurationMs("fish") > gatherDurationMs("tree"));
});

test("action progression is deterministic and expires cleanly", () => {
  const action = beginAction("deflect", 20, 7);
  assert.equal(advanceAction(action, 20)?.phase, "windup");
  assert.equal(advanceAction(action, 21)?.phase, "active");
  assert.equal(actionProgress(action, 22), 0.5);
  assert.equal(advanceAction(action, action.endsTick), null);
});

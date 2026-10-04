import assert from "node:assert/strict";
import test from "node:test";
import { emptyCtx, foldCtx, reduceCommand, type ReduceCtx } from "./commands.ts";
import { allOfferings } from "./quests.ts";
import { mintIntentId, type Intent, type InteractIntent, type TalkIntent, type UseIntent } from "./protocol.ts";

type Draft =
  | Omit<InteractIntent, "v" | "id">
  | Omit<TalkIntent, "v" | "id">
  | Omit<UseIntent, "v" | "id">;

function intent(partial: Draft): Intent {
  return { v: "polycodex.intent.v1", id: mintIntentId(), ...partial };
}

function withOfferings(ctx: ReduceCtx): ReduceCtx {
  return {
    ...ctx,
    pack: [
      { id: "reedwood", name: "Reedwood", qty: 1 },
      { id: "ash-ore", name: "Ash ore", qty: 1 },
      { id: "perch", name: "Reed perch", qty: 1 },
      { id: "mire-fibre", name: "Mire fibre", qty: 1 },
    ],
    tithe: {
      version: 1,
      phase: "collect",
      offerings: { reedwood: true, ashOre: true, perch: true, mireFibre: true },
      bundle: false,
      favor: 0,
    },
  };
}

function run(ctx: ReduceCtx, partial: Draft) {
  const result = reduceCommand(intent(partial), ctx);
  return { result, ctx: foldCtx(ctx, result) };
}

test("a gathering command produces one canonical success or rejection", () => {
  let ctx = emptyCtx();
  const first = reduceCommand(intent({ kind: "interact", targetId: "t1", action: "gather" }), ctx);
  assert.equal(first.ok, true);
  assert.equal(first.grants[0]?.itemId, "reedwood");
  ctx = foldCtx(ctx, first);
  const second = reduceCommand(intent({ kind: "interact", targetId: "t1", action: "gather" }), ctx);
  assert.equal(second.ok, false);
  assert.equal(second.grants.length, 0);
});

test("Quiet Tithe completion grants its reward exactly once", () => {
  let ctx = emptyCtx();
  ctx = run(ctx, { kind: "talk", npcId: "halden" }).ctx;
  ctx = run(ctx, { kind: "talk", npcId: "wren" }).ctx;
  for (const id of ["t1", "o1", "f2"]) {
    const gathered = run(ctx, { kind: "interact", targetId: id, action: "gather" });
    assert.equal(gathered.result.ok, true);
    ctx = gathered.ctx;
  }
  const fibre = run(ctx, { kind: "interact", targetId: "m0", action: "strike" });
  assert.equal(fibre.result.ok, true);
  ctx = fibre.ctx;
  assert.equal(allOfferings(ctx.tithe.offerings), true);
  const bind = run(ctx, { kind: "talk", npcId: "toller" });
  assert.equal(bind.result.ok, true);
  ctx = bind.ctx;
  assert.equal(ctx.tithe.phase, "light");
  const light = run(ctx, { kind: "use", itemId: "tithe-lantern" });
  assert.equal(light.result.ok, true);
  ctx = light.ctx;
  assert.equal(ctx.tithe.phase, "report");
  const report = run(ctx, { kind: "talk", npcId: "halden" });
  assert.equal(report.result.ok, true);
  ctx = report.ctx;
  assert.equal(ctx.tithe.phase, "complete");
  assert.equal(ctx.rewardGranted, true);
  assert.ok(ctx.pack.some((item) => item.id === "lantern-of-ash"));
  assert.ok(ctx.pack.some((item) => item.id === "tithe-charm"));
  const lanterns = ctx.pack.filter((item) => item.id === "lantern-of-ash").reduce((n, item) => n + item.qty, 0);
  const again = run(ctx, { kind: "talk", npcId: "halden" });
  ctx = again.ctx;
  const lanternsAfter = ctx.pack.filter((item) => item.id === "lantern-of-ash").reduce((n, item) => n + item.qty, 0);
  assert.equal(lanternsAfter, lanterns);
  assert.equal(lanternsAfter, 1);
});

test("bind consumes offerings and duplicate bind does not", () => {
  let ctx = withOfferings(emptyCtx());
  const first = reduceCommand(intent({ kind: "talk", npcId: "toller" }), ctx);
  assert.equal(first.ok, true);
  assert.equal(first.tithe.phase, "light");
  assert.equal(first.consume.length, 4);
  ctx = foldCtx(ctx, first);
  const second = reduceCommand(intent({ kind: "talk", npcId: "toller" }), ctx);
  assert.equal(second.consume.length, 0);
  assert.equal(second.tithe.phase, "light");
});

test("craft intents resolve through the reducer and fail atomically", () => {
  let ctx = emptyCtx();
  ctx = {
    ...ctx,
    pack: [
      { id: "ash-log", name: "Ash log", qty: 3 },
      { id: "bogstone", name: "Bogstone", qty: 2 },
    ],
  };
  const first = run(ctx, { kind: "interact", targetId: "mire-axe", action: "craft" });
  assert.equal(first.result.ok, true);
  assert.equal(first.result.grants[0]?.itemId, "mire-axe");
  ctx = first.ctx;
  assert.ok(ctx.pack.some((item) => item.id === "mire-axe"));
  const second = run(ctx, { kind: "interact", targetId: "mire-axe", action: "craft" });
  assert.equal(second.result.ok, false);
  assert.equal(second.result.grants.length, 0);
});

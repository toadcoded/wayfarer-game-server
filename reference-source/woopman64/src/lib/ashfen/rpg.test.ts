import assert from "node:assert/strict";
import test from "node:test";
import { craftRecipe, EMPTY_EQUIPMENT, deriveStats, ITEM_CATALOG } from "./rpg.ts";

test("crafting consumes only required materials and creates typed equipment", () => {
  const result = craftRecipe("mire-axe", [
    { id: "ash-log", name: "Ash log", qty: 3 },
    { id: "bogstone", name: "Bogstone", qty: 2 },
    { id: "raw-fish", name: "Raw mirefish", qty: 4 },
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.result.slot, "weapon");
  assert.deepEqual(result.pack, [
    { id: "raw-fish", name: "Raw mirefish", qty: 4 },
    { id: "mire-axe", name: "Mire axe", qty: 1 },
  ]);
});

test("crafting fails atomically when materials are missing", () => {
  const inventory = [{ id: "ash-log", name: "Ash log", qty: 1 }];
  const result = craftRecipe("fen-mail", inventory);
  assert.equal(result.ok, false);
  assert.deepEqual(result.pack, inventory);
});

test("derived stats sum skills and equipment exactly once", () => {
  const stats = deriveStats(
    { Vitality: { level: 10 }, Strike: { level: 3 } },
    { ...EMPTY_EQUIPMENT, weapon: "reed-blade" },
    ITEM_CATALOG,
  );
  assert.equal(stats.maxHp, 10);
  assert.equal(stats.strike, 4);
});

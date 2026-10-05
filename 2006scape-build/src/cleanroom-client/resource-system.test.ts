import { generateResourceNodes, harvestResource, resourceDefinition } from "./resource-system";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`Assertion failed: ${message}`); }
function equal(actual: unknown, expected: unknown, message: string): void { if (actual !== expected) throw new Error(`Assertion failed: ${message}; got ${String(actual)}, expected ${String(expected)}`); }

function main(): void {
  const first = generateResourceNodes("resource-test", 0.34);
  const second = generateResourceNodes("resource-test", 0.34);
  equal(JSON.stringify(first), JSON.stringify(second), "resource generation is deterministic");
  assert(first.length > 10, "resource nodes generated");
  assert(first.some((node) => resourceDefinition(node.resourceId)?.kind === "ore-vein"), "ore nodes present");
  assert(first.some((node) => resourceDefinition(node.resourceId)?.kind === "tree"), "tree nodes present");
  assert(first.some((node) => resourceDefinition(node.resourceId)?.kind === "fishing-spot"), "fishing nodes present");
  assert(first.some((node) => resourceDefinition(node.resourceId)?.kind === "scrap-pile"), "miscellaneous nodes present");

  const copper = { ...first.find((node) => node.resourceId === "copper-vein")! };
  const mined = harvestResource(copper, "bronze-pickaxe", 1, 100);
  assert(mined.ok, "bronze pickaxe harvests copper");
  equal(mined.itemId, "copper-ore", "copper reward");
  const wrongTool = harvestResource(copper, "bronze-hatchet", 1, 100);
  equal(wrongTool.ok, false, "wrong tool rejected");
  const cooldown = harvestResource(copper, "bronze-pickaxe", 1, 110, 100);
  equal(cooldown.ok, false, "resource cooldown enforced");

  const iron = { ...first.find((node) => node.resourceId === "iron-vein")! };
  const lowLevel = harvestResource(iron, "iron-pickaxe", 1, 100);
  equal(lowLevel.ok, false, "level requirement enforced");
  const highLevel = harvestResource(iron, "iron-pickaxe", 5, 100);
  assert(highLevel.ok, "iron harvest succeeds at required level");

  const pine = { ...first.find((node) => node.resourceId === "pine-tree")! };
  const logs = harvestResource(pine, "bronze-hatchet", 1, 100);
  assert(logs.ok, "hatchet harvests pine");
  equal(logs.itemId, "pine-log", "pine log reward");

  console.log("resource-system: all assertions passed");
}

main();

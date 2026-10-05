import { CleanroomClientRuntime } from "./cleanroom-runtime";
import { createBankPanelModel, commandForPreset, tabCommand } from "./bank-ui";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function main(): Promise<void> {
  const runtime = new CleanroomClientRuntime("runtime-test-player");
  const booted = await runtime.boot();
  assert(booted.phase === "ready", "runtime reaches ready phase");
  assert(booted.manifest.systems.includes("resources"), "resource system is composed");
  assert(booted.manifest.systems.includes("npcs"), "NPC system is composed");
  assert(booted.manifest.systems.includes("vertical-expansion"), "vertical world system is composed");
  assert(booted.manifest.resourceNodeCount > 10, "resource nodes are wired into the runtime");
  assert(booted.manifest.npcCount >= 2, "starter NPCs are wired into the runtime");
  assert(booted.manifest.realmObjectCount > 40, "realm objects are wired into the runtime");

  const model = runtime.render(0, 1 / 60);
  const copper = model.resources.find((node) => node.resourceId === "copper-vein");
  assert(copper, "copper node is reachable from the composed runtime");
  await runtime.dispatch({ type: "ground.selected", destination: copper.tile });
  const harvested = await runtime.dispatch({ type: "resource.selected", nodeId: copper.id, tool: "bronze-pickaxe", skillLevel: 1, nowSeconds: 100 });
  const copperQuantity = harvested.scene.snapshot?.inventory["copper-ore"] ?? 0;
  assert(copperQuantity > 0, "resource harvest updates the authoritative runtime snapshot");

  await runtime.dispatch({ type: "ground.selected", destination: { x: 7, y: 8 } });
  const panel = createBankPanelModel(harvested.scene.snapshot!.bank);
  const selectedTab = await runtime.dispatchBankCommand(tabCommand(panel.activeTab));
  assert(selectedTab.accepted, "bank tab selection is routed to authority");
  const deposited = await runtime.dispatchBankCommand(commandForPreset("deposit", "copper-ore", "all", copperQuantity, panel.activeTab));
  assert(deposited.accepted, "bank deposit is routed to authority");
  assert((deposited.state.scene.snapshot?.inventory["copper-ore"] ?? 0) === 0, "deposit removes inventory quantity");
  const withdrawn = await runtime.dispatchBankCommand(commandForPreset("withdraw", "copper-ore", "one", 1, panel.activeTab));
  assert(withdrawn.accepted, "bank withdrawal is routed to authority");
  assert((withdrawn.state.scene.snapshot?.inventory["copper-ore"] ?? 0) === 1, "withdrawal returns one item to inventory");

  runtime.dispose();
  console.log("cleanroom-runtime: all assertions passed");
}

void main();

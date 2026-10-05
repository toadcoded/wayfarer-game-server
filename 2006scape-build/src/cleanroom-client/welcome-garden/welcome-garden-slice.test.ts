import { LocalGardenDemoAuthority, WelcomeGardenSceneController } from "./welcome-garden-slice";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`Assertion failed: ${message}; got ${String(actual)}, expected ${String(expected)}`);
}

async function main(): Promise<void> {
  const authority = new LocalGardenDemoAuthority("test-player");
  const controller = new WelcomeGardenSceneController(authority, "test-player");
  const booted = await controller.boot();
  equal(booted.phase, "ready", "scene boots");
  equal(booted.snapshot?.source, "local-demo", "demo source is visible");
  equal(booted.snapshot?.player.tile.x, 6, "spawn x");
  equal(booted.snapshot?.player.tile.y, 8, "spawn y");

  const moved = await controller.handle({ type: "ground.selected", destination: { x: 7, y: 8 } });
  equal(moved.snapshot?.player.tile.x, 7, "accepted move x");
  assert(moved.completedGuideSteps.includes("move"), "move guide step completes");

  const rejected = await controller.handle({ type: "ground.selected", destination: { x: 99, y: 99 } });
  equal(rejected.pending["move-2"], "rejected", "invalid move rejects");
  equal(rejected.lastError?.code, "INVALID_DESTINATION", "invalid move has typed error");

  await controller.handle({ type: "appearance.preview", patch: { freckles: true, hairStyle: "wavy" } });
  const confirmed = await controller.handle({ type: "appearance.confirm" });
  equal(confirmed.appearance.phase, "confirmed", "appearance confirms");
  equal(confirmed.snapshot?.portal.available, true, "departure gate unlocks after cosmetic confirmation");
  assert(confirmed.completedGuideSteps.includes("shape-character"), "appearance guide step completes");

  const inspected = await controller.handle({ type: "departure.inspect" });
  equal(inspected.departure.phase, "inspecting", "departure inspection opens");
  const departed = await controller.handle({ type: "departure.confirm" });
  equal(departed.departure.phase, "confirmed", "departure confirms");
  assert(departed.completedGuideSteps.includes("leave-garden"), "departure guide step completes");

  equal(departed.roofsVisible, true, "roofs default on");
  const roofsOff = await controller.handle({ type: "roof.visibility.toggle" });
  equal(roofsOff.roofsVisible, false, "roofs turn off");
  const roofsOffModel = controller.render(2, 1 / 60);
  equal(roofsOffModel.roofs.visible, false, "render model hides roofs");
  equal(roofsOffModel.roofs.affects, "overhead-rendering-only", "roof toggle is presentation-only");
  const roofsOn = await controller.handle({ type: "roof.visibility.toggle" });
  equal(roofsOn.roofsVisible, true, "roofs turn back on");

  const model = controller.render(3.5, 1 / 60);
  equal(model.hud.realm.activeLevelId, "welcome-garden-ground", "HUD level");
  equal(model.anchors.length, 10, "anchor count");
  assert(model.details.length > 0, "micro-details generated");
  equal(model.avatar?.position.x, 7, "avatar render position");
  equal(model.avatar?.equippedWeapon.id, "granite-maul", "startup weapon");
  equal(model.avatar?.equippedWeapon.specialAttack.id, "double-whack", "startup special attack");
  equal(model.avatar?.equippedWeapon.style.primaryFinish, "frost-granite", "maul cosmetic style");
  equal(model.starterArmorTable.claimPolicy, "once-per-character", "starter armour claim policy");
  equal(model.starterArmorTable.material, "brushed-brass", "starter armour material");
  equal(model.bank.open, false, "bank starts closed");
  equal(model.bank.totalItemCount, 2515, "starter bank item count");
  assert(model.bank.totalFreeSlots > 700, "bank exposes free capacity");
  equal(model.npcs.length, 2, "starter NPC count");
  assert(model.npcs.some((npc) => npc.id === "mara-bankkeeper" && npc.nodes.length >= 5), "bankkeeper dialogue tree");
  assert(model.npcs.some((npc) => npc.id === "orin-guide" && npc.tradeOffers.length > 0), "guide trade offers");
  assert(model.resources.length > 10, "resource nodes generated");
  assert(model.resources.some((node) => node.resourceId === "copper-vein"), "copper resource exposed");
  assert(model.resources.some((node) => node.resourceId === "pine-tree"), "tree resource exposed");
  const copper = model.resources.find((node) => node.resourceId === "copper-vein");
  assert(copper, "copper node available for interaction");
  await controller.handle({ type: "ground.selected", destination: copper.tile });
  const harvested = await controller.handle({ type: "resource.selected", nodeId: copper.id, tool: "bronze-pickaxe", skillLevel: 1, nowSeconds: 100 });
  equal(harvested.action.phase, "accepted", "copper harvest accepted");
  assert((harvested.snapshot?.inventory["copper-ore"] ?? 0) > 0, "copper inventory reward");
  equal(controller.render(3.6, 1 / 60).hudPresentation.action.phase, "accepted", "HUD shows harvest success");
  const cooldown = await controller.handle({ type: "resource.selected", nodeId: copper.id, tool: "bronze-pickaxe", skillLevel: 1, nowSeconds: 110 });
  equal(cooldown.action.phase, "rejected", "cooldown rejection");
  equal(cooldown.lastError?.code, "COOLDOWN", "typed cooldown error");
  const wrongTool = await controller.handle({ type: "resource.selected", nodeId: copper.id, tool: "bronze-hatchet", skillLevel: 1, nowSeconds: 200 });
  equal(wrongTool.lastError?.code, "TOOL_REQUIRED", "typed tool error");
  await controller.handle({ type: "ground.selected", destination: { x: copper.tile.x + 8, y: copper.tile.y + 8 } });
  const outOfRange = await controller.handle({ type: "resource.selected", nodeId: copper.id, tool: "bronze-pickaxe", skillLevel: 1, nowSeconds: 200 });
  equal(outOfRange.lastError?.code, "OUT_OF_RANGE", "typed range error");
  await controller.handle({ type: "ground.selected", destination: copper.tile });
  const respawned = await controller.handle({ type: "resource.selected", nodeId: copper.id, tool: "bronze-pickaxe", skillLevel: 1, nowSeconds: 200 });
  equal(respawned.action.phase, "accepted", "harvest succeeds after respawn");
  const copperBeforeDeposit = respawned.snapshot?.inventory["copper-ore"] ?? 0;
  assert(copperBeforeDeposit > 0, "copper is available to deposit");
  const bankArrival = await controller.handle({ type: "ground.selected", destination: { x: 7, y: 8 } });
  equal(bankArrival.snapshot?.player.tile.x, 7, "bank counter is reachable");
  const deposited = await controller.handle({ type: "bank.deposit", itemId: "copper-ore", quantity: copperBeforeDeposit });
  equal(deposited.action.phase, "accepted", "inventory-to-bank deposit succeeds");
  equal(deposited.snapshot?.inventory["copper-ore"] ?? 0, 0, "deposit removes copper from inventory");
  equal(deposited.snapshot?.bank.totalItemCount, 2515 + copperBeforeDeposit, "bank ledger receives deposited copper");
  assert(deposited.snapshot?.bank.tabs[0].slots.some((slot) => slot.itemId === "copper-ore" && slot.quantity === copperBeforeDeposit), "bank exposes the deposited copper stack");
  const emptyDeposit = await controller.handle({ type: "bank.deposit", itemId: "copper-ore", quantity: 1 });
  equal(emptyDeposit.action.phase, "rejected", "empty inventory deposit rejects");
  equal(emptyDeposit.lastError?.code, "INSUFFICIENT_QUANTITY", "empty inventory deposit has typed error");
  equal(model.mapBounds.minX, -64, "full western realm expansion");
  equal(model.mapBounds.minY, -24, "full northern realm expansion");
  equal(model.mapBounds.maxX, 64, "full eastern realm expansion");
  equal(model.mapBounds.maxY, 80, "full southern realm expansion");
  equal(model.compass.placement, "top-right", "compass placement");
  equal(model.compass.facing, "N", "compass facing");
  equal(model.hudPresentation.minimap.placement, "top-right", "minimap placement");
  assert(model.hudPresentation.minimap.markers.some((marker) => marker.icon === "ore"), "ore minimap icon");
  assert(model.hudPresentation.minimap.markers.some((marker) => marker.icon === "tree"), "tree minimap icon");
  assert(model.hudPresentation.chatTabs.some((tab) => tab.channel === "trade"), "trade chat tab");
  assert(model.hudPresentation.panels.some((panel) => panel.id === "bank"), "bank HUD panel");
  assert(model.hudPresentation.layers.some((layer) => layer.id === "resources"), "resource environment layer");
  equal(model.hudPresentation.roof.visible, true, "HUD roof state synchronized");
  equal(model.mountain.summitAccessible, true, "summit is accessible");
  equal(model.mountain.ramps.length, 4, "mountain ramp count");

  const northernEdge = await controller.handle({ type: "ground.selected", destination: { x: 12, y: 0 } });
  equal(northernEdge.snapshot?.player.tile.y, 0, "north edge is playable");
  const westernEdge = await controller.handle({ type: "ground.selected", destination: { x: 0, y: 10 } });
  equal(westernEdge.snapshot?.player.tile.x, 0, "west edge is playable");
  const easternEdge = await controller.handle({ type: "ground.selected", destination: { x: 24, y: 10 } });
  equal(easternEdge.snapshot?.player.tile.x, 24, "east edge is playable");
  const southernEdge = await controller.handle({ type: "ground.selected", destination: { x: 12, y: 20 } });
  equal(southernEdge.snapshot?.player.tile.y, 20, "south edge is playable");
  await controller.handle({ type: "ground.selected", destination: { x: 12, y: 23 } });
  await controller.handle({ type: "ground.selected", destination: { x: 12, y: 26 } });
  await controller.handle({ type: "ground.selected", destination: { x: 11, y: 29 } });
  const summit = await controller.handle({ type: "ground.selected", destination: { x: 12, y: 32 } });
  const summitModel = controller.render(4.5, 1 / 60);
  equal(summit.snapshot?.player.tile.y, 32, "summit tile is playable");
  equal(summitModel.avatar?.terrainElevation, 18, "summit elevation");
  equal(summitModel.avatar?.position.y, 18, "avatar reaches peak height");
  equal(model.beach.districtId, "sunwash-coast", "southern beach district");
  equal(model.beach.sandBounds.maxY, 44, "beach southern boundary");
  equal(model.beach.landmarks.length, 4, "beach landmarks");
  const beachArrival = await controller.handle({ type: "ground.selected", destination: { x: 12, y: 33 } });
  equal(beachArrival.snapshot?.player.tile.y, 33, "sand gate is playable");
  const oasis = await controller.handle({ type: "ground.selected", destination: { x: 7, y: 38 } });
  equal(oasis.snapshot?.player.tile.x, 7, "oasis is playable");
  const oasisPool = await controller.handle({ type: "ground.selected", destination: { x: 7, y: 39 } });
  equal(oasisPool.snapshot?.player.tile.y, 39, "oasis pool is playable");
  equal(model.mapBounds.maxX, 64, "full eastern realm edge");
  equal(model.marsh.districtId, "gloamfen-marsh", "marsh district");
  equal(model.marsh.atmosphere.mood, "gloomy", "marsh mood");
  equal(model.marsh.atmosphere.moistureTextureKey, "copper-lantern-gloamfen-wet-bark-moss-mud", "moisture texture");
  equal(model.marsh.landmarks.length, 9, "marsh landmarks");
  const marshGate = await controller.handle({ type: "ground.selected", destination: { x: 25, y: 12 } });
  equal(marshGate.snapshot?.player.tile.x, 25, "marsh gate is playable");
  const creekBridge = await controller.handle({ type: "ground.selected", destination: { x: 31, y: 15 } });
  equal(creekBridge.snapshot?.player.tile.x, 31, "creek bridge is playable");
  const cave = await controller.handle({ type: "ground.selected", destination: { x: 34, y: 8 } });
  equal(cave.snapshot?.player.tile.x, 34, "marsh cave route is playable");
  const hill = await controller.handle({ type: "ground.selected", destination: { x: 34, y: 25 } });
  equal(hill.snapshot?.player.tile.y, 25, "marsh hills are playable");
  const grassland = await controller.handle({ type: "ground.selected", destination: { x: 27, y: 28 } });
  equal(grassland.snapshot?.player.tile.x, 27, "flat grasslands are playable");
  equal(model.xeriscape.districtId, "redglass-xeriscape", "western xeriscape district");
  equal(model.xeriscape.atmosphere.moistureTextureKey, "copper-lantern-redglass-drystone-cracked-earth", "xeriscape texture");
  equal(model.xeriscape.landmarks.length, 11, "xeriscape landmarks");
  const westernGate = await controller.handle({ type: "ground.selected", destination: { x: -1, y: 14 } });
  equal(westernGate.snapshot?.player.tile.x, -1, "xeriscape west gate is playable");
  const cactusGrove = await controller.handle({ type: "ground.selected", destination: { x: -6, y: 10 } });
  equal(cactusGrove.snapshot?.player.tile.x, -6, "cactus grove is playable");
  const quarry = await controller.handle({ type: "ground.selected", destination: { x: -8, y: 14 } });
  equal(quarry.snapshot?.player.tile.x, -8, "quarry is playable");
  const plateau = await controller.handle({ type: "ground.selected", destination: { x: -16, y: 25 } });
  equal(plateau.snapshot?.player.tile.x, -16, "plateau is playable");
  const canyon = await controller.handle({ type: "ground.selected", destination: { x: -19, y: 30 } });
  equal(canyon.snapshot?.player.tile.x, -19, "canyon is playable");
  assert(model.realmObjects.length > 40, "large deterministic object field");
  assert(model.realmObjects.some((object) => object.kind === "cactus"), "cactus decorations");
  assert(model.realmObjects.some((object) => object.kind === "fungus"), "fungus decorations");
  assert(model.realmObjects.some((object) => object.kind === "ancient-tree"), "forest decorations");
  equal(model.physicalProperties.gravity, 9.81, "realm gravity");
  equal(model.physicalProperties.maximumBridgeLoad, 900, "bridge load property");
  equal(model.physicalProperties.minimumCaveClearance, 1.8, "cave clearance property");
  const farEdge = await controller.handle({ type: "ground.selected", destination: { x: 64, y: 80 } });
  equal(farEdge.snapshot?.player.tile.x, 64, "far east realm edge is playable");
  equal(farEdge.snapshot?.player.tile.y, 80, "far south realm edge is playable");

  console.log("welcome-garden-slice: all assertions passed");
}

void main();

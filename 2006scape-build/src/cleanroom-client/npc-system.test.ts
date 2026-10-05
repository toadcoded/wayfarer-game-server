import { DEFAULT_NPC_CONTEXT, STARTER_NPC_ENGINE } from "./npc-system";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`Assertion failed: ${message}; got ${String(actual)}, expected ${String(expected)}`);
}

function main(): void {
  const maraStart = STARTER_NPC_ENGINE.begin("mara-bankkeeper", DEFAULT_NPC_CONTEXT);
  assert(maraStart.ok, "Mara conversation starts");
  equal(maraStart.conversation.npc.personality.mood, "welcoming", "Mara personality mood");
  assert(maraStart.conversation.options.some((option) => option.id === "mara-bank"), "bank option available while bank closed");

  const maraHelp = STARTER_NPC_ENGINE.choose(maraStart.conversation.state, "mara-bank", DEFAULT_NPC_CONTEXT);
  assert(maraHelp.ok, "Mara bank branch succeeds");
  equal(maraHelp.conversation.node.topic, "help", "Mara branch topic");
  assert(maraHelp.conversation.state.flags["bank-introduced"], "bank introduction flag set");

  const bankOpenContext = { ...DEFAULT_NPC_CONTEXT, bankOpen: true };
  const maraOpen = STARTER_NPC_ENGINE.begin("mara-bankkeeper", bankOpenContext);
  assert(maraOpen.ok, "Mara can be greeted with bank open");
  assert(!maraOpen.conversation.options.some((option) => option.id === "mara-bank"), "bank-closed option is context-gated");

  const orinStart = STARTER_NPC_ENGINE.begin("orin-guide", DEFAULT_NPC_CONTEXT);
  assert(orinStart.ok, "Orin conversation starts");
  const mountain = STARTER_NPC_ENGINE.choose(orinStart.conversation.state, "orin-mountain", DEFAULT_NPC_CONTEXT);
  assert(mountain.ok, "Orin mountain branch succeeds");
  equal(mountain.conversation.state.reputation, 1, "route discussion reputation");
  assert(mountain.conversation.state.flags["heard-about-routes"], "route flag set");

  const trade = STARTER_NPC_ENGINE.choose(mountain.conversation.state, "orin-supply", DEFAULT_NPC_CONTEXT);
  assert(trade.ok, "Orin trade branch succeeds");
  equal(trade.conversation.state.offeredTradeId, "orin-lantern", "lantern offer attached");
  const traded = STARTER_NPC_ENGINE.trade(trade.conversation.state, "orin-lantern", DEFAULT_NPC_CONTEXT);
  assert(traded.ok, "trade offer resolves");
  equal(traded.conversation.state.offeredTradeId, "orin-lantern", "offered trade remembered");

  console.log("npc-system: all assertions passed");
}

main();

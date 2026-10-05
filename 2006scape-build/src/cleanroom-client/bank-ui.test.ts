import { BankLedger } from "./bank-system";
import {
  commandForPreset,
  createBankPanelModel,
  quantityForPreset,
  reduceBankPanelState,
  slotMoveCommand,
  tabCommand,
} from "./bank-ui";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`Assertion failed: ${message}; got ${String(actual)}, expected ${String(expected)}`);
}

function main(): void {
  const ledger = new BankLedger([
    { itemId: "coins", quantity: 2_500_000 },
    { itemId: "copper-ore", quantity: 12, tab: 1 },
  ]);
  const bank = ledger.view();
  const mainPanel = createBankPanelModel(bank);
  equal(mainPanel.tabs[0].itemCount, 2_500_000, "main tab count includes the coin stack");
  equal(mainPanel.tabs[1].occupiedSlots, 1, "second tab reports one occupied slot");
  equal(mainPanel.slots[0].stackBadge?.text, "2M", "large stacks use compact badges");
  equal(mainPanel.slots[0].stackBadge?.accessibleLabel, "2,500,000 items", "large stack keeps an accessible exact count");
  equal(mainPanel.commandHint.includes("drag"), true, "bank mode explains slot reordering");

  const depositPanel = createBankPanelModel(bank, { mode: "deposit" });
  equal(depositPanel.title, "Deposit items", "deposit mode has a distinct title");
  equal(depositPanel.commandHint.includes("All"), true, "deposit mode explains quantity presets");

  equal(quantityForPreset("one", 20), 1, "one preset");
  equal(quantityForPreset("five", 3), 3, "five preset clamps to available quantity");
  equal(quantityForPreset("ten", 7), 7, "ten preset clamps to available quantity");
  equal(quantityForPreset("all", 12), 12, "all preset");
  const withdrawCommand = commandForPreset("withdraw", "copper-ore", "ten", 7);
  assert(withdrawCommand.type === "bank.withdraw", "withdraw command direction");
  equal(withdrawCommand.quantity, 7, "withdraw command quantity");
  const depositCommand = commandForPreset("deposit", "copper-ore", "five", 12);
  assert(depositCommand.type === "bank.deposit", "deposit command direction");

  equal(tabCommand(1).type, "bank.tab.select", "tab command type");
  equal(slotMoveCommand(1, 0, 4)?.type, "bank.slot.move", "slot move command type");
  equal(slotMoveCommand(1, 4, 4), undefined, "same-slot move is ignored");
  equal(slotMoveCommand(1, -1, 4), undefined, "invalid source slot is ignored");
  equal(reduceBankPanelState({ mode: "deposit", selectedSlot: 3 }, tabCommand(1)).selectedSlot, undefined, "tab changes clear selection");

  assert(mainPanel.slots.some((slot) => slot.itemId === "coins" && slot.stackable), "stacked item is marked stackable");
  console.log("bank-ui: all assertions passed");
}

main();

import { BANK_CAPACITY, BankLedger } from "./bank-system";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`Assertion failed: ${message}; got ${String(actual)}, expected ${String(expected)}`);
}

function main(): void {
  const bank = new BankLedger();
  equal(bank.view().totalFreeSlots, BANK_CAPACITY, "empty bank capacity");

  const coins = bank.deposit("coins", 2500);
  assert(coins.ok, "coins deposit succeeds");
  const moreCoins = bank.deposit("coins", 500);
  assert(moreCoins.ok, "coins stack deposit succeeds");
  equal(bank.view().totalItemCount, 3000, "stacked coins count");
  equal(bank.view().totalUsedSlots, 1, "stacked coins use one slot");

  const sword = bank.deposit("bronze-sword", 1);
  assert(sword.ok, "unstackable item deposit succeeds");
  const invalidSwordStack = bank.deposit("bronze-sword", 2);
  equal(invalidSwordStack.ok, false, "unstackable item rejects quantity two");

  const placeholder = bank.setPlaceholder(0, 1);
  assert(placeholder.ok, "placeholder created");
  equal(bank.view().tabs[0].slots[1].placeholder, true, "placeholder visible");
  const clearPlaceholder = bank.clearPlaceholder(0, 1);
  assert(clearPlaceholder.ok, "placeholder clears");
  const swordAgain = bank.deposit("bronze-sword", 1);
  assert(swordAgain.ok, "item can be redeposited after placeholder clear");

  bank.setNoteMode(true);
  const notedWithdrawal = bank.withdraw("bronze-sword", 1);
  assert(notedWithdrawal.ok, "note-mode withdrawal succeeds for noteable item");
  const nonNoteable = bank.withdraw("coins", 1, 0, true);
  equal(nonNoteable.ok, false, "non-noteable item rejects note withdrawal");

  bank.deposit("copper-lantern", 1, 2);
  const moved = bank.move(2, 0, 4);
  assert(moved.ok, "slot move succeeds");
  equal(bank.view().tabs[2].slots[4].itemId, "copper-lantern", "moved item location");

  bank.setSearch("lantern");
  const searched = bank.view();
  equal(searched.searchQuery, "lantern", "bank search query");
  equal(searched.tabs[2].slots[4].itemId, "copper-lantern", "matching search result remains visible");
  equal(searched.tabs[0].slots[0].itemId, undefined, "nonmatching search result is hidden");

  console.log("bank-system: all assertions passed");
}

main();

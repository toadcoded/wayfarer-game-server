/**
 * Project Copper Lantern — bank ledger and presentation model.
 *
 * The ledger is deterministic and validation-heavy. A production server should
 * persist the returned state atomically after accepting each command.
 */

export type BankTabId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type BankItemId = "coins" | "bronze-sword" | "brass-armour" | "granite-maul" | "lobster" | "rune-essence" | "teleport-rune" | "copper-lantern" | "copper-ore" | "clay";

export type BankItemDefinition = Readonly<{
  id: BankItemId;
  name: string;
  stackable: boolean;
  noteable: boolean;
  maxStack: number;
  weight: number;
}>;

export type BankSlot = Readonly<{
  itemId?: BankItemId;
  quantity: number;
  noted: boolean;
  placeholder: boolean;
}>;

export type BankTab = Readonly<{
  id: BankTabId;
  label: string;
  slots: readonly BankSlot[];
}>;

export type BankViewModel = Readonly<{
  open: boolean;
  searchQuery: string;
  activeTab: BankTabId;
  noteMode: boolean;
  tabs: readonly BankTab[];
  totalUsedSlots: number;
  totalFreeSlots: number;
  totalItemCount: number;
}>;

export type BankResult = Readonly<{ ok: true; state: BankViewModel }> | Readonly<{ ok: false; code: BankErrorCode; message: string }>;
export type BankErrorCode = "INVALID_QUANTITY" | "ITEM_NOT_FOUND" | "ITEM_NOT_STACKABLE" | "BANK_FULL" | "SLOT_EMPTY" | "PLACEHOLDER_REQUIRED" | "INVALID_TAB" | "INVALID_SLOT" | "INSUFFICIENT_QUANTITY" | "ITEM_NOT_NOTEABLE";

export const BANK_TAB_COUNT = 9;
export const BANK_SLOTS_PER_TAB = 80;
export const BANK_CAPACITY = BANK_TAB_COUNT * BANK_SLOTS_PER_TAB;

export const BANK_ITEMS: Readonly<Record<BankItemId, BankItemDefinition>> = {
  coins: { id: "coins", name: "Coins", stackable: true, noteable: false, maxStack: 2_147_483_647, weight: 0 },
  "bronze-sword": { id: "bronze-sword", name: "Bronze sword", stackable: false, noteable: true, maxStack: 1, weight: 2.2 },
  "brass-armour": { id: "brass-armour", name: "Brass armour", stackable: false, noteable: true, maxStack: 1, weight: 8.5 },
  "granite-maul": { id: "granite-maul", name: "Granite maul", stackable: false, noteable: true, maxStack: 1, weight: 7.5 },
  lobster: { id: "lobster", name: "Lobster", stackable: true, noteable: false, maxStack: 2_147_483_647, weight: 0.8 },
  "rune-essence": { id: "rune-essence", name: "Rune essence", stackable: true, noteable: false, maxStack: 2_147_483_647, weight: 0.1 },
  "teleport-rune": { id: "teleport-rune", name: "Teleport rune", stackable: true, noteable: false, maxStack: 2_147_483_647, weight: 0.1 },
  "copper-lantern": { id: "copper-lantern", name: "Copper lantern", stackable: false, noteable: true, maxStack: 1, weight: 1.4 },
  "copper-ore": { id: "copper-ore", name: "Copper ore", stackable: true, noteable: false, maxStack: 2_147_483_647, weight: 1.0 },
  clay: { id: "clay", name: "Clay", stackable: true, noteable: false, maxStack: 2_147_483_647, weight: 1.0 },
};

const EMPTY_SLOT: BankSlot = { quantity: 0, noted: false, placeholder: false };

function emptyTabs(): BankTab[] {
  return Array.from({ length: BANK_TAB_COUNT }, (_, id) => ({
    id: id as BankTabId,
    label: id === 0 ? "Main" : `Tab ${id + 1}`,
    slots: Array.from({ length: BANK_SLOTS_PER_TAB }, () => EMPTY_SLOT),
  }));
}

function cloneTabs(tabs: readonly BankTab[]): BankTab[] {
  return tabs.map((tab) => ({ ...tab, slots: tab.slots.map((slot) => ({ ...slot })) }));
}

function fail(code: BankErrorCode, message: string): BankResult {
  return { ok: false, code, message };
}

function validTab(tab: number): tab is BankTabId {
  return Number.isInteger(tab) && tab >= 0 && tab < BANK_TAB_COUNT;
}

function validSlot(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 0 && slot < BANK_SLOTS_PER_TAB;
}

function itemMatches(slot: BankSlot, itemId: BankItemId): boolean {
  return slot.itemId === itemId && !slot.placeholder;
}

export class BankLedger {
  private tabs: BankTab[] = emptyTabs();
  private activeTab: BankTabId = 0;
  private noteMode = false;
  private searchQuery = "";
  private open = false;

  public constructor(seed?: ReadonlyArray<{ itemId: BankItemId; quantity: number; tab?: BankTabId; noted?: boolean }>) {
    for (const item of seed ?? []) this.deposit(item.itemId, item.quantity, item.tab ?? 0, item.noted ?? false);
  }

  public setOpen(open: boolean): void { this.open = open; }
  public setSearch(query: string): void { this.searchQuery = query.trim().toLowerCase(); }
  public setActiveTab(tab: BankTabId): BankResult {
    if (!validTab(tab)) return fail("INVALID_TAB", "That bank tab does not exist.");
    this.activeTab = tab;
    return { ok: true, state: this.view() };
  }
  public setNoteMode(enabled: boolean): void { this.noteMode = enabled; }

  public deposit(itemId: BankItemId, quantity: number, tab: BankTabId = this.activeTab, noted = false): BankResult {
    const definition = BANK_ITEMS[itemId];
    if (!definition) return fail("ITEM_NOT_FOUND", "That item is not registered.");
    if (!validTab(tab)) return fail("INVALID_TAB", "That bank tab does not exist.");
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return fail("INVALID_QUANTITY", "Deposit quantity must be a positive whole number.");
    if (noted && !definition.noteable) return fail("ITEM_NOT_NOTEABLE", "That item cannot be noted.");
    if (!definition.stackable && quantity !== 1) return fail("ITEM_NOT_STACKABLE", "That item must be deposited one at a time.");

    const slots = [...this.tabs[tab].slots];
    const matchingIndex = slots.findIndex((slot) => itemMatches(slot, itemId) && slot.noted === noted);
    if (definition.stackable && matchingIndex >= 0) {
      const next = slots[matchingIndex].quantity + quantity;
      if (next > definition.maxStack) return fail("INVALID_QUANTITY", "That stack would exceed its maximum quantity.");
      slots[matchingIndex] = { ...slots[matchingIndex], quantity: next };
    } else {
      const emptyIndex = slots.findIndex((slot) => slot.quantity === 0 && !slot.placeholder);
      if (emptyIndex < 0) return fail("BANK_FULL", "There is no free bank slot in this tab.");
      slots[emptyIndex] = { itemId, quantity, noted, placeholder: false };
    }
    this.tabs[tab] = { ...this.tabs[tab], slots };
    return { ok: true, state: this.view() };
  }

  public withdraw(itemId: BankItemId, quantity: number, tab: BankTabId = this.activeTab, noted = this.noteMode): BankResult {
    const definition = BANK_ITEMS[itemId];
    if (!definition) return fail("ITEM_NOT_FOUND", "That item is not registered.");
    if (!validTab(tab)) return fail("INVALID_TAB", "That bank tab does not exist.");
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return fail("INVALID_QUANTITY", "Withdraw quantity must be a positive whole number.");
    if (noted && !definition.noteable) return fail("ITEM_NOT_NOTEABLE", "That item cannot be withdrawn as a note.");
    const index = this.tabs[tab].slots.findIndex((slot) => itemMatches(slot, itemId));
    if (index < 0) return fail("ITEM_NOT_FOUND", "That item is not in this bank tab.");
    const slot = this.tabs[tab].slots[index];
    if (quantity > slot.quantity) return fail("INSUFFICIENT_QUANTITY", "There is not enough of that item in the bank.");
    const slots = [...this.tabs[tab].slots];
    const remaining = slot.quantity - quantity;
    slots[index] = remaining === 0
      ? (slot.placeholder ? { ...slot, quantity: 0, itemId: undefined } : EMPTY_SLOT)
      : { ...slot, quantity: remaining };
    this.tabs[tab] = { ...this.tabs[tab], slots };
    return { ok: true, state: this.view() };
  }

  public setPlaceholder(tab: BankTabId, slotIndex: number): BankResult {
    if (!validTab(tab) || !validSlot(slotIndex)) return fail("INVALID_SLOT", "That bank slot does not exist.");
    const slot = this.tabs[tab].slots[slotIndex];
    if (!slot.itemId || slot.quantity <= 0) return fail("PLACEHOLDER_REQUIRED", "A placeholder needs an item history.");
    const slots = [...this.tabs[tab].slots];
    slots[slotIndex] = { itemId: slot.itemId, quantity: 0, noted: slot.noted, placeholder: true };
    this.tabs[tab] = { ...this.tabs[tab], slots };
    return { ok: true, state: this.view() };
  }

  public clearPlaceholder(tab: BankTabId, slotIndex: number): BankResult {
    if (!validTab(tab) || !validSlot(slotIndex)) return fail("INVALID_SLOT", "That bank slot does not exist.");
    const slot = this.tabs[tab].slots[slotIndex];
    if (!slot.placeholder) return fail("PLACEHOLDER_REQUIRED", "That slot is not a placeholder.");
    const slots = [...this.tabs[tab].slots];
    slots[slotIndex] = EMPTY_SLOT;
    this.tabs[tab] = { ...this.tabs[tab], slots };
    return { ok: true, state: this.view() };
  }

  public move(tab: BankTabId, from: number, to: number): BankResult {
    if (!validTab(tab) || !validSlot(from) || !validSlot(to)) return fail("INVALID_SLOT", "That bank slot does not exist.");
    const slots = [...this.tabs[tab].slots];
    [slots[from], slots[to]] = [slots[to], slots[from]];
    this.tabs[tab] = { ...this.tabs[tab], slots };
    return { ok: true, state: this.view() };
  }

  public view(): BankViewModel {
    const visibleTabs = this.tabs.map((tab) => ({ ...tab, slots: tab.slots.map((slot) => ({ ...slot })) }));
    const filtered = this.searchQuery
      ? visibleTabs.map((tab) => ({ ...tab, slots: tab.slots.map((slot) => slot.itemId && BANK_ITEMS[slot.itemId].name.toLowerCase().includes(this.searchQuery) ? slot : { ...slot, quantity: 0, itemId: undefined }) }))
      : visibleTabs;
    const totalUsedSlots = this.tabs.reduce((total, tab) => total + tab.slots.filter((slot) => slot.quantity > 0).length, 0);
    const totalItemCount = this.tabs.reduce((total, tab) => total + tab.slots.reduce((subtotal, slot) => subtotal + slot.quantity, 0), 0);
    return { open: this.open, searchQuery: this.searchQuery, activeTab: this.activeTab, noteMode: this.noteMode, tabs: filtered, totalUsedSlots, totalFreeSlots: BANK_CAPACITY - totalUsedSlots, totalItemCount };
  }
}

export function createDefaultBankView(): BankViewModel {
  const bank = new BankLedger([
    { itemId: "coins", quantity: 2500 },
    { itemId: "brass-armour", quantity: 1 },
    { itemId: "granite-maul", quantity: 1 },
    { itemId: "lobster", quantity: 12 },
    { itemId: "copper-lantern", quantity: 1 },
  ]);
  bank.setOpen(false);
  return bank.view();
}

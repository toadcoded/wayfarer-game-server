/**
 * Project Copper Lantern — bank panel UI contract.
 *
 * This is presentation-only. It derives render rows from an authoritative
 * BankViewModel and emits commands; it never mutates the ledger or invents
 * inventory quantities. A React/Babylon overlay can bind directly to this model.
 */

import {
  BANK_ITEMS,
  BANK_SLOTS_PER_TAB,
  type BankItemId,
  type BankSlot,
  type BankTabId,
  type BankViewModel,
} from "./bank-system";

export type BankQuantityPreset = "one" | "five" | "ten" | "all";
export type BankPanelMode = "bank" | "deposit";

export type BankPanelCommand =
  | Readonly<{ type: "bank.tab.select"; tab: BankTabId }>
  | Readonly<{ type: "bank.search.set"; query: string }>
  | Readonly<{ type: "bank.mode.set"; mode: BankPanelMode }>
  | Readonly<{ type: "bank.deposit"; itemId: BankItemId; quantity: number; tab: BankTabId }>
  | Readonly<{ type: "bank.withdraw"; itemId: BankItemId; quantity: number; tab: BankTabId }>
  | Readonly<{ type: "bank.placeholder.toggle"; tab: BankTabId; slot: number }>
  | Readonly<{ type: "bank.slot.move"; tab: BankTabId; from: number; to: number }>;

export type BankPanelTabSummary = Readonly<{
  id: BankTabId;
  label: string;
  occupiedSlots: number;
  itemCount: number;
  selected: boolean;
}>;

export type BankPanelStackBadge = Readonly<{
  text: string;
  accessibleLabel: string;
  compact: boolean;
}>;

export type BankPanelSlotModel = Readonly<{
  slot: number;
  itemId?: BankItemId;
  itemName?: string;
  quantity: number;
  noted: boolean;
  placeholder: boolean;
  empty: boolean;
  stackable: boolean;
  stackBadge?: BankPanelStackBadge;
  selected: boolean;
  draggable: boolean;
}>;

export type BankPanelModel = Readonly<{
  title: string;
  mode: BankPanelMode;
  searchQuery: string;
  activeTab: BankTabId;
  tabs: readonly BankPanelTabSummary[];
  slots: readonly BankPanelSlotModel[];
  totalItemCount: number;
  totalUsedSlots: number;
  totalFreeSlots: number;
  selectedItem?: Readonly<{ itemId: BankItemId; quantity: number }>;
  quantityPresets: readonly BankQuantityPreset[];
  commandHint: string;
}>;

export type BankPanelState = Readonly<{
  mode: BankPanelMode;
  selectedSlot?: number;
}>;

export const DEFAULT_BANK_PANEL_STATE: BankPanelState = { mode: "bank" };
export const BANK_QUANTITY_PRESETS: readonly BankQuantityPreset[] = ["one", "five", "ten", "all"];

function compactQuantity(quantity: number): string {
  if (quantity < 1_000) return String(quantity);
  if (quantity < 1_000_000) return `${Math.floor(quantity / 1_000)}K`;
  if (quantity < 1_000_000_000) return `${Math.floor(quantity / 1_000_000)}M`;
  return `${Math.floor(quantity / 1_000_000_000)}B`;
}

function stackBadge(slot: BankSlot): BankPanelStackBadge | undefined {
  if (!slot.itemId || slot.quantity <= 0 || !BANK_ITEMS[slot.itemId].stackable) return undefined;
  const text = compactQuantity(slot.quantity);
  return { text, accessibleLabel: `${slot.quantity.toLocaleString()} items`, compact: text !== String(slot.quantity) };
}

function slotModel(slot: BankSlot, slotIndex: number, selectedSlot?: number): BankPanelSlotModel {
  const item = slot.itemId ? BANK_ITEMS[slot.itemId] : undefined;
  return {
    slot: slotIndex,
    itemId: slot.itemId,
    itemName: item?.name,
    quantity: slot.quantity,
    noted: slot.noted,
    placeholder: slot.placeholder,
    empty: slot.quantity <= 0 && !slot.placeholder,
    stackable: item?.stackable ?? false,
    stackBadge: stackBadge(slot),
    selected: selectedSlot === slotIndex,
    draggable: Boolean(slot.itemId && slot.quantity > 0 && !slot.placeholder),
  };
}

export function quantityForPreset(preset: BankQuantityPreset, available: number): number {
  if (preset === "one") return Math.min(1, available);
  if (preset === "five") return Math.min(5, available);
  if (preset === "ten") return Math.min(10, available);
  return available;
}

export function createBankPanelModel(
  bank: BankViewModel,
  state: BankPanelState = DEFAULT_BANK_PANEL_STATE,
): BankPanelModel {
  const active = bank.tabs.find((tab) => tab.id === bank.activeTab) ?? bank.tabs[0];
  const slots = active?.slots ?? [];
  const selectedSlot = state.selectedSlot === undefined ? undefined : slots[state.selectedSlot];
  const selectedItem = selectedSlot?.itemId && selectedSlot.quantity > 0
    ? { itemId: selectedSlot.itemId, quantity: selectedSlot.quantity }
    : undefined;

  return {
    title: state.mode === "deposit" ? "Deposit items" : "Copper Lantern Bank",
    mode: state.mode,
    searchQuery: bank.searchQuery,
    activeTab: bank.activeTab,
    tabs: bank.tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      occupiedSlots: tab.slots.filter((slot) => slot.quantity > 0).length,
      itemCount: tab.slots.reduce((total, slot) => total + slot.quantity, 0),
      selected: tab.id === bank.activeTab,
    })),
    slots: Array.from({ length: BANK_SLOTS_PER_TAB }, (_, index) => slotModel(slots[index] ?? { quantity: 0, noted: false, placeholder: false }, index, state.selectedSlot)),
    totalItemCount: bank.totalItemCount,
    totalUsedSlots: bank.totalUsedSlots,
    totalFreeSlots: bank.totalFreeSlots,
    selectedItem,
    quantityPresets: BANK_QUANTITY_PRESETS,
    commandHint: state.mode === "deposit"
      ? "Select an inventory item, then choose 1, 5, 10, or All."
      : "Select an item to withdraw; drag populated slots to reorder them.",
  };
}

export function commandForPreset(
  direction: "deposit" | "withdraw",
  itemId: BankItemId,
  preset: BankQuantityPreset,
  available: number,
  tab: BankTabId = 0,
): BankPanelCommand {
  return { type: direction === "deposit" ? "bank.deposit" : "bank.withdraw", itemId, quantity: quantityForPreset(preset, available), tab };
}

export function tabCommand(tab: BankTabId): BankPanelCommand {
  return { type: "bank.tab.select", tab };
}

export function slotMoveCommand(tab: BankTabId, from: number, to: number): BankPanelCommand | undefined {
  if (from === to || from < 0 || to < 0 || from >= BANK_SLOTS_PER_TAB || to >= BANK_SLOTS_PER_TAB) return undefined;
  return { type: "bank.slot.move", tab, from, to };
}

export function reduceBankPanelState(state: BankPanelState, command: BankPanelCommand): BankPanelState {
  if (command.type === "bank.mode.set") return { ...state, mode: command.mode, selectedSlot: undefined };
  if (command.type === "bank.tab.select") return { ...state, selectedSlot: undefined };
  if (command.type === "bank.search.set") return { ...state, selectedSlot: undefined };
  if (command.type === "bank.placeholder.toggle" || command.type === "bank.slot.move") return state;
  return state;
}

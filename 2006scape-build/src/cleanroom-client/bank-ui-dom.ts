/**
 * Project Copper Lantern — DOM rendering binding for bank-ui.ts.
 *
 * The binding owns only DOM presentation and event translation. The caller must
 * route emitted BankPanelCommand values to the authoritative controller, then
 * call update() with the accepted BankViewModel.
 */

import {
  commandForPreset,
  createBankPanelModel,
  reduceBankPanelState,
  slotMoveCommand,
  type BankPanelCommand,
  type BankPanelModel,
  type BankPanelState,
  type BankQuantityPreset,
} from "./bank-ui";
import type { BankItemId, BankViewModel } from "./bank-system";

export type BankPanelCommandSink = (command: BankPanelCommand) => void;

export type BankPanelDomBinding = Readonly<{
  element: HTMLElement;
  update(bank: BankViewModel, state?: BankPanelState): void;
  destroy(): void;
}>;

const STYLE_ID = "copper-lantern-bank-panel-style";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

function quantityPresetLabel(preset: BankQuantityPreset): string {
  return preset === "all" ? "All" : preset;
}

function renderTab(model: BankPanelModel): string {
  return model.tabs.map((tab) => `
    <button class="cl-bank-tab${tab.selected ? " is-selected" : ""}" type="button" role="tab"
      aria-selected="${tab.selected}" data-bank-tab="${tab.id}">
      <span class="cl-bank-tab-label">${escapeHtml(tab.label)}</span>
      <span class="cl-bank-tab-count">${tab.occupiedSlots}/${tab.itemCount.toLocaleString()}</span>
    </button>`).join("");
}

function renderSlot(model: BankPanelModel): string {
  return model.slots.map((slot) => {
    const classes = [
      "cl-bank-slot",
      slot.empty ? "is-empty" : "",
      slot.placeholder ? "is-placeholder" : "",
      slot.selected ? "is-selected" : "",
      slot.noted ? "is-noted" : "",
    ].filter(Boolean).join(" ");
    const itemLabel = slot.itemName ? `${slot.itemName}, ${slot.quantity.toLocaleString()}` : slot.placeholder ? "Placeholder" : "Empty bank slot";
    const badge = slot.stackBadge ? `<span class="cl-bank-stack-badge" aria-label="${escapeHtml(slot.stackBadge.accessibleLabel)}">${escapeHtml(slot.stackBadge.text)}</span>` : "";
    const icon = slot.itemId ? escapeHtml(slot.itemId.slice(0, 2).toUpperCase()) : slot.placeholder ? "·" : "";
    return `<button class="${classes}" type="button" draggable="${slot.draggable}" aria-label="${escapeHtml(itemLabel)}" data-bank-slot="${slot.slot}">
      <span class="cl-bank-slot-icon" aria-hidden="true">${icon}</span>${badge}
    </button>`;
  }).join("");
}

export function renderBankPanelHtml(model: BankPanelModel): string {
  const selected = model.selectedItem;
  const selectedLabel = selected ? `${selected.itemId} × ${selected.quantity.toLocaleString()}` : "No item selected";
  return `<section class="cl-bank-panel" aria-label="${escapeHtml(model.title)}">
    <header class="cl-bank-header">
      <div><p class="cl-bank-eyebrow">COPPER LANTERN / SECURE STORAGE</p><h2>${escapeHtml(model.title)}</h2></div>
      <div class="cl-bank-totals"><strong>${model.totalItemCount.toLocaleString()}</strong><span>items</span><strong>${model.totalFreeSlots}</strong><span>free slots</span></div>
    </header>
    <div class="cl-bank-toolbar">
      <label class="cl-bank-search"><span aria-hidden="true">⌕</span><input type="search" value="${escapeHtml(model.searchQuery)}" placeholder="Search bank" aria-label="Search bank" data-bank-search /></label>
      <button class="cl-bank-mode ${model.mode === "deposit" ? "is-selected" : ""}" type="button" data-bank-mode="${model.mode === "deposit" ? "bank" : "deposit"}">${model.mode === "deposit" ? "View bank" : "Deposit mode"}</button>
    </div>
    <nav class="cl-bank-tabs" role="tablist" aria-label="Bank tabs">${renderTab(model)}</nav>
    <div class="cl-bank-body"><div class="cl-bank-grid" role="grid" aria-label="${escapeHtml(model.tabs.find((tab) => tab.selected)?.label ?? "Bank items")}">${renderSlot(model)}</div></div>
    <footer class="cl-bank-footer">
      <div class="cl-bank-selection"><span class="cl-bank-selection-label">Selected</span><strong>${escapeHtml(selectedLabel)}</strong></div>
      <div class="cl-bank-actions">${selected ? model.quantityPresets.map((preset) => `<button type="button" class="cl-bank-quantity" data-bank-withdraw="${escapeHtml(selected.itemId)}" data-bank-quantity="${preset}">${quantityPresetLabel(preset)}</button>`).join("") : ""}</div>
      <p class="cl-bank-hint">${escapeHtml(model.commandHint)}</p>
    </footer>
  </section>`;
}

function ensureStyles(documentRef: Document): void {
  if (documentRef.getElementById(STYLE_ID)) return;
  const style = documentRef.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .cl-bank-panel{box-sizing:border-box;width:min(760px,calc(100vw - 32px));color:#eee7d7;background:linear-gradient(145deg,#171b22,#0c0f14);border:1px solid #9b7a42;border-radius:14px;box-shadow:0 20px 70px #000b,0 0 0 1px #dfbc7133 inset;font:14px/1.35 ui-sans-serif,system-ui,sans-serif;overflow:hidden}
    .cl-bank-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:linear-gradient(90deg,#252b36,#151921);border-bottom:1px solid #6f572f}.cl-bank-eyebrow{margin:0 0 3px;color:#d7ad5e;font-size:10px;letter-spacing:.16em}.cl-bank-header h2{margin:0;font:600 22px Georgia,serif}.cl-bank-totals{display:grid;grid-template-columns:auto auto;gap:0 8px;text-align:right;color:#aeb6bd;font-size:11px}.cl-bank-totals strong{color:#f1d08a;font-size:14px}.cl-bank-toolbar{display:flex;gap:10px;padding:12px 18px;background:#10141a}.cl-bank-search{display:flex;align-items:center;gap:8px;flex:1;padding:7px 10px;background:#090c10;border:1px solid #39424d;border-radius:7px;color:#d7ad5e}.cl-bank-search input{width:100%;border:0;outline:0;background:transparent;color:#f3eee4}.cl-bank-mode,.cl-bank-tab,.cl-bank-quantity{border:1px solid #5b4b32;background:#242a32;color:#e6dcc7;border-radius:6px;cursor:pointer}.cl-bank-mode{padding:0 12px}.cl-bank-mode.is-selected,.cl-bank-tab.is-selected{border-color:#d7ad5e;color:#f5d48a;background:#49391f}.cl-bank-tabs{display:flex;gap:5px;padding:9px 14px;background:#171c23;overflow-x:auto}.cl-bank-tab{display:flex;flex-direction:column;min-width:66px;padding:6px 8px;text-align:left}.cl-bank-tab-label{font-size:12px}.cl-bank-tab-count{color:#9ba4ab;font-size:10px}.cl-bank-body{padding:14px;background:#0d1116}.cl-bank-grid{display:grid;grid-template-columns:repeat(10,minmax(42px,1fr));gap:5px;max-height:420px;overflow:auto;padding:3px}.cl-bank-slot{position:relative;aspect-ratio:1;border:1px solid #313943;border-radius:5px;background:linear-gradient(145deg,#1d242c,#12171d);color:#d7ad5e;cursor:pointer}.cl-bank-slot:hover,.cl-bank-slot.is-selected{border-color:#efd18b;box-shadow:0 0 0 2px #d7ad5e44}.cl-bank-slot.is-empty{background:#11161c;color:#39424b}.cl-bank-slot.is-placeholder{border-style:dashed;color:#7f6d4c}.cl-bank-slot-icon{font-size:13px;font-weight:700}.cl-bank-stack-badge{position:absolute;right:3px;bottom:2px;padding:0 3px;border-radius:3px;background:#050608dd;color:#fff3c5;font-size:10px}.cl-bank-footer{display:grid;grid-template-columns:1fr auto;gap:5px 12px;padding:12px 18px;background:#171c23;border-top:1px solid #6f572f}.cl-bank-selection{display:flex;flex-direction:column}.cl-bank-selection-label{color:#929ba4;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.cl-bank-actions{display:flex;gap:5px;align-items:end}.cl-bank-quantity{padding:6px 10px}.cl-bank-hint{grid-column:1/-1;margin:4px 0 0;color:#929ba4;font-size:11px}
    @media(max-width:560px){.cl-bank-header{padding:14px}.cl-bank-totals{display:none}.cl-bank-grid{grid-template-columns:repeat(6,minmax(38px,1fr))}.cl-bank-footer{grid-template-columns:1fr}.cl-bank-actions{align-items:stretch}.cl-bank-quantity{flex:1}}
  `;
  documentRef.head.appendChild(style);
}

export function mountBankPanel(
  host: HTMLElement,
  bank: BankViewModel,
  onCommand: BankPanelCommandSink,
  initialState: BankPanelState = { mode: "bank" },
): BankPanelDomBinding {
  const documentRef = host.ownerDocument;
  ensureStyles(documentRef);
  let currentBank = bank;
  let currentState = initialState;
  let draggedSlot: number | undefined;
  const element = documentRef.createElement("div");
  host.appendChild(element);

  const update = (nextBank: BankViewModel, nextState = currentState): void => {
    currentBank = nextBank;
    currentState = nextState;
    const model = createBankPanelModel(currentBank, currentState);
    element.innerHTML = renderBankPanelHtml(model);
  };

  const emit = (command: BankPanelCommand): void => {
    currentState = reduceBankPanelState(currentState, command);
    onCommand(command);
  };

  element.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const tab = target.closest<HTMLElement>("[data-bank-tab]")?.dataset.bankTab;
    if (tab !== undefined) return emit({ type: "bank.tab.select", tab: Number(tab) as BankPanelModel["activeTab"] });
    const mode = target.closest<HTMLElement>("[data-bank-mode]")?.dataset.bankMode;
    if (mode === "bank" || mode === "deposit") return emit({ type: "bank.mode.set", mode });
    const withdraw = target.closest<HTMLElement>("[data-bank-withdraw]");
    if (withdraw?.dataset.bankWithdraw && withdraw.dataset.bankQuantity) {
      const model = createBankPanelModel(currentBank, currentState);
      const available = model.selectedItem?.quantity ?? 0;
      return emit(commandForPreset("withdraw", withdraw.dataset.bankWithdraw as BankItemId, withdraw.dataset.bankQuantity as BankQuantityPreset, available));
    }
    const slot = target.closest<HTMLElement>("[data-bank-slot]")?.dataset.bankSlot;
    if (slot !== undefined) currentState = { ...currentState, selectedSlot: Number(slot) };
    update(currentBank, currentState);
  });

  element.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.matches("[data-bank-search]")) emit({ type: "bank.search.set", query: target.value });
  });

  element.addEventListener("dragstart", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-bank-slot]");
    if (target) draggedSlot = Number(target.dataset.bankSlot);
  });
  element.addEventListener("dragover", (event) => { if ((event.target as HTMLElement).closest("[data-bank-slot]")) event.preventDefault(); });
  element.addEventListener("drop", (event) => {
    event.preventDefault();
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-bank-slot]");
    const to = target ? Number(target.dataset.bankSlot) : undefined;
    const command = draggedSlot !== undefined && to !== undefined ? slotMoveCommand(currentBank.activeTab, draggedSlot, to) : undefined;
    draggedSlot = undefined;
    if (command) emit(command);
  });

  update(bank, initialState);
  return { element, update, destroy: () => { element.remove(); } };
}

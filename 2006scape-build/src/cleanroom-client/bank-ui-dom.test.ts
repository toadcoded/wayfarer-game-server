import { BankLedger } from "./bank-system";
import { createBankPanelModel } from "./bank-ui";
import { renderBankPanelHtml } from "./bank-ui-dom";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function main(): void {
  const ledger = new BankLedger([
    { itemId: "coins", quantity: 2_500_000 },
    { itemId: "copper-ore", quantity: 12, tab: 1 },
  ]);
  const html = renderBankPanelHtml(createBankPanelModel(ledger.view()));
  assert(html.includes('aria-label="Copper Lantern Bank"'), "panel has an accessible label");
  assert(html.includes('role="tablist"'), "tabs use tablist semantics");
  assert(html.includes('data-bank-tab="0"'), "main tab is rendered");
  assert(html.includes('data-bank-slot="0"'), "bank slots are rendered");
  assert(html.includes('2M'), "compact stack badge is rendered");
  assert(html.includes("2,500,000 items"), "exact stack quantity is rendered accessibly");
  assert(html.includes('data-bank-search'), "search binding is rendered");
  assert(html.includes('data-bank-mode="deposit"'), "deposit mode binding is rendered");
  console.log("bank-ui-dom: all assertions passed");
}

main();

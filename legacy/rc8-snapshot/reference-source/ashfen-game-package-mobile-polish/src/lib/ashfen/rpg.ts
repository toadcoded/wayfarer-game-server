import type { SkillId } from "./world.ts";

export const EQUIPMENT_SLOTS = ["head", "body", "legs", "hands", "feet", "weapon", "offHand", "talisman"] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
export type StatKey = "maxHp" | "strike" | "guard" | "reedcut" | "delve" | "angle" | "binding";
export type ItemDef = { id: string; name: string; category: "material" | "consumable" | "gear" | "apparel" | "book"; value: number; stackable: boolean; slot?: EquipmentSlot; bonuses?: Partial<Record<StatKey, number>>; protected?: boolean };
export type Equipment = Record<EquipmentSlot, string | null>;
export type PvpStatus = { kind: "unskulled" } | { kind: "skulled"; appliedAtTick: number; expiresAtTick: number; reason: "unprovoked-attack" | "retaliation-window" };
export type ZoneRule = "safe" | "wilderness";
export type RiskEntry = { id: string; name: string; qty: number; value: number; protected: boolean };
export type DeathRisk = { keep: RiskEntry[]; lose: RiskEntry[]; lostGold: number; totalRisk: number };
export type CraftingItem = { id: string; name: string; qty: number };
export type CraftingRecipe = { id: string; name: string; resultId: string; resultQty: number; ingredients: Record<string, number> };
export type CraftResult = { ok: true; pack: CraftingItem[]; result: ItemDef } | { ok: false; reason: "unknown-recipe" | "missing-materials" | "invalid-result"; pack: CraftingItem[] };

export const EMPTY_EQUIPMENT: Equipment = { head: null, body: null, legs: null, hands: null, feet: null, weapon: null, offHand: null, talisman: null };
export const ITEM_CATALOG: Record<string, ItemDef> = {
  "reed-blade": { id: "reed-blade", name: "Reed blade", category: "gear", value: 80, stackable: false, slot: "weapon", bonuses: { strike: 1 } },
  "ash-staff": { id: "ash-staff", name: "Ash staff", category: "gear", value: 90, stackable: false, slot: "weapon", bonuses: { binding: 1 } },
  "mire-axe": { id: "mire-axe", name: "Mire axe", category: "gear", value: 75, stackable: false, slot: "weapon", bonuses: { reedcut: 2, strike: 1 } },
  "quarry-pick": { id: "quarry-pick", name: "Quarry pick", category: "gear", value: 75, stackable: false, slot: "weapon", bonuses: { delve: 2, strike: 1 } },
  "fisher-spear": { id: "fisher-spear", name: "Fisher spear", category: "gear", value: 85, stackable: false, slot: "weapon", bonuses: { angle: 2, strike: 1 } },
  "marsh-buckler": { id: "marsh-buckler", name: "Marsh buckler", category: "gear", value: 110, stackable: false, slot: "offHand", bonuses: { guard: 2 } },
  "lantern-of-ash": { id: "lantern-of-ash", name: "Lantern of Ash", category: "gear", value: 125, stackable: false, slot: "offHand", bonuses: { binding: 1, guard: 1 } },
  "mire-cowl": { id: "mire-cowl", name: "Mire cowl", category: "apparel", value: 60, stackable: false, slot: "head", bonuses: { guard: 1 } },
  "watch-hood": { id: "watch-hood", name: "Watch hood", category: "apparel", value: 100, stackable: false, slot: "head", bonuses: { guard: 2, angle: 1 } },
  "reedcoat": { id: "reedcoat", name: "Reedcoat", category: "apparel", value: 70, stackable: false, slot: "body", bonuses: { guard: 1 } },
  "fen-mail": { id: "fen-mail", name: "Fen mail", category: "apparel", value: 180, stackable: false, slot: "body", bonuses: { guard: 3, maxHp: 2 } },
  "wader-trousers": { id: "wader-trousers", name: "Wader trousers", category: "apparel", value: 65, stackable: false, slot: "legs", bonuses: { angle: 1, guard: 1 } },
  "bogguard-greaves": { id: "bogguard-greaves", name: "Bogguard greaves", category: "apparel", value: 145, stackable: false, slot: "legs", bonuses: { guard: 2, maxHp: 1 } },
  "delver-gloves": { id: "delver-gloves", name: "Delver gloves", category: "apparel", value: 55, stackable: false, slot: "hands", bonuses: { delve: 1 } },
  "lumber-gloves": { id: "lumber-gloves", name: "Lumber gloves", category: "apparel", value: 65, stackable: false, slot: "hands", bonuses: { reedcut: 1, strike: 1 } },
  "dock-boots": { id: "dock-boots", name: "Dock boots", category: "apparel", value: 45, stackable: false, slot: "feet", bonuses: { angle: 1 } },
  "marshwalkers": { id: "marshwalkers", name: "Marshwalkers", category: "apparel", value: 105, stackable: false, slot: "feet", bonuses: { angle: 2, guard: 1 } },
  "tithe-charm": { id: "tithe-charm", name: "Quiet Tithe charm", category: "gear", value: 150, stackable: false, slot: "talisman", bonuses: { maxHp: 3, binding: 1 }, protected: true },
  "mossward-token": { id: "mossward-token", name: "Mossward token", category: "gear", value: 95, stackable: false, slot: "talisman", bonuses: { guard: 1, delve: 1 } },
  "ration": { id: "ration", name: "Trail ration", category: "consumable", value: 6, stackable: true },
  "bandage": { id: "bandage", name: "Fen bandage", category: "consumable", value: 12, stackable: true },
  "raw-fish": { id: "raw-fish", name: "Raw mirefish", category: "material", value: 8, stackable: true },
  "ash-log": { id: "ash-log", name: "Ash log", category: "material", value: 10, stackable: true },
  "bogstone": { id: "bogstone", name: "Bogstone", category: "material", value: 14, stackable: true },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { id: "reed-blade", name: "Forge a reed blade", resultId: "reed-blade", resultQty: 1, ingredients: { "ash-log": 2, bogstone: 1 } },
  { id: "ash-staff", name: "Carve an ash staff", resultId: "ash-staff", resultQty: 1, ingredients: { "ash-log": 3, "raw-fish": 1 } },
  { id: "mire-axe", name: "Forge a mire axe", resultId: "mire-axe", resultQty: 1, ingredients: { "ash-log": 3, bogstone: 2 } },
  { id: "quarry-pick", name: "Forge a quarry pick", resultId: "quarry-pick", resultQty: 1, ingredients: { "ash-log": 2, bogstone: 3 } },
  { id: "fisher-spear", name: "Craft a fisher spear", resultId: "fisher-spear", resultQty: 1, ingredients: { "ash-log": 1, "raw-fish": 2, bogstone: 1 } },
  { id: "marsh-buckler", name: "Shape a marsh buckler", resultId: "marsh-buckler", resultQty: 1, ingredients: { "ash-log": 2, bogstone: 4 } },
  { id: "lantern-of-ash", name: "Build a lantern of Ash", resultId: "lantern-of-ash", resultQty: 1, ingredients: { "ash-log": 3, bogstone: 2 } },
  { id: "reedcoat", name: "Stitch a reedcoat", resultId: "reedcoat", resultQty: 1, ingredients: { "ash-log": 2, "raw-fish": 2 } },
  { id: "fen-mail", name: "Rivet fen mail", resultId: "fen-mail", resultQty: 1, ingredients: { "ash-log": 4, bogstone: 6 } },
  { id: "wader-trousers", name: "Sew wader trousers", resultId: "wader-trousers", resultQty: 1, ingredients: { "ash-log": 2, "raw-fish": 3 } },
  { id: "delver-gloves", name: "Make delver gloves", resultId: "delver-gloves", resultQty: 1, ingredients: { "raw-fish": 2, bogstone: 1 } },
  { id: "dock-boots", name: "Make dock boots", resultId: "dock-boots", resultQty: 1, ingredients: { "raw-fish": 3, "ash-log": 1 } },
  { id: "tithe-charm", name: "Bind a Quiet Tithe charm", resultId: "tithe-charm", resultQty: 1, ingredients: { bogstone: 5, "raw-fish": 2, "ash-log": 2 } },
];

export function craftRecipe(recipeId: string, inventory: CraftingItem[], catalog: Record<string, ItemDef> = ITEM_CATALOG): CraftResult {
  const recipe = CRAFTING_RECIPES.find((entry) => entry.id === recipeId);
  const pack = inventory.map((item) => ({ ...item }));
  if (!recipe) return { ok: false, reason: "unknown-recipe", pack };
  const result = catalog[recipe.resultId];
  if (!result) return { ok: false, reason: "invalid-result", pack };
  for (const [id, required] of Object.entries(recipe.ingredients)) {
    if ((pack.find((item) => item.id === id)?.qty ?? 0) < required) return { ok: false, reason: "missing-materials", pack: inventory.map((item) => ({ ...item })) };
  }
  for (const [id, required] of Object.entries(recipe.ingredients)) {
    const item = pack.find((entry) => entry.id === id);
    if (item) item.qty -= required;
  }
  const output = pack.find((item) => item.id === result.id);
  if (output) output.qty += recipe.resultQty;
  else pack.push({ id: result.id, name: result.name, qty: recipe.resultQty });
  return { ok: true, pack: pack.filter((item) => item.qty > 0), result };
}

export function deriveStats(skills: Partial<Record<SkillId, { level: number }>>, equipment: Equipment, catalog: Record<string, ItemDef>, effects: Partial<Record<StatKey, number>> = {}): Record<StatKey, number> {
  const stats: Record<StatKey, number> = { maxHp: Math.max(1, skills.Vitality?.level ?? 1), strike: skills.Strike?.level ?? 1, guard: skills.Guard?.level ?? 1, reedcut: skills.Reedcut?.level ?? 1, delve: skills.Delve?.level ?? 1, angle: skills.Angle?.level ?? 1, binding: skills.Binding?.level ?? 1 };
  for (const id of Object.values(equipment)) {
    if (!id) continue;
    for (const [key, value] of Object.entries(catalog[id]?.bonuses ?? {})) stats[key as StatKey] += typeof value === "number" ? value : 0;
  }
  for (const [key, value] of Object.entries(effects)) stats[key as StatKey] += value ?? 0;
  return stats;
}

export function previewDeathRisk(items: RiskEntry[], gold: number, pvp: PvpStatus, zone: ZoneRule): DeathRisk {
  if (zone === "safe") return { keep: [...items], lose: [], lostGold: 0, totalRisk: 0 };
  const protectedCount = pvp.kind === "unskulled" ? 3 : 0;
  const eligible = items.filter((item) => !item.protected).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const keepIds = new Set([...items.filter((item) => item.protected), ...eligible.slice(0, protectedCount)] .map((item) => item.id));
  const keep = items.filter((item) => keepIds.has(item.id));
  const lose = items.filter((item) => !keepIds.has(item.id));
  return { keep, lose, lostGold: gold, totalRisk: lose.reduce((sum, item) => sum + item.value * item.qty, 0) + gold };
}

export function isSkullActive(status: PvpStatus, tick: number): boolean { return status.kind === "skulled" && tick < status.expiresAtTick; }

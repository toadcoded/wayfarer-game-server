/**
 * Project Copper Lantern — world resources, tools, harvestables, and props.
 *
 * Resource nodes are authored content with deterministic positions and typed
 * requirements. Harvesting returns item rewards; a server should persist node
 * cooldowns and inventory changes atomically.
 */

export type ResourceBiome = "welcome-garden" | "frostcrown" | "sunwash-coast" | "gloamfen" | "redglass" | "highland" | "deepwood" | "ruinfield";
export type ResourceKind = "ore-vein" | "tree" | "crop-patch" | "herb-cluster" | "fungus-patch" | "fishing-spot" | "clay-bank" | "crystal-cluster" | "scrap-pile" | "fallen-log" | "water-barrel" | "tool-rack" | "campfire" | "crate";
export type ResourceTool = "bronze-pickaxe" | "iron-pickaxe" | "steel-pickaxe" | "bronze-hatchet" | "iron-hatchet" | "steel-hatchet" | "fishing-net" | "fishing-rod" | "spade" | "knife" | "herb-sickle" | "empty-hands";
export type ResourceItemId = "copper-ore" | "tin-ore" | "iron-ore" | "coal" | "mithril-ore" | "gold-ore" | "silver-ore" | "pine-log" | "willow-log" | "yew-log" | "magic-log" | "driftwood" | "reed-bundle" | "marsh-herb" | "snow-berry" | "desert-cactus-fruit" | "gloam-fungus" | "raw-shrimp" | "raw-lobster" | "clay" | "quartz" | "red-crystal" | "scrap-metal" | "rope" | "tinderbox" | "empty-vial";

export type ResourceDefinition = Readonly<{
  id: string;
  name: string;
  kind: ResourceKind;
  biome: ResourceBiome;
  level: number;
  tool: ResourceTool;
  yieldItem: ResourceItemId;
  yieldQuantity: Readonly<{ min: number; max: number }>;
  respawnSeconds: number;
  description: string;
}>;

export type ResourceNode = Readonly<{
  id: string;
  resourceId: string;
  tile: Readonly<{ x: number; y: number }>;
  biome: ResourceBiome;
  elevation: number;
  rotation: number;
  scale: number;
  collision: boolean;
  interaction: "harvest" | "inspect" | "use";
}>;

export type ResourceToolDefinition = Readonly<{ id: ResourceTool; name: string; power: number; actions: readonly ResourceKind[] }>;
export type ResourceHarvestResult = Readonly<{ ok: true; itemId: ResourceItemId; quantity: number; respawnSeconds: number }> | Readonly<{ ok: false; code: "NODE_NOT_FOUND" | "TOOL_REQUIRED" | "LEVEL_REQUIRED" | "COOLDOWN"; message: string }>;

export const RESOURCE_TOOLS: Readonly<Record<ResourceTool, ResourceToolDefinition>> = {
  "empty-hands": { id: "empty-hands", name: "Empty hands", power: 0, actions: ["water-barrel", "tool-rack", "campfire", "crate"] },
  "bronze-pickaxe": { id: "bronze-pickaxe", name: "Bronze pickaxe", power: 1, actions: ["ore-vein", "clay-bank"] },
  "iron-pickaxe": { id: "iron-pickaxe", name: "Iron pickaxe", power: 2, actions: ["ore-vein", "clay-bank", "crystal-cluster"] },
  "steel-pickaxe": { id: "steel-pickaxe", name: "Steel pickaxe", power: 3, actions: ["ore-vein", "clay-bank", "crystal-cluster"] },
  "bronze-hatchet": { id: "bronze-hatchet", name: "Bronze hatchet", power: 1, actions: ["tree", "fallen-log"] },
  "iron-hatchet": { id: "iron-hatchet", name: "Iron hatchet", power: 2, actions: ["tree", "fallen-log"] },
  "steel-hatchet": { id: "steel-hatchet", name: "Steel hatchet", power: 3, actions: ["tree", "fallen-log"] },
  "fishing-net": { id: "fishing-net", name: "Fishing net", power: 1, actions: ["fishing-spot"] },
  "fishing-rod": { id: "fishing-rod", name: "Fishing rod", power: 2, actions: ["fishing-spot"] },
  spade: { id: "spade", name: "Spade", power: 1, actions: ["crop-patch", "herb-cluster", "clay-bank"] },
  knife: { id: "knife", name: "Knife", power: 1, actions: ["fallen-log", "scrap-pile"] },
  "herb-sickle": { id: "herb-sickle", name: "Herb sickle", power: 2, actions: ["herb-cluster", "fungus-patch"] },
};

export const RESOURCE_DEFINITIONS: readonly ResourceDefinition[] = [
  { id: "copper-vein", name: "Copper ore vein", kind: "ore-vein", biome: "welcome-garden", level: 1, tool: "bronze-pickaxe", yieldItem: "copper-ore", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 45, description: "A beginner-friendly seam of warm copper." },
  { id: "tin-vein", name: "Tin ore vein", kind: "ore-vein", biome: "highland", level: 1, tool: "bronze-pickaxe", yieldItem: "tin-ore", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 50, description: "Soft tin threaded through pale highland stone." },
  { id: "iron-vein", name: "Iron ore vein", kind: "ore-vein", biome: "redglass", level: 5, tool: "iron-pickaxe", yieldItem: "iron-ore", yieldQuantity: { min: 1, max: 3 }, respawnSeconds: 75, description: "Dense iron beneath rust-colored cliffs." },
  { id: "coal-vein", name: "Coal seam", kind: "ore-vein", biome: "ruinfield", level: 8, tool: "iron-pickaxe", yieldItem: "coal", yieldQuantity: { min: 1, max: 3 }, respawnSeconds: 90, description: "Black fuel tucked between broken foundations." },
  { id: "gold-vein", name: "Gold ore vein", kind: "ore-vein", biome: "frostcrown", level: 15, tool: "steel-pickaxe", yieldItem: "gold-ore", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 180, description: "A bright trace beneath the snowline." },
  { id: "silver-vein", name: "Silver ore vein", kind: "ore-vein", biome: "frostcrown", level: 12, tool: "iron-pickaxe", yieldItem: "silver-ore", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 150, description: "Moon-bright metal in cold stone." },
  { id: "mithril-vein", name: "Mithril ore vein", kind: "ore-vein", biome: "deepwood", level: 30, tool: "steel-pickaxe", yieldItem: "mithril-ore", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 240, description: "A rare blue vein under ancient roots." },
  { id: "pine-tree", name: "Pine tree", kind: "tree", biome: "highland", level: 1, tool: "bronze-hatchet", yieldItem: "pine-log", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 60, description: "A resinous tree suited to first tools." },
  { id: "willow-tree", name: "Willow tree", kind: "tree", biome: "gloamfen", level: 15, tool: "iron-hatchet", yieldItem: "willow-log", yieldQuantity: { min: 1, max: 3 }, respawnSeconds: 80, description: "A water-loving tree bending over the marsh." },
  { id: "yew-tree", name: "Yew tree", kind: "tree", biome: "deepwood", level: 30, tool: "steel-hatchet", yieldItem: "yew-log", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 180, description: "Dark, durable timber from the deepwood." },
  { id: "magic-tree", name: "Magic tree", kind: "tree", biome: "ruinfield", level: 60, tool: "steel-hatchet", yieldItem: "magic-log", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 300, description: "A luminous tree growing through old stone." },
  { id: "reed-bed", name: "Reed bed", kind: "herb-cluster", biome: "gloamfen", level: 1, tool: "empty-hands", yieldItem: "reed-bundle", yieldQuantity: { min: 1, max: 3 }, respawnSeconds: 30, description: "Tall reeds useful for cordage and fletching." },
  { id: "marsh-herbs", name: "Marsh herb cluster", kind: "herb-cluster", biome: "gloamfen", level: 8, tool: "herb-sickle", yieldItem: "marsh-herb", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 55, description: "Medicinal leaves with a sharp wet scent." },
  { id: "snow-berry-bush", name: "Snow-berry bush", kind: "crop-patch", biome: "frostcrown", level: 5, tool: "spade", yieldItem: "snow-berry", yieldQuantity: { min: 1, max: 3 }, respawnSeconds: 50, description: "Bright berries growing near the snow cap." },
  { id: "cactus-fruit", name: "Cactus fruit patch", kind: "crop-patch", biome: "redglass", level: 3, tool: "empty-hands", yieldItem: "desert-cactus-fruit", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 45, description: "Careful harvesting yields sweet desert fruit." },
  { id: "gloam-fungus", name: "Gloam fungus patch", kind: "fungus-patch", biome: "gloamfen", level: 12, tool: "herb-sickle", yieldItem: "gloam-fungus", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 75, description: "Dimly glowing fungus beneath wet roots." },
  { id: "coast-fishing", name: "Sunwash fishing spot", kind: "fishing-spot", biome: "sunwash-coast", level: 1, tool: "fishing-net", yieldItem: "raw-shrimp", yieldQuantity: { min: 1, max: 4 }, respawnSeconds: 20, description: "Shallow water full of small coastal fish." },
  { id: "deep-fishing", name: "Deepwater fishing spot", kind: "fishing-spot", biome: "sunwash-coast", level: 20, tool: "fishing-rod", yieldItem: "raw-lobster", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 35, description: "A deeper channel where larger catches gather." },
  { id: "clay-bank", name: "Clay bank", kind: "clay-bank", biome: "welcome-garden", level: 1, tool: "spade", yieldItem: "clay", yieldQuantity: { min: 1, max: 3 }, respawnSeconds: 35, description: "Soft clay beside the garden watercourse." },
  { id: "quartz-cluster", name: "Quartz crystal cluster", kind: "crystal-cluster", biome: "redglass", level: 10, tool: "iron-pickaxe", yieldItem: "quartz", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 120, description: "Clear crystals catching the canyon light." },
  { id: "red-crystal-cluster", name: "Redglass crystal cluster", kind: "crystal-cluster", biome: "redglass", level: 25, tool: "steel-pickaxe", yieldItem: "red-crystal", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 180, description: "A rare crimson mineral from deep canyon walls." },
  { id: "scrap-pile", name: "Old scrap pile", kind: "scrap-pile", biome: "ruinfield", level: 1, tool: "knife", yieldItem: "scrap-metal", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 90, description: "Useful metal odds and ends around a collapsed camp." },
  { id: "fallen-log-resource", name: "Fallen log", kind: "fallen-log", biome: "deepwood", level: 1, tool: "knife", yieldItem: "driftwood", yieldQuantity: { min: 1, max: 2 }, respawnSeconds: 45, description: "Dry wood, rope fibers, and hidden insects." },
  { id: "water-barrel", name: "Water barrel", kind: "water-barrel", biome: "welcome-garden", level: 1, tool: "empty-hands", yieldItem: "empty-vial", yieldQuantity: { min: 1, max: 1 }, respawnSeconds: 10, description: "A refill point for empty travel vials." },
  { id: "tool-rack", name: "Community tool rack", kind: "tool-rack", biome: "welcome-garden", level: 1, tool: "empty-hands", yieldItem: "rope", yieldQuantity: { min: 1, max: 1 }, respawnSeconds: 15, description: "A starter rack with rope and basic supplies." },
  { id: "campfire-scraps", name: "Campfire", kind: "campfire", biome: "welcome-garden", level: 1, tool: "empty-hands", yieldItem: "tinderbox", yieldQuantity: { min: 1, max: 1 }, respawnSeconds: 30, description: "A safe place to inspect cooking and fire tools." },
];

function hash32(value: string): number { let hash = 2166136261; for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function random01(seed: number): number { let value = seed + 0x6D2B79F5; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; }

const RESOURCE_REGIONS: ReadonlyArray<{ biome: ResourceBiome; minX: number; minY: number; maxX: number; maxY: number }> = [
  { biome: "welcome-garden", minX: -4, minY: 4, maxX: 16, maxY: 20 }, { biome: "frostcrown", minX: 5, minY: 20, maxX: 20, maxY: 32 }, { biome: "sunwash-coast", minX: 0, minY: 33, maxX: 24, maxY: 44 }, { biome: "gloamfen", minX: 25, minY: 4, maxX: 40, maxY: 30 }, { biome: "redglass", minX: -20, minY: 3, maxX: -1, maxY: 33 }, { biome: "highland", minX: -48, minY: -18, maxX: -22, maxY: 8 }, { biome: "deepwood", minX: 42, minY: -14, maxX: 62, maxY: 20 }, { biome: "ruinfield", minX: -58, minY: 36, maxX: -26, maxY: 72 },
];

export function generateResourceNodes(seedText: string, density = 0.34): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  for (const region of RESOURCE_REGIONS) {
    const definitions = RESOURCE_DEFINITIONS.filter((definition) => definition.biome === region.biome);
    const count = Math.max(definitions.length, Math.floor((region.maxX - region.minX + 1) * (region.maxY - region.minY + 1) * density * 0.035));
    for (let index = 0; index < count; index += 1) {
      const seed = hash32(`${seedText}:${region.biome}:resource:${index}`);
      const definition = index < definitions.length ? definitions[index] : definitions[Math.floor(random01(seed) * definitions.length) % definitions.length];
      nodes.push({ id: `resource-node-${region.biome}-${index}`, resourceId: definition.id, tile: { x: region.minX + Math.floor(random01(seed + 1) * (region.maxX - region.minX + 1)), y: region.minY + Math.floor(random01(seed + 2) * (region.maxY - region.minY + 1)) }, biome: region.biome, elevation: Math.round(random01(seed + 3) * 18 * 100) / 100, rotation: random01(seed + 4) * Math.PI * 2, scale: 0.8 + random01(seed + 5) * 0.65, collision: !["herb-cluster", "fungus-patch", "crop-patch", "fishing-spot", "scrap-pile"].includes(definition.kind), interaction: ["water-barrel", "tool-rack", "campfire"].includes(definition.kind) ? "use" : definition.kind === "ore-vein" || definition.kind === "tree" || definition.kind === "clay-bank" || definition.kind === "crystal-cluster" ? "harvest" : "inspect" });
    }
  }
  return nodes;
}

export function harvestResource(node: ResourceNode, tool: ResourceTool, skillLevel: number, nowSeconds: number, lastHarvestSeconds = -Infinity): ResourceHarvestResult {
  const definition = RESOURCE_DEFINITIONS.find((candidate) => candidate.id === node.resourceId);
  if (!definition) return { ok: false, code: "NODE_NOT_FOUND", message: "That resource node is not registered." };
  if (nowSeconds - lastHarvestSeconds < definition.respawnSeconds) return { ok: false, code: "COOLDOWN", message: "That resource is still replenishing." };
  const toolDefinition = RESOURCE_TOOLS[tool];
  if (!toolDefinition.actions.includes(definition.kind)) return { ok: false, code: "TOOL_REQUIRED", message: `${definition.name} requires a different tool.` };
  if (skillLevel < definition.level) return { ok: false, code: "LEVEL_REQUIRED", message: `You need level ${definition.level} to harvest ${definition.name}.` };
  const range = definition.yieldQuantity.max - definition.yieldQuantity.min + 1;
  const quantity = definition.yieldQuantity.min + (hash32(`${node.id}:${nowSeconds}`) % range);
  return { ok: true, itemId: definition.yieldItem, quantity, respawnSeconds: definition.respawnSeconds };
}

export function resourceDefinition(resourceId: string): ResourceDefinition | undefined { return RESOURCE_DEFINITIONS.find((definition) => definition.id === resourceId); }

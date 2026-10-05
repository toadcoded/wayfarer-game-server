/**
 * Project Copper Lantern — context-aware NPC conversation and trade logic.
 *
 * Dialogue is data-driven. A server can persist NpcInteractionState after each
 * accepted choice; the client only presents options returned by this engine.
 */

export type NpcId = "mara-bankkeeper" | "orin-guide" | "veska-marsh-trader" | "calder-mountain-warden";
export type NpcMood = "welcoming" | "suspicious" | "amused" | "worried" | "proud";
export type NpcTopic = "greeting" | "help" | "world" | "trade" | "quest" | "farewell";
export type NpcItemId = "coins" | "lobster" | "brass-armour" | "teleport-rune" | "copper-lantern" | "fungal-tonic" | "snow-berry";

export type NpcPersonality = Readonly<{
  warmth: number;
  courage: number;
  greed: number;
  curiosity: number;
  patience: number;
  mood: NpcMood;
}>;

export type NpcContext = Readonly<{
  timeOfDay: "dawn" | "day" | "dusk" | "night";
  biome: "welcome-garden" | "mountain" | "beach" | "marsh" | "xeriscape";
  playerReputation: number;
  questFlags: Readonly<Record<string, boolean>>;
  inventory: Readonly<Record<string, number>>;
  bankOpen: boolean;
}>;

export type NpcTradeOffer = Readonly<{
  id: string;
  itemId: NpcItemId;
  itemName: string;
  quantity: number;
  priceCoins: number;
  direction: "buy-from-npc" | "sell-to-npc";
  requiresFlag?: string;
}>;

export type NpcDialogueCondition = Readonly<{
  minReputation?: number;
  biome?: NpcContext["biome"];
  timeOfDay?: NpcContext["timeOfDay"];
  requiredFlag?: string;
  requiredItem?: string;
  bankOpen?: boolean;
}>;

export type NpcDialogueNode = Readonly<{
  id: string;
  topic: NpcTopic;
  text: string;
  mood?: NpcMood;
  conditions?: NpcDialogueCondition;
  options: readonly NpcDialogueOption[];
}>;

export type NpcDialogueOption = Readonly<{
  id: string;
  label: string;
  nextNodeId: string;
  conditions?: NpcDialogueCondition;
  setFlag?: string;
  reputationDelta?: number;
  tradeOfferId?: string;
}>;

export type NpcDefinition = Readonly<{
  id: NpcId;
  name: string;
  title: string;
  personality: NpcPersonality;
  homeBiome: NpcContext["biome"];
  nodes: readonly NpcDialogueNode[];
  tradeOffers: readonly NpcTradeOffer[];
}>;

export type NpcInteractionState = Readonly<{
  npcId: NpcId;
  currentNodeId: string;
  visitedNodeIds: readonly string[];
  selectedTopics: readonly NpcTopic[];
  reputation: number;
  flags: Readonly<Record<string, boolean>>;
  offeredTradeId?: string;
  finished: boolean;
}>;

export type NpcOptionView = Readonly<{ id: string; label: string; tradeOffer?: NpcTradeOffer }>;
export type NpcConversationView = Readonly<{ npc: NpcDefinition; node: NpcDialogueNode; options: readonly NpcOptionView[]; state: NpcInteractionState }>;
export type NpcChoiceResult = Readonly<{ ok: true; conversation: NpcConversationView }> | Readonly<{ ok: false; code: "NPC_NOT_FOUND" | "NODE_NOT_FOUND" | "OPTION_UNAVAILABLE" | "TRADE_NOT_FOUND"; message: string }>;

function conditionPasses(condition: NpcDialogueCondition | undefined, context: NpcContext, state: NpcInteractionState): boolean {
  if (!condition) return true;
  if (condition.minReputation !== undefined && state.reputation < condition.minReputation) return false;
  if (condition.biome !== undefined && context.biome !== condition.biome) return false;
  if (condition.timeOfDay !== undefined && context.timeOfDay !== condition.timeOfDay) return false;
  if (condition.requiredFlag !== undefined && !state.flags[condition.requiredFlag] && !context.questFlags[condition.requiredFlag]) return false;
  if (condition.requiredItem !== undefined && (context.inventory[condition.requiredItem] ?? 0) <= 0) return false;
  if (condition.bankOpen !== undefined && context.bankOpen !== condition.bankOpen) return false;
  return true;
}

function cloneState(state: NpcInteractionState): NpcInteractionState {
  return { ...state, visitedNodeIds: [...state.visitedNodeIds], selectedTopics: [...state.selectedTopics], flags: { ...state.flags } };
}

export class NpcConversationEngine {
  private readonly definitions: ReadonlyMap<NpcId, NpcDefinition>;

  public constructor(definitions: readonly NpcDefinition[]) {
    this.definitions = new Map(definitions.map((definition) => [definition.id, definition]));
  }

  public begin(npcId: NpcId, context: NpcContext): NpcChoiceResult {
    const npc = this.definitions.get(npcId);
    if (!npc) return { ok: false, code: "NPC_NOT_FOUND", message: "That NPC is not available." };
    const first = npc.nodes.find((node) => node.topic === "greeting" && conditionPasses(node.conditions, context, this.initialState(npcId, npc))); 
    if (!first) return { ok: false, code: "NODE_NOT_FOUND", message: "That NPC has no available greeting." };
    const state: NpcInteractionState = { npcId, currentNodeId: first.id, visitedNodeIds: [first.id], selectedTopics: [first.topic], reputation: 0, flags: {}, finished: false };
    return { ok: true, conversation: this.view(npc, first, state, context) };
  }

  public choose(state: NpcInteractionState, optionId: string, context: NpcContext): NpcChoiceResult {
    const npc = this.definitions.get(state.npcId);
    if (!npc) return { ok: false, code: "NPC_NOT_FOUND", message: "That NPC is not available." };
    const current = npc.nodes.find((node) => node.id === state.currentNodeId);
    if (!current) return { ok: false, code: "NODE_NOT_FOUND", message: "The current dialogue node no longer exists." };
    const option = current.options.find((candidate) => candidate.id === optionId && conditionPasses(candidate.conditions, context, state));
    if (!option) return { ok: false, code: "OPTION_UNAVAILABLE", message: "That dialogue option is not available in this context." };
    const next = npc.nodes.find((node) => node.id === option.nextNodeId && conditionPasses(node.conditions, context, state));
    if (!next) return { ok: false, code: "NODE_NOT_FOUND", message: "That dialogue branch is unavailable." };
    const flags = { ...state.flags };
    if (option.setFlag) flags[option.setFlag] = true;
    const nextState: NpcInteractionState = {
      ...state,
      currentNodeId: next.id,
      visitedNodeIds: [...state.visitedNodeIds, next.id],
      selectedTopics: [...state.selectedTopics, next.topic],
      reputation: state.reputation + (option.reputationDelta ?? 0),
      finished: next.topic === "farewell",
      flags,
      offeredTradeId: option.tradeOfferId ?? state.offeredTradeId,
    };
    return { ok: true, conversation: this.view(npc, next, nextState, context) };
  }

  public trade(state: NpcInteractionState, offerId: string, context: NpcContext): NpcChoiceResult {
    const npc = this.definitions.get(state.npcId);
    if (!npc) return { ok: false, code: "NPC_NOT_FOUND", message: "That NPC is not available." };
    const offer = npc.tradeOffers.find((candidate) => candidate.id === offerId && (!candidate.requiresFlag || state.flags[candidate.requiresFlag] || context.questFlags[candidate.requiresFlag]));
    if (!offer) return { ok: false, code: "TRADE_NOT_FOUND", message: "That trade offer is unavailable." };
    const nextState: NpcInteractionState = { ...state, offeredTradeId: offer.id, flags: { ...state.flags }, visitedNodeIds: [...state.visitedNodeIds], selectedTopics: [...state.selectedTopics] };
    const node = npc.nodes.find((candidate) => candidate.id === state.currentNodeId);
    if (!node) return { ok: false, code: "NODE_NOT_FOUND", message: "The current dialogue node no longer exists." };
    return { ok: true, conversation: this.view(npc, node, nextState, context) };
  }

  private view(npc: NpcDefinition, node: NpcDialogueNode, state: NpcInteractionState, context: NpcContext): NpcConversationView {
    const options = node.options.filter((option) => conditionPasses(option.conditions, context, state)).map((option) => ({ id: option.id, label: option.label, tradeOffer: option.tradeOfferId ? npc.tradeOffers.find((offer) => offer.id === option.tradeOfferId) : undefined }));
    return { npc, node, options, state };
  }

  private initialState(npcId: NpcId, npc: NpcDefinition): NpcInteractionState {
    return { npcId, currentNodeId: npc.nodes[0]?.id ?? "", visitedNodeIds: [], selectedTopics: [], reputation: 0, flags: {}, finished: false };
  }
}

const COMMON_CONTEXT: NpcContext = { timeOfDay: "day", biome: "welcome-garden", playerReputation: 0, questFlags: {}, inventory: {}, bankOpen: false };

export const STARTER_NPCS: readonly NpcDefinition[] = [
  {
    id: "mara-bankkeeper",
    name: "Mara",
    title: "Welcome Garden bankkeeper",
    homeBiome: "welcome-garden",
    personality: { warmth: 0.86, courage: 0.42, greed: 0.32, curiosity: 0.64, patience: 0.9, mood: "welcoming" },
    tradeOffers: [],
    nodes: [
      { id: "mara-greeting", topic: "greeting", text: "Welcome, traveler. Your belongings are safer in a ledger than on a swamp path.", options: [
        { id: "mara-bank", label: "Show me my bank.", nextNodeId: "mara-bank-help", conditions: { bankOpen: false }, setFlag: "bank-introduced" },
        { id: "mara-how", label: "How do placeholders work?", nextNodeId: "mara-placeholder-help" },
        { id: "mara-bye", label: "Maybe later.", nextNodeId: "mara-farewell" },
      ] },
      { id: "mara-bank-help", topic: "help", text: "Use tabs to sort gear, search to find an item, and placeholders to remember where a withdrawn item belongs.", options: [{ id: "mara-trade", label: "What else can I do?", nextNodeId: "mara-trade-help" }, { id: "mara-bye-2", label: "Thanks.", nextNodeId: "mara-farewell" }] },
      { id: "mara-placeholder-help", topic: "help", text: "A placeholder keeps the slot and item identity after the last copy is withdrawn. It never creates a free item.", options: [{ id: "mara-bank-2", label: "Open the bank.", nextNodeId: "mara-bank-help", setFlag: "bank-introduced" }, { id: "mara-bye-3", label: "Understood.", nextNodeId: "mara-farewell" }] },
      { id: "mara-trade-help", topic: "trade", text: "I do not sell adventure, but I can help you organize it.", options: [{ id: "mara-bye-4", label: "Farewell.", nextNodeId: "mara-farewell" }] },
      { id: "mara-farewell", topic: "farewell", text: "Keep your valuables dry, and your route marked.", options: [] },
    ],
  },
  {
    id: "orin-guide",
    name: "Orin",
    title: "Realm wayfinder",
    homeBiome: "welcome-garden",
    personality: { warmth: 0.72, courage: 0.88, greed: 0.18, curiosity: 0.92, patience: 0.58, mood: "proud" },
    tradeOffers: [{ id: "orin-lantern", itemId: "copper-lantern", itemName: "Copper lantern", quantity: 1, priceCoins: 50, direction: "buy-from-npc", requiresFlag: "heard-about-routes" }],
    nodes: [
      { id: "orin-greeting", topic: "greeting", text: "The realm is wider than the garden gate. Which horizon interests you?", options: [
        { id: "orin-mountain", label: "Tell me about the snowcap mountain.", nextNodeId: "orin-mountain", setFlag: "heard-about-routes", reputationDelta: 1 },
        { id: "orin-marsh", label: "Tell me about the eastern marsh.", nextNodeId: "orin-marsh", setFlag: "heard-about-routes" },
        { id: "orin-trade", label: "Show route supplies.", nextNodeId: "orin-trade", conditions: { minReputation: 1 }, tradeOfferId: "orin-lantern" },
        { id: "orin-bye", label: "I will explore myself.", nextNodeId: "orin-farewell" },
      ] },
      { id: "orin-mountain", topic: "world", text: "Frostcrown rises in four walkable ramps. Follow the switchback past the snowline and the summit will meet you.", options: [{ id: "orin-supply", label: "I need a lantern.", nextNodeId: "orin-trade", tradeOfferId: "orin-lantern" }, { id: "orin-bye-2", label: "Good to know.", nextNodeId: "orin-farewell" }] },
      { id: "orin-marsh", topic: "world", text: "Gloamfen is wet, dim, and alive. Bridges are safer than blackwater, and the caves echo before they answer.", options: [{ id: "orin-bye-3", label: "I will remember that.", nextNodeId: "orin-farewell" }] },
      { id: "orin-trade", topic: "trade", text: "A copper lantern makes bridges, caves, and marsh fog much less argumentative.", options: [{ id: "orin-bye-4", label: "Thanks for the advice.", nextNodeId: "orin-farewell" }] },
      { id: "orin-farewell", topic: "farewell", text: "May your compass stay honest.", options: [] },
    ],
  },
];

export const DEFAULT_NPC_CONTEXT = COMMON_CONTEXT;
export const STARTER_NPC_ENGINE = new NpcConversationEngine(STARTER_NPCS);

import type { Intent } from "./protocol.ts";
import type { ResourceNode, SkillId } from "./world.ts";
import { NPCS, SKILLS, seedNodes } from "./world.ts";
import { canGather } from "./skills.ts";
import {
  dialogueFor,
  freshQuietTithe,
  nextTithePhase,
  recordOffering,
  TITHE_REQUIREMENTS,
  type QuietTithe,
} from "./quests.ts";
import { CRAFTING_RECIPES, ITEM_CATALOG, craftRecipe } from "./rpg.ts";

export type PackItem = { id: string; name: string; qty: number };
export type Grant = { itemId: string; name: string; qty: number };
export type XpGrant = { skill: SkillId; amount: number };
export type TitheSyncStatus = "idle" | "pending" | "accepted" | "rejected";

export type ReduceCtx = {
  pack: PackItem[];
  skills: Record<SkillId, { level: number; xp: number }>;
  tithe: QuietTithe;
  rewardGranted: boolean;
  nodes: ResourceNode[];
  now: number;
};

export type CommandResult = {
  ok: boolean;
  say: string;
  grants: Grant[];
  xp: XpGrant[];
  consume: Grant[];
  talk?: { npc: string; line: string };
  panel?: "pack" | "codex" | null;
  nodeCooldown?: { id: string; cooldownMs: number };
  tithe: QuietTithe;
  rewardGranted: boolean;
  goldDelta: number;
};

const EMPTY: Pick<CommandResult, "grants" | "xp" | "consume" | "goldDelta"> = {
  grants: [],
  xp: [],
  consume: [],
  goldDelta: 0,
};

export function emptyCtx(now = 0): ReduceCtx {
  const skills = {} as ReduceCtx["skills"];
  for (const id of SKILLS) {
    skills[id] = { level: id === "Vitality" ? 10 : 1, xp: 0 };
  }
  return {
    pack: [],
    skills,
    tithe: freshQuietTithe(),
    rewardGranted: false,
    nodes: seedNodes(),
    now,
  };
}

function qtyOf(pack: PackItem[], id: string) {
  return pack.find((item) => item.id === id)?.qty ?? 0;
}

function hasItem(pack: PackItem[], id: string) {
  return qtyOf(pack, id) > 0;
}

function flavorGather(kind: ResourceNode["kind"]) {
  if (kind === "tree") return "Reedwood taken. The stump will answer later.";
  if (kind === "ore") return "Ash ore. Grey rocks remember the strike.";
  return "A reed perch. The pond is patient.";
}

function flavorStrike(pack: PackItem[]) {
  if (hasItem(pack, "ember-wand") || hasItem(pack, "ash-staff") || hasItem(pack, "staff")) {
    return "Arcane spark. The mireling falls. Fibre for the Codex.";
  }
  if (hasItem(pack, "ash-bow")) {
    return "An ash arrow finds the reed. Fibre for the Codex.";
  }
  return "The reed blade bites. Fibre for the Codex.";
}

function reject(ctx: ReduceCtx, say: string): CommandResult {
  return { ok: false, say, ...EMPTY, tithe: ctx.tithe, rewardGranted: ctx.rewardGranted };
}

function accept(ctx: ReduceCtx, say: string, extra: Partial<CommandResult> = {}): CommandResult {
  return {
    ok: true,
    say,
    ...EMPTY,
    tithe: extra.tithe ?? ctx.tithe,
    rewardGranted: extra.rewardGranted ?? ctx.rewardGranted,
    ...extra,
  };
}

export function foldCtx(ctx: ReduceCtx, result: CommandResult): ReduceCtx {
  let pack = ctx.pack.map((item) => ({ ...item }));
  for (const spent of result.consume) {
    const hit = pack.find((item) => item.id === spent.itemId);
    if (hit) hit.qty -= spent.qty;
  }
  for (const grant of result.grants) {
    const hit = pack.find((item) => item.id === grant.itemId);
    if (hit) hit.qty += grant.qty;
    else pack.push({ id: grant.itemId, name: grant.name, qty: grant.qty });
  }
  pack = pack.filter((item) => item.qty > 0);
  const nodes = ctx.nodes.map((node) => {
    if (result.nodeCooldown && node.id === result.nodeCooldown.id) {
      return { ...node, ready: false, readyAt: ctx.now + result.nodeCooldown.cooldownMs };
    }
    return { ...node };
  });
  return {
    pack,
    skills: ctx.skills,
    tithe: result.tithe,
    rewardGranted: result.rewardGranted,
    nodes,
    now: ctx.now,
  };
}

export function reduceCommand(intent: Intent, ctx: ReduceCtx): CommandResult {
  if (intent.kind === "move") return accept(ctx, "");
  if (intent.kind === "talk") return reduceTalk(intent.npcId, ctx);
  if (intent.kind === "use") return reduceUse(intent.itemId, ctx);
  if (intent.kind === "interact") {
    if (intent.action === "gather") return reduceGather(intent.targetId, ctx);
    if (intent.action === "strike") return reduceFibre(intent.targetId, ctx);
    if (intent.action === "talk") return reduceTalk(intent.targetId, ctx);
    if (intent.action === "craft") return reduceCraft(intent.targetId, ctx);
  }
  return reject(ctx, "The Keep does not know that command.");
}

function reduceTalk(npcId: string, ctx: ReduceCtx): CommandResult {
  const npc = NPCS.find((entry) => entry.id === npcId);
  if (!npc) return reject(ctx, "No one answers.");
  const spoken = dialogueFor(npcId, ctx.tithe);
  let tithe = ctx.tithe;
  let consume: Grant[] = [];
  let grants: Grant[] = [];
  let xp: XpGrant[] = [];
  let rewardGranted = ctx.rewardGranted;
  let goldDelta = 0;
  let panel: "pack" | "codex" | null = null;

  if (spoken.event === "bind") {
    const missing = TITHE_REQUIREMENTS.filter((req) => qtyOf(ctx.pack, req.itemId) < 1);
    if (missing.length) {
      return reject(ctx, "Bring the four offerings first.");
    }
    consume = TITHE_REQUIREMENTS.map((req) => ({
      itemId: req.itemId,
      name: ITEM_CATALOG[req.itemId]?.name ?? req.label,
      qty: 1,
    }));
    tithe = nextTithePhase(tithe, "bind");
    xp = [{ skill: "Binding", amount: 12 }];
  } else if (spoken.event) {
    tithe = nextTithePhase(tithe, spoken.event);
  }

  if (spoken.event === "report" && tithe.phase === "complete") {
    if (!rewardGranted && !hasItem(ctx.pack, "lantern-of-ash") && !hasItem(ctx.pack, "tithe-charm")) {
      grants = [
        { itemId: "lantern-of-ash", name: ITEM_CATALOG["lantern-of-ash"]!.name, qty: 1 },
        { itemId: "tithe-charm", name: ITEM_CATALOG["tithe-charm"]!.name, qty: 1 },
      ];
      goldDelta = 25;
      rewardGranted = true;
      xp = [...xp, { skill: "Lore", amount: 40 }, { skill: "Binding", amount: 18 }];
    } else {
      rewardGranted = true;
    }
  }

  if (npcId === "toller" && spoken.event !== "bind") panel = "pack";
  if (npcId === "wren") panel = "codex";

  return {
    ok: true,
    say: `${npc.name}: ${spoken.line}`,
    grants,
    xp,
    consume,
    talk: { npc: npc.name, line: spoken.line },
    panel,
    tithe,
    rewardGranted,
    goldDelta,
  };
}

function reduceGather(nodeId: string, ctx: ReduceCtx): CommandResult {
  const node = ctx.nodes.find((entry) => entry.id === nodeId);
  if (!node) return reject(ctx, "Nothing to work.");
  if (!node.ready) return reject(ctx, "Not yet. Watch the amber ring.");
  const skillId = node.kind === "tree" ? "Reedcut" : node.kind === "ore" ? "Delve" : "Angle";
  const check = canGather(node.kind, ctx.skills[skillId]?.level ?? 1, ctx.pack.map((item) => item.id));
  if (!check.ok || !check.script) return reject(ctx, check.reason ?? "Cannot work this node.");
  const script = check.script;
  const tithe = recordOffering(ctx.tithe, script.yieldItemId);
  return {
    ok: true,
    say: flavorGather(node.kind),
    grants: [{ itemId: script.yieldItemId, name: script.yieldName, qty: 1 }],
    xp: [{ skill: script.skill, amount: script.xp }],
    consume: [],
    nodeCooldown: { id: node.id, cooldownMs: script.cooldownMs },
    tithe,
    rewardGranted: ctx.rewardGranted,
    goldDelta: 0,
  };
}

function reduceFibre(_foeId: string, ctx: ReduceCtx): CommandResult {
  const tithe = recordOffering(ctx.tithe, "mire-fibre");
  return {
    ok: true,
    say: flavorStrike(ctx.pack),
    grants: [{ itemId: "mire-fibre", name: "Mire fibre", qty: 1 }],
    xp: [{ skill: "Strike", amount: 20 }],
    consume: [],
    tithe,
    rewardGranted: ctx.rewardGranted,
    goldDelta: 0,
  };
}

function reduceCraft(recipeId: string, ctx: ReduceCtx): CommandResult {
  const preview = craftRecipe(recipeId, ctx.pack);
  if (!preview.ok) {
    if (preview.reason === "missing-materials") return reject(ctx, "Not enough materials for that recipe.");
    if (preview.reason === "unknown-recipe") return reject(ctx, "No such binding.");
    return reject(ctx, "That recipe will not hold.");
  }
  const recipe = CRAFTING_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return reject(ctx, "No such binding.");
  return accept(ctx, `Crafted ${preview.result.name}.`, {
    consume: Object.entries(recipe.ingredients).map(([id, qty]) => ({
      itemId: id,
      name: ITEM_CATALOG[id]?.name ?? id,
      qty,
    })),
    grants: [{ itemId: preview.result.id, name: preview.result.name, qty: recipe.resultQty }],
    xp: [{ skill: "Binding", amount: 10 }],
    panel: "pack",
  });
}

function reduceUse(itemId: string, ctx: ReduceCtx): CommandResult {
  if (itemId === "tithe-lantern") {
    if (ctx.tithe.phase !== "light" || !ctx.tithe.bundle) {
      return reject(ctx, "The fountain waits for a bound Tithe.");
    }
    const tithe = nextTithePhase(ctx.tithe, "light");
    return {
      ok: true,
      say: "The Tithe Lantern takes. Reedhaven square remembers.",
      grants: [],
      xp: [{ skill: "Binding", amount: 24 }],
      consume: [],
      tithe,
      rewardGranted: ctx.rewardGranted,
      goldDelta: 0,
    };
  }
  return reject(ctx, "Nothing happens.");
}

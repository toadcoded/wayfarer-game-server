import { getRealm } from "./realm";
import { useGame, type GameSnap } from "./game-store";
import type { IntentDraft } from "./realm";
import type { CommandResult, ReduceCtx } from "./commands";
import { gatherDurationMs } from "./actions";
import { isLanternTile } from "./quests";

export { gatherDurationMs, isLanternTile };

export function snapshotFrom(st: GameSnap): ReduceCtx {
  return {
    pack: st.pack.map((item) => ({ ...item })),
    skills: st.skills,
    tithe: st.tithe,
    rewardGranted: st.titheReward,
    nodes: st.nodes.map((node) => ({ ...node })),
    now: typeof performance !== "undefined" ? performance.now() : Date.now(),
  };
}

export function commitIntent(draft: IntentDraft): CommandResult {
  const st = useGame.getState();
  const results = getRealm().dispatch(draft, snapshotFrom(st));
  let last: CommandResult | null = null;
  for (const result of results) {
    st.applyCommand(result);
    last = result;
  }
  return (
    last ?? {
      ok: false,
      say: "No command.",
      grants: [],
      xp: [],
      consume: [],
      tithe: st.tithe,
      rewardGranted: st.titheReward,
      goldDelta: 0,
    }
  );
}

export function beginTalk(npcId: string) {
  return commitIntent({ kind: "talk", npcId });
}

export function completeGather(nodeId: string) {
  return commitIntent({ kind: "interact", targetId: nodeId, action: "gather" });
}

export function completeFibre(foeId: string) {
  return commitIntent({ kind: "interact", targetId: foeId, action: "strike" });
}

export function completeCraft(recipeId: string) {
  return commitIntent({ kind: "interact", targetId: recipeId, action: "craft" });
}

export function lightLantern() {
  return commitIntent({ kind: "use", itemId: "tithe-lantern" });
}

export function markPending(text: string) {
  useGame.getState().setTitheSync({ status: "pending", text });
}

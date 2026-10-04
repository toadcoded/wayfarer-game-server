export type ActionKind = "woodcut" | "mine" | "fish" | "eat" | "attack" | "deflect";
export type ActionPhase = "windup" | "active" | "recover";
export type ActionState = { kind: ActionKind; phase: ActionPhase; targetId?: string; startedTick: number; impactTick: number; endsTick: number; nonce: number };

export const ACTION_BEATS: Record<ActionKind, { windup: number; active: number; recover: number }> = {
  woodcut: { windup: 1, active: 1, recover: 1 },
  mine: { windup: 1, active: 1, recover: 1 },
  fish: { windup: 2, active: 2, recover: 1 },
  eat: { windup: 1, active: 1, recover: 1 },
  attack: { windup: 1, active: 1, recover: 1 },
  deflect: { windup: 1, active: 2, recover: 1 },
};

export function beginAction(kind: ActionKind, tick: number, nonce: number, targetId?: string): ActionState {
  const beat = ACTION_BEATS[kind];
  return { kind, targetId, startedTick: tick, impactTick: tick + beat.windup, endsTick: tick + beat.windup + beat.active + beat.recover, nonce, phase: "windup" };
}

export function phaseAt(action: ActionState, tick: number): ActionPhase | null {
  if (tick < action.startedTick || tick >= action.endsTick) return null;
  if (tick < action.impactTick) return "windup";
  if (tick < action.endsTick - ACTION_BEATS[action.kind].recover) return "active";
  return "recover";
}

export function advanceAction(action: ActionState | null, tick: number): ActionState | null {
  if (!action) return null;
  const phase = phaseAt(action, tick);
  return phase ? { ...action, phase } : null;
}

export function actionProgress(action: ActionState | null, tick: number): number {
  if (!action) return 0;
  return Math.max(0, Math.min(1, (tick - action.startedTick) / Math.max(1, action.endsTick - action.startedTick)));
}

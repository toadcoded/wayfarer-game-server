/** Original PolyCodex protocol v1. Intent only — never client-asserted state. */

export const PROTOCOL_VERSION = "polycodex.intent.v1";
export const TICK_MS = 600;

export type IntentKind = "move" | "interact" | "use" | "talk";

export type MoveIntent = {
  v: typeof PROTOCOL_VERSION;
  id: string;
  kind: "move";
  x: number;
  y: number;
};

export type InteractIntent = {
  v: typeof PROTOCOL_VERSION;
  id: string;
  kind: "interact";
  targetId: string;
  action: "gather" | "strike" | "talk" | "craft";
};

export type UseIntent = {
  v: typeof PROTOCOL_VERSION;
  id: string;
  kind: "use";
  itemId: string;
};

export type TalkIntent = {
  v: typeof PROTOCOL_VERSION;
  id: string;
  kind: "talk";
  npcId: string;
};

export type Intent = MoveIntent | InteractIntent | UseIntent | TalkIntent;

export type RealmEvent = {
  tick: number;
  type: string;
  intentId: string;
  ok: boolean;
  detail?: string;
};

let seq = 0;
export function mintIntentId(): string {
  seq += 1;
  return `i${seq.toString(36)}-${Date.now().toString(36)}`;
}

export function isIntent(value: unknown): value is Intent {
  if (!value || typeof value !== "object") return false;
  const v = value as Intent;
  return v.v === PROTOCOL_VERSION && typeof v.id === "string" && typeof v.kind === "string";
}

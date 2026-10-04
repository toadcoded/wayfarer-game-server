export const EMOTES = ["wave", "cheer", "point", "shrug", "think", "laugh"] as const;
export type EmoteId = (typeof EMOTES)[number];
export type ActiveEmote = { id: EmoteId; nonce: number; startedTick: number; durationTicks: number } | null;
export const emoteLabel = (id: EmoteId) => id[0]!.toUpperCase() + id.slice(1);
export function beginEmote(id: EmoteId, tick: number, nonce: number): ActiveEmote { return { id, nonce, startedTick: tick, durationTicks: 4 }; }
export function advanceEmote(active: ActiveEmote, tick: number): ActiveEmote { return active && tick - active.startedTick < active.durationTicks ? active : null; }

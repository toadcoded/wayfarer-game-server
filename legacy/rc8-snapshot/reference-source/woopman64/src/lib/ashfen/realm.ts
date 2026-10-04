import { TICK_MS, mintIntentId, type Intent, type RealmEvent } from "./protocol";
import { mulberry32 } from "./rng";
import { applyJournal, stateHash, type JournalEntry, type RealmSnap } from "./replay";
import { foldCtx, reduceCommand, type CommandResult, type ReduceCtx } from "./commands";

export { TICK_MS };
export { emptyCtx } from "./commands";

const SEED = 2730;

export type IntentDraft =
  | { kind: "move"; x: number; y: number }
  | { kind: "interact"; targetId: string; action: "gather" | "strike" | "talk" | "craft" }
  | { kind: "use"; itemId: string }
  | { kind: "talk"; npcId: string };

export class LocalRealm {
  tick = 0;
  readonly seed = SEED;
  private rng = mulberry32(SEED);
  private queue: Intent[] = [];
  journal: RealmEvent[] = [];
  private seen = new Set<string>();

  enqueue(draft: IntentDraft & { id?: string }): Intent {
    const full = {
      v: "polycodex.intent.v1" as const,
      id: draft.id ?? mintIntentId(),
      ...draft,
    } as Intent;
    this.queue.push(full);
    return full;
  }

  roll(): number {
    return this.rng();
  }

  /** Advance one 600ms logical tick. Move intents journal; gameplay commands reduce when a ctx is given. */
  step(ctx?: ReduceCtx): RealmEvent[] {
    this.tick += 1;
    const batch = this.queue.splice(0);
    const out: RealmEvent[] = [];
    let current = ctx;
    for (const intent of batch) {
      if (this.seen.has(intent.id)) {
        const ev: RealmEvent = {
          tick: this.tick,
          type: intent.kind,
          intentId: intent.id,
          ok: false,
          detail: "duplicate",
        };
        this.journal.push(ev);
        out.push(ev);
        continue;
      }
      this.seen.add(intent.id);
      if (current && intent.kind !== "move") {
        const result = reduceCommand(intent, current);
        current = foldCtx(current, result);
        const ev: RealmEvent = {
          tick: this.tick,
          type: intent.kind,
          intentId: intent.id,
          ok: result.ok,
          detail: result.say,
        };
        this.journal.push(ev);
        out.push(ev);
      } else {
        const ev: RealmEvent = {
          tick: this.tick,
          type: intent.kind,
          intentId: intent.id,
          ok: true,
        };
        this.journal.push(ev);
        out.push(ev);
      }
    }
    return out;
  }

  dispatch(draft: IntentDraft, ctx: ReduceCtx): CommandResult[] {
    this.enqueue(draft);
    this.tick += 1;
    const batch = this.queue.splice(0);
    const results: CommandResult[] = [];
    let current = ctx;
    for (const intent of batch) {
      if (this.seen.has(intent.id)) {
        results.push({
          ok: false,
          say: "Already kept.",
          grants: [],
          xp: [],
          consume: [],
          tithe: current.tithe,
          rewardGranted: current.rewardGranted,
          goldDelta: 0,
        });
        continue;
      }
      this.seen.add(intent.id);
      const result = reduceCommand(intent, current);
      current = foldCtx(current, result);
      this.journal.push({
        tick: this.tick,
        type: intent.kind,
        intentId: intent.id,
        ok: result.ok,
        detail: result.say,
      });
      results.push(result);
    }
    return results;
  }

  reset(seed = SEED) {
    this.tick = 0;
    this.rng = mulberry32(seed);
    this.queue = [];
    this.journal = [];
    this.seen.clear();
  }
}

let singleton: LocalRealm | null = null;

export function getRealm(): LocalRealm {
  if (!singleton) singleton = new LocalRealm();
  return singleton;
}

export async function realmGolden(): Promise<{ hash: string; ok: boolean; events: number }> {
  const snap: RealmSnap = { realmId: SEED, entities: [], events: [] };
  const journal: JournalEntry[] = [
    { tick: 1, realmId: SEED, payloadHex: utf8ToHex(JSON.stringify({ action: "move" })) },
    { tick: 2, realmId: SEED, payloadHex: utf8ToHex(JSON.stringify({ action: "interact" })) },
  ];
  const after = applyJournal(snap, journal);
  const hash = await stateHash(after);
  return { hash, events: after.events.length, ok: after.events.length === 2 };
}

function utf8ToHex(text: string): string {
  return [...new TextEncoder().encode(text)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

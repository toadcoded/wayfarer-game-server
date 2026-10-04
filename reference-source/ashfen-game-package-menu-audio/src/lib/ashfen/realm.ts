import { TICK_MS, mintIntentId, type Intent, type RealmEvent } from "./protocol.ts";
import { mulberry32 } from "./rng.ts";
import { applyJournal, stateHash, type JournalEntry, type RealmSnap } from "./replay.ts";

export { TICK_MS };

const SEED = 2730;

export type IntentDraft =
  | { kind: "move"; x: number; y: number }
  | { kind: "interact"; targetId: string; action: "gather" | "strike" | "talk" }
  | { kind: "use"; itemId: string }
  | { kind: "talk"; npcId: string };

export class LocalRealm {
  tick = 0;
  readonly seed = SEED;
  private rng = mulberry32(SEED);
  private queue: Intent[] = [];
  journal: RealmEvent[] = [];

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

  /** Advance one 600ms logical tick. Records queued intents; does not mutate the HUD store. */
  step(): RealmEvent[] {
    this.tick += 1;
    const batch = this.queue.splice(0);
    const out: RealmEvent[] = batch.map((intent) => {
      const ev: RealmEvent = {
        tick: this.tick,
        type: intent.kind,
        intentId: intent.id,
        ok: true,
      };
      this.journal.push(ev);
      return ev;
    });
    return out;
  }

  reset(seed = SEED) {
    this.tick = 0;
    this.rng = mulberry32(seed);
    this.queue = [];
    this.journal = [];
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

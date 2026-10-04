/** Deterministic journal fold — byte-stable SHA-256, no wall clock. */

export type JournalEntry = {
  tick: number;
  realmId: number;
  payloadHex: string;
};

export type RealmEvent = {
  tick: number;
  realmId: number;
  type: string;
  meta: unknown;
};

export type RealmSnap = {
  realmId: number;
  entities: unknown[];
  events: RealmEvent[];
};

export const SAMPLE_SNAPSHOT: RealmSnap = {
  realmId: 1,
  entities: [],
  events: [],
};

export const SAMPLE_JOURNAL: JournalEntry[] = [
  {
    tick: 100,
    realmId: 1,
    payloadHex: "7b22616374696f6e223a226e70635f636c69636b227d",
  },
  {
    tick: 101,
    realmId: 1,
    payloadHex: "7b22616374696f6e223a226d6f76656d656e74227d",
  },
];

export function applyJournal(snapshot: RealmSnap, journal: JournalEntry[]): RealmSnap {
  const state: RealmSnap = {
    realmId: snapshot.realmId,
    entities: [...snapshot.entities],
    events: [...snapshot.events],
  };
  const ordered = [...journal].sort((a, b) => a.tick - b.tick || a.realmId - b.realmId);
  for (const entry of ordered) {
    const evt = JSON.parse(hexToUtf8(entry.payloadHex)) as { action?: string };
    state.events.push({
      tick: entry.tick,
      realmId: entry.realmId,
      type: evt.action ?? "unknown",
      meta: evt,
    });
  }
  return state;
}

export async function stateHash(state: RealmSnap): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(state));
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) out[k] = (v as Record<string, unknown>)[k];
      return out;
    }
    return v;
  });
}

function hexToUtf8(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return new TextDecoder().decode(bytes);
}

export async function runGoldenReplay(): Promise<{ hash: string; events: number; ok: boolean }> {
  const after = applyJournal(SAMPLE_SNAPSHOT, SAMPLE_JOURNAL);
  const hash = await stateHash(after);
  return { hash, events: after.events.length, ok: after.events.length === 2 };
}

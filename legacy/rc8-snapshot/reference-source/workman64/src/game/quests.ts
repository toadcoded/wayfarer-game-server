export const TITHE_OFFERINGS = ["reedwood", "ash-ore", "reed-perch", "mire-fibre"] as const;
export type TitheOffering = (typeof TITHE_OFFERINGS)[number];

export type TithePhase = "meet" | "recipe" | "gather" | "bind" | "light" | "report" | "complete";

export type QuietTithe = {
  phase: TithePhase;
  offerings: TitheOffering[];
  lantern: boolean;
  rewarded: boolean;
};

export type TitheEvent =
  | { type: "talk"; npc: "halden" | "wren" | "toller" | "rowan" | "mara" }
  | { type: "offer"; item: string }
  | { type: "light" };

export const OFFERING_NAME: Record<TitheOffering, string> = {
  reedwood: "reedwood",
  "ash-ore": "ash ore",
  "reed-perch": "reed perch",
  "mire-fibre": "mire fibre",
};

export function freshQuietTithe(): QuietTithe {
  return { phase: "meet", offerings: [], lantern: false, rewarded: false };
}

export function isOffering(id: string): id is TitheOffering {
  return (TITHE_OFFERINGS as readonly string[]).includes(id);
}

export function recordOffering(state: QuietTithe, itemId: string): QuietTithe {
  if (!isOffering(itemId)) return state;
  if (state.offerings.includes(itemId)) return state;
  if (state.phase !== "gather" && state.phase !== "recipe") return state;
  const offerings = [...state.offerings, itemId];
  const next: QuietTithe = { ...state, offerings };
  if (offerings.length >= TITHE_OFFERINGS.length && state.phase === "gather") {
    return { ...next, phase: "bind" };
  }
  return next;
}

export function reduceTithe(state: QuietTithe, event: TitheEvent): { state: QuietTithe; line: string } {
  if (state.phase === "complete") {
    return { state, line: lineFor(event, state) };
  }

  if (event.type === "offer") {
    const next = recordOffering(state, event.item);
    if (next === state) return { state, line: "" };
    const got = OFFERING_NAME[event.item as TitheOffering] ?? event.item;
    if (next.phase === "bind") {
      return { state: next, line: `The bundle is whole. Take it to Toller at the mill.` };
    }
    return { state: next, line: `Offering bound: ${got}. ${next.offerings.length}/4.` };
  }

  if (event.type === "light") {
    if (state.phase !== "light") {
      return { state, line: "The fountain lantern stays dark." };
    }
    return {
      state: { ...state, lantern: true, phase: "report" },
      line: "The Reedhaven lantern takes. Report to Halden.",
    };
  }

  const npc = event.npc;
  if (npc === "halden") {
    if (state.phase === "meet") {
      return {
        state: { ...state, phase: "recipe" },
        line: "Halden: The Quiet Tithe is due. Wren keeps the recipe in the garden.",
      };
    }
    if (state.phase === "report" && state.lantern && !state.rewarded) {
      return {
        state: { ...state, phase: "complete", rewarded: true },
        line: "Halden: Reedhaven remembers. Take the ash staff. Favor I is yours.",
      };
    }
    if (state.phase === "complete") {
      return { state, line: "Halden: The lantern holds. Walk the four trails when you will." };
    }
    return { state, line: "Halden: Wren first. Then the four offerings. Then Toller. Then the fountain." };
  }

  if (npc === "wren") {
    if (state.phase === "recipe" || state.phase === "meet") {
      return {
        state: { ...state, phase: "gather" },
        line: "Wren: Reedwood, ash ore, reed perch, mire fibre. One of each. Then Toller at the mill.",
      };
    }
    if (state.phase === "gather") {
      return {
        state,
        line: `Wren: ${state.offerings.length}/4 bound. Grove, grey rocks, quay, pond-edge.`,
      };
    }
    return { state, line: "Wren: The garden keeps its own counsel." };
  }

  if (npc === "toller") {
    if (state.phase === "bind" || (state.phase === "gather" && state.offerings.length >= 4)) {
      return {
        state: { ...state, phase: "light", offerings: state.offerings.length ? state.offerings : [...TITHE_OFFERINGS] },
        line: "Toller: Bound. Light the fountain lantern at the square.",
      };
    }
    if (state.phase === "gather") {
      return { state, line: "Toller: Come back with all four. I will not bind a half-gift." };
    }
    return { state, line: "Toller: Mill turns. Tithe waits." };
  }

  if (npc === "rowan") {
    return { state, line: "Rowan: Shore, rise, gate, bridge. The fork still waits. Halden holds the tithe." };
  }

  return { state, line: "Mara: Reed market. Bread and rumor. The tithe is Halden's work." };
}

function lineFor(event: TitheEvent, state: QuietTithe) {
  if (event.type === "talk" && event.npc === "halden") {
    return "Halden: The lantern holds. Walk the four trails when you will.";
  }
  if (event.type === "talk") return reduceTithe({ ...state, phase: "complete" }, event).line;
  return "";
}

export function titheObjective(state: QuietTithe) {
  switch (state.phase) {
    case "meet":
      return "Speak with Halden at the square.";
    case "recipe":
      return "Ask Wren in the lantern garden.";
    case "gather":
      return `Gather the tithe · ${state.offerings.length}/4`;
    case "bind":
      return "Turn the bundle in to Toller at the mill.";
    case "light":
      return "Light the fountain lantern.";
    case "report":
      return "Report back to Halden.";
    case "complete":
      return "Quiet Tithe complete.";
  }
}

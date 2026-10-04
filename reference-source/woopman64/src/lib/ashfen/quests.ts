export type TithePhase =
  | "unseen"
  | "seekWren"
  | "collect"
  | "bind"
  | "light"
  | "report"
  | "complete";

export type TitheOfferings = {
  reedwood: boolean;
  ashOre: boolean;
  perch: boolean;
  mireFibre: boolean;
};

export type QuietTithe = {
  version: 1;
  phase: TithePhase;
  offerings: TitheOfferings;
  bundle: boolean;
  favor: number;
};

export type TitheEvent =
  | "halden"
  | "wren"
  | "gather"
  | "bind"
  | "light"
  | "report";

export const TITHE_LANTERN = { x: 17, y: 16 };

export const TITHE_REQUIREMENTS = [
  { key: "reedwood", itemId: "reedwood", label: "Reedwood", target: "West grove" },
  { key: "ashOre", itemId: "ash-ore", label: "Ash ore", target: "Grey rocks" },
  { key: "perch", itemId: "perch", label: "Reed perch", target: "East pond" },
  { key: "mireFibre", itemId: "mire-fibre", label: "Mire fibre", target: "Southern mire" },
] as const;

export function freshQuietTithe(): QuietTithe {
  return {
    version: 1,
    phase: "unseen",
    offerings: { reedwood: false, ashOre: false, perch: false, mireFibre: false },
    bundle: false,
    favor: 0,
  };
}

export function allOfferings(offerings: TitheOfferings) {
  return Object.values(offerings).every(Boolean);
}

export function trailCount(offerings: TitheOfferings) {
  return Object.values(offerings).filter(Boolean).length;
}

export function nextTithePhase(tithe: QuietTithe, event: TitheEvent): QuietTithe {
  if (event === "halden" && tithe.phase === "unseen") return { ...tithe, phase: "seekWren" };
  if (event === "wren" && tithe.phase === "seekWren") return { ...tithe, phase: "collect" };
  if (event === "bind" && tithe.phase === "collect" && allOfferings(tithe.offerings)) {
    return { ...tithe, phase: "light", bundle: true };
  }
  if (event === "light" && tithe.phase === "light" && tithe.bundle) return { ...tithe, phase: "report" };
  if (event === "report" && tithe.phase === "report") {
    return { ...tithe, phase: "complete", favor: Math.max(1, tithe.favor) };
  }
  return tithe;
}

export function recordOffering(tithe: QuietTithe, itemId: string): QuietTithe {
  if (tithe.phase !== "collect") return tithe;
  const requirement = TITHE_REQUIREMENTS.find((entry) => entry.itemId === itemId);
  if (!requirement || tithe.offerings[requirement.key]) return tithe;
  return { ...tithe, offerings: { ...tithe.offerings, [requirement.key]: true } };
}

export function reduceQuietTithe(
  tithe: QuietTithe,
  event: TitheEvent | { kind: "offering"; itemId: string },
): QuietTithe {
  if (typeof event === "object") return recordOffering(tithe, event.itemId);
  return nextTithePhase(tithe, event);
}

export function objectiveFor(tithe: QuietTithe): string {
  switch (tithe.phase) {
    case "unseen":
      return "Speak with Halden at the Keep.";
    case "seekWren":
      return "Ask Archivist Wren about the Tithe.";
    case "collect":
      if (allOfferings(tithe.offerings)) return "Bring the offerings to Toller.";
      return `Gather the four offerings (${trailCount(tithe.offerings)}/4)`;
    case "bind":
      return "Bring the offerings to Toller.";
    case "light":
      return "Light the Tithe Lantern at Reedhaven square.";
    case "report":
      return "Report the lantern’s return to Halden.";
    case "complete":
      return "The Quiet Tithe is complete — Reedhaven remembers.";
  }
}

export function targetFor(tithe: QuietTithe): { x: number; y: number; label: string } | null {
  switch (tithe.phase) {
    case "unseen":
    case "report":
      return { x: 19, y: 4, label: "The Keep" };
    case "seekWren":
      return { x: 5, y: 4, label: "Great Library" };
    case "bind":
      return { x: 5, y: 24, label: "Toller's shop" };
    case "light":
      return { x: TITHE_LANTERN.x, y: TITHE_LANTERN.y, label: "Tithe Lantern" };
    case "collect": {
      const missing = TITHE_REQUIREMENTS.find((entry) => !tithe.offerings[entry.key]);
      if (!missing) return { x: 5, y: 24, label: "Toller's shop" };
      const positions: Record<string, { x: number; y: number }> = {
        reedwood: { x: 4, y: 14 },
        ashOre: { x: 33, y: 26 },
        perch: { x: 32, y: 18 },
        mireFibre: { x: 22, y: 24 },
      };
      return { ...positions[missing.key]!, label: missing.target };
    }
    default:
      return null;
  }
}

export function isLanternTile(x: number, y: number) {
  return (x === 17 || x === 18) && y === 16;
}

export function dialogueFor(
  npcId: string,
  tithe: QuietTithe,
): { line: string; event?: TitheEvent } {
  if (npcId === "halden") {
    if (tithe.phase === "unseen") {
      return {
        line: "The vault is quiet. The Quiet Tithe is overdue — Wren keeps the names.",
        event: "halden",
      };
    }
    if (tithe.phase === "seekWren") {
      return { line: "Wren keeps the names. Ask her in the Great Library." };
    }
    if (tithe.phase === "collect") {
      return {
        line: allOfferings(tithe.offerings)
          ? "Four trails kept. Bind them with Toller, then light the square."
          : "Four offerings: grove, grey rock, pond, and the southern mire.",
      };
    }
    if (tithe.phase === "light") {
      return { line: "Light the Tithe Lantern at the fountain. Then come back." };
    }
    if (tithe.phase === "report") {
      return {
        line: "The lantern is lit. Reedhaven remembers. Take the charm — and the lantern of Ash.",
        event: "report",
      };
    }
    return { line: "The Tithe is kept. Walk honestly." };
  }
  if (npcId === "wren") {
    if (tithe.phase === "seekWren") {
      return {
        line: "Reedwood, ash ore, reed perch, mire fibre. Bind them with Toller, then light the square.",
        event: "wren",
      };
    }
    if (tithe.phase === "collect") {
      return {
        line: allOfferings(tithe.offerings)
          ? "The four trails are gathered. Toller will bind them."
          : "The grove, the grey rocks, the east pond, the southern mire. Four, then Toller.",
      };
    }
    if (tithe.phase === "light") {
      return { line: "The fountain is waiting. Memory likes a flame." };
    }
    if (tithe.phase === "report" || tithe.phase === "complete") {
      return { line: "The books remember what the square forgets. Keep the Codex." };
    }
    return { line: "The books remember what the square forgets. Keep the Codex." };
  }
  if (npcId === "toller") {
    if (tithe.phase === "collect" && allOfferings(tithe.offerings)) {
      return {
        line: "I'll bind these. Light the Tithe Lantern at the fountain.",
        event: "bind",
      };
    }
    if (tithe.phase === "light") {
      return { line: "The bundle is bound. The fountain is waiting." };
    }
    if (tithe.phase === "complete") {
      return { line: "Bread, a reed blade, an ash staff. The Tithe is paid. Learn first." };
    }
    return { line: "Bread, a reed blade, an ash staff. Learn first. Swing second." };
  }
  return { line: "…" };
}

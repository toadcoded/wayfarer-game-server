export type TithePhase = "unseen" | "seekWren" | "collect" | "bind" | "light" | "report" | "complete";

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

export function nextTithePhase(tithe: QuietTithe, event: "halden" | "wren" | "gather" | "bind" | "light" | "report"): QuietTithe {
  if (event === "halden" && tithe.phase === "unseen") return { ...tithe, phase: "seekWren" };
  if (event === "wren" && tithe.phase === "seekWren") return { ...tithe, phase: "collect" };
  if (event === "bind" && tithe.phase === "collect" && allOfferings(tithe.offerings)) return { ...tithe, phase: "bind", bundle: true };
  if (event === "light" && tithe.phase === "bind" && tithe.bundle) return { ...tithe, phase: "report" };
  if (event === "report" && tithe.phase === "report") return { ...tithe, phase: "complete", favor: Math.max(1, tithe.favor) };
  return tithe;
}

export function recordOffering(tithe: QuietTithe, itemId: string): QuietTithe {
  if (tithe.phase !== "collect") return tithe;
  const requirement = TITHE_REQUIREMENTS.find((entry) => entry.itemId === itemId);
  if (!requirement || tithe.offerings[requirement.key]) return tithe;
  return { ...tithe, offerings: { ...tithe.offerings, [requirement.key]: true } };
}

export function allOfferings(offerings: TitheOfferings) {
  return Object.values(offerings).every(Boolean);
}

export function objectiveFor(tithe: QuietTithe): string {
  switch (tithe.phase) {
    case "unseen": return "Speak to Keepmaster Halden";
    case "seekWren": return "Ask Archivist Wren about the Tithe";
    case "collect": return `Gather the four offerings (${Object.values(tithe.offerings).filter(Boolean).length}/4)`;
    case "bind": return "Bring the offerings to Toller";
    case "light": return "Light the Tithe Lantern at Reedhaven square";
    case "report": return "Report the lantern’s return to Halden";
    case "complete": return "The Quiet Tithe is complete — Reedhaven remembers";
  }
}

export function targetFor(tithe: QuietTithe): { x: number; y: number; label: string } | null {
  switch (tithe.phase) {
    case "unseen":
    case "report": return { x: 19, y: 4, label: "The Keep" };
    case "seekWren": return { x: 5, y: 4, label: "Great Library" };
    case "bind": return { x: 5, y: 24, label: "Toller's shop" };
    case "light": return { x: 17, y: 16, label: "Tithe Lantern" };
    case "collect": {
      const missing = TITHE_REQUIREMENTS.find((entry) => !tithe.offerings[entry.key]);
      if (!missing) return { x: 5, y: 24, label: "Toller's shop" };
      const positions: Record<string, { x: number; y: number }> = {
        reedwood: { x: 4, y: 14 }, ashOre: { x: 33, y: 26 }, perch: { x: 33, y: 17 }, mireFibre: { x: 22, y: 24 },
      };
      return { ...positions[missing.key]!, label: missing.target };
    }
    default: return null;
  }
}

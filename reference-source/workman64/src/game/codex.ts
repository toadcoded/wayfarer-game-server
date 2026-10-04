import { LANDMARKS, type Landmark } from "./world.ts";

export type CodexPage = {
  id: Landmark["id"];
  title: string;
  folio: string;
  body: string;
};

export const CODEX_PAGES: CodexPage[] = [
  {
    id: "west",
    title: "Western Shore",
    folio: "I",
    body: "The lake keeps the old boats. Reeds write the wind across the hulls. Take driftwood when the water offers it — the highland does not waste a keel.",
  },
  {
    id: "east",
    title: "Eastern Rise",
    folio: "II",
    body: "Cairn stones on the windward hill. Each rock is a name someone stopped saying. Stack one more. The hill will still be older than you.",
  },
  {
    id: "south",
    title: "Southern Gate",
    folio: "III",
    body: "Two pillars that remember a wall. The arch still holds. Walk under it as if a town were waiting on the other side, even if only grass answers.",
  },
  {
    id: "north",
    title: "North Bridge",
    folio: "IV",
    body: "Timber over the talking river. The boards remember every boot. Cross, and the river will tell the valley you passed.",
  },
];

export const CODEX_COLOPHON =
  "Four roads leave the fork. This atlas is not a map of land. It is a record of walking.";

export function pageFor(id: string) {
  return CODEX_PAGES.find((p) => p.id === id);
}

export function openedPages(trails: Record<string, boolean>) {
  return CODEX_PAGES.filter((p) => trails[p.id]);
}

export function codexComplete(trails: Record<string, boolean>) {
  return LANDMARKS.every((l) => trails[l.id]);
}

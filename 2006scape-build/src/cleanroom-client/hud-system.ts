/**
 * Project Copper Lantern — typed HUD and minimap presentation contract.
 *
 * This layer translates authoritative/render-neutral world data into UI-ready
 * symbols. It does not grant interaction authority or mutate game state.
 */

import type { CompassHudModel } from "./compass";
import type { DetailInstance, HudOverviewState } from "./world-detail-pass";
import type { RealmObject } from "./realm-expansion";
import type { ResourceNode } from "./resource-system";
import type { RoofVisibilityModel } from "./roof-visibility";

export type HudPanelId = "chat" | "minimap" | "inventory" | "bank" | "equipment" | "skills" | "quests" | "settings" | "guide";
export type HudIconId = "player" | "npc" | "resource" | "ore" | "tree" | "fishing" | "bank" | "portal" | "objective" | "landmark" | "campfire" | "door" | "cave" | "roof" | "warning";
export type HudSymbol = Readonly<{ icon: HudIconId; glyph: string; accessibleLabel: string; tint: string; priority: number }>;
export type HudPanel = Readonly<{ id: HudPanelId; visible: boolean; collapsed: boolean; anchor: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"; zIndex: number }>;
export type EnvironmentLayer = Readonly<{ id: "terrain" | "water" | "vegetation" | "structures" | "resources" | "atmosphere" | "roofs"; visible: boolean; opacity: number; order: number }>;
export type MinimapMarker = Readonly<{ id: string; icon: HudIconId; x: number; y: number; label: string; tint: string; interactive: boolean; levelId: string }>;
export type MinimapModel = Readonly<{ placement: "top-right"; radius: number; rotationMode: "player-relative" | "world-north"; compass: CompassHudModel; markers: readonly MinimapMarker[]; zoom: number; visible: boolean }>;
export type ChatChannel = "game" | "public" | "private" | "clan" | "trade" | "system";
export type ChatTab = Readonly<{ channel: ChatChannel; enabled: boolean; unread: number; color: string }>;
export type HudActionState = Readonly<{ phase: "idle" | "pending" | "accepted" | "rejected"; label: string; resourceId?: string; rewardText?: string; errorText?: string }>;
export type HudInventorySummary = Readonly<{ items: Readonly<Record<string, number>>; totalItemCount: number }>;
export type HudPresentationModel = Readonly<{ panels: readonly HudPanel[]; layers: readonly EnvironmentLayer[]; minimap: MinimapModel; chatTabs: readonly ChatTab[]; roof: RoofVisibilityModel; status: HudOverviewState["statusText"]; symbols: readonly HudSymbol[]; action: HudActionState; inventory: HudInventorySummary }>;

const SYMBOLS: Readonly<Record<HudIconId, HudSymbol>> = {
  player: { icon: "player", glyph: "◆", accessibleLabel: "Player", tint: "#E8F1FF", priority: 100 },
  npc: { icon: "npc", glyph: "●", accessibleLabel: "Non-player character", tint: "#F1C27D", priority: 60 },
  resource: { icon: "resource", glyph: "✦", accessibleLabel: "Harvestable resource", tint: "#9CD7A5", priority: 45 },
  ore: { icon: "ore", glyph: "⬟", accessibleLabel: "Ore vein", tint: "#B7A99A", priority: 50 },
  tree: { icon: "tree", glyph: "♣", accessibleLabel: "Tree resource", tint: "#6FB27C", priority: 48 },
  fishing: { icon: "fishing", glyph: "≈", accessibleLabel: "Fishing spot", tint: "#71B6D9", priority: 48 },
  bank: { icon: "bank", glyph: "▣", accessibleLabel: "Bank", tint: "#D5B56F", priority: 70 },
  portal: { icon: "portal", glyph: "◇", accessibleLabel: "Portal or departure gate", tint: "#B89CFF", priority: 80 },
  objective: { icon: "objective", glyph: "!", accessibleLabel: "Objective", tint: "#F2D36B", priority: 75 },
  landmark: { icon: "landmark", glyph: "★", accessibleLabel: "Landmark", tint: "#F0B86E", priority: 65 },
  campfire: { icon: "campfire", glyph: "♨", accessibleLabel: "Campfire", tint: "#F08B5B", priority: 40 },
  door: { icon: "door", glyph: "▤", accessibleLabel: "Door", tint: "#C59C6C", priority: 35 },
  cave: { icon: "cave", glyph: "⌂", accessibleLabel: "Cave entrance", tint: "#82909A", priority: 55 },
  roof: { icon: "roof", glyph: "▰", accessibleLabel: "Roof visibility", tint: "#C4CBD1", priority: 30 },
  warning: { icon: "warning", glyph: "⚠", accessibleLabel: "Warning", tint: "#E46C63", priority: 90 },
};

const PANELS: readonly HudPanel[] = [
  { id: "chat", visible: true, collapsed: false, anchor: "bottom-left", zIndex: 20 },
  { id: "minimap", visible: true, collapsed: false, anchor: "top-right", zIndex: 30 },
  { id: "inventory", visible: true, collapsed: false, anchor: "bottom-right", zIndex: 20 },
  { id: "bank", visible: false, collapsed: false, anchor: "center", zIndex: 40 },
  { id: "equipment", visible: false, collapsed: false, anchor: "bottom-right", zIndex: 21 },
  { id: "skills", visible: false, collapsed: false, anchor: "top-left", zIndex: 21 },
  { id: "quests", visible: false, collapsed: false, anchor: "top-left", zIndex: 21 },
  { id: "settings", visible: false, collapsed: false, anchor: "center", zIndex: 50 },
  { id: "guide", visible: true, collapsed: false, anchor: "top-left", zIndex: 25 },
];

const LAYERS: readonly EnvironmentLayer[] = [
  { id: "terrain", visible: true, opacity: 1, order: 0 },
  { id: "water", visible: true, opacity: 0.92, order: 1 },
  { id: "vegetation", visible: true, opacity: 1, order: 2 },
  { id: "structures", visible: true, opacity: 1, order: 3 },
  { id: "resources", visible: true, opacity: 1, order: 4 },
  { id: "atmosphere", visible: true, opacity: 0.76, order: 5 },
  { id: "roofs", visible: true, opacity: 1, order: 6 },
];

const CHAT_TABS: readonly ChatTab[] = [
  { channel: "game", enabled: true, unread: 0, color: "#E8D59A" },
  { channel: "public", enabled: true, unread: 0, color: "#FFFFFF" },
  { channel: "private", enabled: true, unread: 0, color: "#C8A6FF" },
  { channel: "clan", enabled: true, unread: 0, color: "#76C7FF" },
  { channel: "trade", enabled: true, unread: 0, color: "#D9A6FF" },
  { channel: "system", enabled: true, unread: 0, color: "#F1A16D" },
];

function resourceIcon(resourceId: string): HudIconId {
  if (resourceId.includes("vein")) return "ore";
  if (resourceId.includes("tree")) return "tree";
  if (resourceId.includes("fishing")) return "fishing";
  if (resourceId.includes("campfire")) return "campfire";
  return "resource";
}

export function createHudPresentation(input: {
  overview: HudOverviewState;
  compass: CompassHudModel;
  roof: RoofVisibilityModel;
  resources: readonly ResourceNode[];
  realmObjects: readonly RealmObject[];
  details: readonly DetailInstance[];
  action?: HudActionState;
  inventory?: HudInventorySummary;
}): HudPresentationModel {
  const resourceMarkers: MinimapMarker[] = input.resources.map((resource) => ({
    id: resource.id,
    icon: resourceIcon(resource.resourceId),
    x: resource.tile.x,
    y: resource.tile.y,
    label: resource.resourceId,
    tint: SYMBOLS[resourceIcon(resource.resourceId)].tint,
    interactive: resource.interaction !== "inspect",
    levelId: "sable-fen-realm",
  }));
  const objectMarkers: MinimapMarker[] = input.realmObjects.filter((object) => object.interaction !== "none").map((object) => ({
    id: object.id,
    icon: object.kind === "bridge-post" ? "landmark" : "resource",
    x: object.tile.x,
    y: object.tile.y,
    label: object.kind,
    tint: SYMBOLS[object.kind === "bridge-post" ? "landmark" : "resource"].tint,
    interactive: true,
    levelId: "sable-fen-realm",
  }));
  return {
    panels: PANELS,
    layers: LAYERS.map((layer) => layer.id === "roofs" ? { ...layer, visible: input.roof.visible } : layer),
    minimap: { placement: "top-right", radius: 96, rotationMode: "player-relative", compass: input.compass, markers: [...resourceMarkers, ...objectMarkers], zoom: 1, visible: true },
    chatTabs: CHAT_TABS,
    roof: input.roof,
    status: input.overview.statusText,
    symbols: Object.values(SYMBOLS),
    action: input.action ?? { phase: "idle", label: "Ready" },
    inventory: input.inventory ?? { items: {}, totalItemCount: 0 },
  };
}

export function hudSymbol(icon: HudIconId): HudSymbol { return SYMBOLS[icon]; }

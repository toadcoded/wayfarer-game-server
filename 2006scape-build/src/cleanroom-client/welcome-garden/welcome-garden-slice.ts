import {
  applyAppearancePatch,
  createDefaultAppearance,
  type AppearancePatch,
  type PlayerAppearance,
} from "../player-appearance";
import {
  BEGINNER_GUIDE_PACKAGE,
  getNextGuideStep,
  type GuideStepId,
} from "../beginner-guide-package";
import {
  BEGINNER_SAFE_AREA,
  type VisualAnchor,
} from "../beginner-safe-area";
import {
  PlayerMotionController,
  type MotionState,
  type Pose,
  type Vec3,
} from "../player-motion";
import {
  createHudOverview,
  createRealmOverview,
  generateMicroDetails,
  type HudOverviewState,
  type DetailInstance,
} from "../world-detail-pass";
import {
  buildLocationBreadcrumb,
  getDistrictForLevel,
} from "../world-presentation-organization";
import {
  DEFAULT_STARTER_LOADOUT,
  WELCOME_GARDEN_STARTER_ARMOR_TABLE,
  type StarterArmorTable,
  type StarterWeaponLoadout,
} from "../starter-loadout";
import { createCompassHud, type CompassHudModel } from "../compass";
import type { GardenMapBounds } from "../welcome-garden-map";
import { FROSTCROWN_MOUNTAIN, mountainElevationAt, type SnowcapMountain } from "../mountain-expansion";
import { SUNWASH_BEACH, type SouthernBeachExpansion } from "../beach-expansion";
import { GLOAMFEN_MARSH, type EasternMarshExpansion } from "../marsh-expansion";
import { REDGLASS_XERISCAPE, type WesternXeriscapeExpansion } from "../xeriscape-expansion";
import {
  EXPANDED_REALM_BOUNDS,
  REALM_PHYSICAL_PROPERTIES,
  generateRealmDecorations,
  type RealmObject,
  type RealmPhysicalProperties,
} from "../realm-expansion";
import {
  createRoofVisibilityModel,
  DEFAULT_ROOF_VISIBILITY,
  toggleRoofVisibility,
  type RoofVisibilityModel,
} from "../roof-visibility";
import { BankLedger, createDefaultBankView, type BankItemId, type BankTabId, type BankViewModel } from "../bank-system";
import { STARTER_NPCS, type NpcDefinition } from "../npc-system";
import { generateResourceNodes, harvestResource, type ResourceNode, type ResourceTool } from "../resource-system";
import { createHudPresentation, type HudPresentationModel } from "../hud-system";

export type GardenTile = Readonly<{ x: number; y: number }>;
export type GardenConnectionStatus = "local-demo" | "online" | "offline";
export type GardenRequestPhase = "idle" | "pending" | "accepted" | "rejected";
export type GardenDeparturePhase = "unseen" | "inspecting" | "awaiting-confirmation" | "pending" | "confirmed" | "rejected";
export type GardenCosmeticPhase = "closed" | "previewing" | "pending" | "confirmed" | "rejected";

export type GardenPlayerSnapshot = Readonly<{
  playerId: string;
  tile: GardenTile;
  facingRadians: number;
  motion: MotionState;
  speed01: number;
  appearance: PlayerAppearance;
  appearanceRevision: number;
}>;

export type GardenWorldSnapshot = Readonly<{
  source: GardenConnectionStatus;
  revision: number;
  worldSpace: "sable-fen";
  levelId: "welcome-garden-ground";
  player: GardenPlayerSnapshot;
  inventory: Readonly<Record<string, number>>;
  resourceCooldowns: Readonly<Record<string, number>>;
  bank: BankViewModel;
  portal: Readonly<{
    anchorId: "departure-gate";
    label: string;
    destinationLabel: string;
    available: boolean;
    reasonUnavailable?: string;
  }>;
}>;

export type GardenIntent =
  | Readonly<{ type: "move.request"; requestId: string; destination: GardenTile }>
  | Readonly<{ type: "appearance.confirm"; requestId: string; baseRevision: number; patch: AppearancePatch }>
  | Readonly<{ type: "resource.harvest"; requestId: string; nodeId: string; tool: ResourceTool; skillLevel: number; nowSeconds: number }>
  | Readonly<{ type: "bank.tab.select"; requestId: string; tab: BankTabId }>
  | Readonly<{ type: "bank.deposit"; requestId: string; itemId: BankItemId; quantity: number; tab: BankTabId }>
  | Readonly<{ type: "bank.withdraw"; requestId: string; itemId: BankItemId; quantity: number; tab: BankTabId }>
  | Readonly<{ type: "departure.confirm"; requestId: string }>;

export type GardenAuthorityError = Readonly<{
  code: "INVALID_DESTINATION" | "STALE_REVISION" | "UNAVAILABLE" | "NOT_ALLOWED" | "NODE_NOT_FOUND" | "TOOL_REQUIRED" | "LEVEL_REQUIRED" | "COOLDOWN" | "OUT_OF_RANGE" | "BANK_NOT_FOUND" | "INSUFFICIENT_QUANTITY" | "BANK_FULL" | "INVENTORY_FULL" | "INVALID_QUANTITY" | "ITEM_NOT_FOUND" | "ITEM_NOT_STACKABLE" | "ITEM_NOT_NOTEABLE" | "INVALID_TAB" | "INVALID_SLOT" | "SLOT_EMPTY" | "PLACEHOLDER_REQUIRED" | "UNKNOWN";
  message: string;
  requestId: string;
}>;

export type GardenAuthorityPort = Readonly<{
  load(): Promise<GardenWorldSnapshot>;
  submit(intent: GardenIntent): Promise<GardenWorldSnapshot>;
}>;

export type GardenProgressEvent =
  | Readonly<{ type: "camera.changed" }>
  | Readonly<{ type: "move.acknowledged"; destination: GardenTile }>
  | Readonly<{ type: "overview.opened" }>
  | Readonly<{ type: "appearance.confirmed" }>
  | Readonly<{ type: "pocketbook.opened"; pageId: string }>
  | Readonly<{ type: "anchor.interaction.acknowledged"; anchorId: string }>
  | Readonly<{ type: "departure.inspected" }>
  | Readonly<{ type: "departure.confirmed" }>;

export type GardenInput =
  | Readonly<{ type: "camera.changed" }>
  | Readonly<{ type: "ground.selected"; destination: GardenTile }>
  | Readonly<{ type: "resource.selected"; nodeId: string; tool: ResourceTool; skillLevel: number; nowSeconds: number }>
  | Readonly<{ type: "bank.tab.select"; tab: BankTabId }>
  | Readonly<{ type: "bank.deposit"; itemId: BankItemId; quantity: number; tab?: BankTabId }>
  | Readonly<{ type: "bank.withdraw"; itemId: BankItemId; quantity: number; tab?: BankTabId }>
  | Readonly<{ type: "overview.set-open"; open: boolean }>
  | Readonly<{ type: "roof.visibility.toggle" }>
  | Readonly<{ type: "anchor.selected"; anchorId: string }>
  | Readonly<{ type: "appearance.preview"; patch: AppearancePatch }>
  | Readonly<{ type: "appearance.cancel" }>
  | Readonly<{ type: "appearance.confirm" }>
  | Readonly<{ type: "pocketbook.open"; pageId: string }>
  | Readonly<{ type: "departure.inspect" }>
  | Readonly<{ type: "departure.confirm" }>
  | Readonly<{ type: "notice.dismiss"; noticeId: string }>;

export type GardenSceneState = Readonly<{
  phase: "booting" | "ready" | "failed";
  snapshot?: GardenWorldSnapshot;
  selectedAnchorId?: string;
  completedGuideSteps: readonly GuideStepId[];
  activeGuideStepId?: GuideStepId;
  mapOpen: boolean;
  pocketbookPageId?: string;
  appearance: Readonly<{
    phase: GardenCosmeticPhase;
    preview: PlayerAppearance;
    confirmed: PlayerAppearance;
    error?: GardenAuthorityError;
  }>;
  departure: Readonly<{
    phase: GardenDeparturePhase;
    error?: GardenAuthorityError;
  }>;
  pending: Readonly<Record<string, GardenRequestPhase>>;
  notices: readonly string[];
  roofsVisible: boolean;
  lastError?: GardenAuthorityError;
  action: Readonly<{ phase: "idle" | "pending" | "accepted" | "rejected"; label?: string; resourceId?: string; rewardText?: string; error?: GardenAuthorityError }>;
}>;

export type GardenAvatarRenderState = Readonly<{
  position: Vec3;
  terrainElevation: number;
  facingRadians: number;
  pose: Pose;
  appearance: PlayerAppearance;
  equippedWeapon: StarterWeaponLoadout;
}>;

export type GardenRenderModel = Readonly<{
  state: GardenSceneState;
  hud: HudOverviewState;
  hudPresentation: HudPresentationModel;
  anchors: readonly VisualAnchor[];
  details: readonly DetailInstance[];
  starterArmorTable: StarterArmorTable;
  mapBounds: GardenMapBounds;
  compass: CompassHudModel;
  mountain: SnowcapMountain;
  beach: SouthernBeachExpansion;
  marsh: EasternMarshExpansion;
  xeriscape: WesternXeriscapeExpansion;
  realmObjects: readonly RealmObject[];
  physicalProperties: RealmPhysicalProperties;
  roofs: RoofVisibilityModel;
  bank: BankViewModel;
  npcs: readonly NpcDefinition[];
  resources: readonly ResourceNode[];
  avatar?: GardenAvatarRenderState;
  timeSeconds: number;
}>;

export type TileWorldTransform = Readonly<{
  tileSize: number;
  origin: Vec3;
  tileToWorld(tile: GardenTile, elevation?: number): Vec3;
  worldToTile(position: Vec3): GardenTile;
}>;

export const gardenTransform: TileWorldTransform = {
  tileSize: 1,
  origin: { x: 0, y: 0, z: 0 },
  tileToWorld: (tile, elevation = 0) => ({ x: tile.x, y: elevation, z: tile.y }),
  worldToTile: (position) => ({ x: Math.round(position.x), y: Math.round(position.z) }),
};

const REQUEST_LIMIT = 64;
const GARDEN_BOUNDS = EXPANDED_REALM_BOUNDS;
const BANK_DEPOSIT_TILE: GardenTile = { x: 7, y: 8 };
const INVENTORY_CAPACITY = 28;

function cloneSnapshot(snapshot: GardenWorldSnapshot): GardenWorldSnapshot {
  return {
    ...snapshot,
    player: { ...snapshot.player, tile: { ...snapshot.player.tile }, appearance: { ...snapshot.player.appearance, palette: { ...snapshot.player.appearance.palette }, scars: [...snapshot.player.appearance.scars], materials: snapshot.player.appearance.materials.map((material) => ({ ...material })) } },
    portal: { ...snapshot.portal },
    inventory: { ...snapshot.inventory },
    resourceCooldowns: { ...snapshot.resourceCooldowns },
    bank: { ...snapshot.bank, tabs: snapshot.bank.tabs.map((tab) => ({ ...tab, slots: tab.slots.map((slot) => ({ ...slot })) })) },
  };
}

function error(code: GardenAuthorityError["code"], message: string, requestId: string): GardenAuthorityError {
  return { code, message, requestId };
}

export class LocalGardenDemoAuthority implements GardenAuthorityPort {
  private snapshot: GardenWorldSnapshot;
  private readonly processed = new Map<string, GardenWorldSnapshot>();
  private readonly resources: readonly ResourceNode[];
  private readonly bank: BankLedger;

  public constructor(playerId = "local-demo-player") {
    this.resources = generateResourceNodes("copper-lantern-realm-v1", 0.34);
    this.bank = new BankLedger([
      { itemId: "coins", quantity: 2500 },
      { itemId: "brass-armour", quantity: 1 },
      { itemId: "granite-maul", quantity: 1 },
      { itemId: "lobster", quantity: 12 },
      { itemId: "copper-lantern", quantity: 1 },
    ]);
    this.snapshot = {
      source: "local-demo",
      revision: 1,
      worldSpace: "sable-fen",
      levelId: "welcome-garden-ground",
      player: {
        playerId,
        tile: { ...BEGINNER_SAFE_AREA.area.spawnTile },
        facingRadians: 0,
        motion: "idle",
        speed01: 0,
        appearance: createDefaultAppearance(),
        appearanceRevision: 1,
      },
      inventory: {},
      resourceCooldowns: {},
      bank: this.bank.view(),
      portal: {
        anchorId: "departure-gate",
        label: "Fenway Departure Gate",
        destinationLabel: "Sable Fen Waypost",
        available: false,
        reasonUnavailable: "Confirm your cosmetic look before leaving the protected garden.",
      },
    };
  }

  public async load(): Promise<GardenWorldSnapshot> {
    return cloneSnapshot(this.snapshot);
  }

  public async submit(intent: GardenIntent): Promise<GardenWorldSnapshot> {
    const previous = this.processed.get(intent.requestId);
    if (previous) return cloneSnapshot(previous);
    if (this.processed.size >= REQUEST_LIMIT) this.processed.delete(this.processed.keys().next().value as string);

    if (intent.type === "move.request") {
      const destination = intent.destination;
      if (destination.x < GARDEN_BOUNDS.minX || destination.x > GARDEN_BOUNDS.maxX || destination.y < GARDEN_BOUNDS.minY || destination.y > GARDEN_BOUNDS.maxY) {
        throw error("INVALID_DESTINATION", "That destination is outside the protected garden.", intent.requestId);
      }
      this.snapshot = {
        ...this.snapshot,
        revision: this.snapshot.revision + 1,
        player: { ...this.snapshot.player, tile: { ...destination }, motion: "walking", speed01: 0.45 },
      };
    } else if (intent.type === "appearance.confirm") {
      if (intent.baseRevision !== this.snapshot.revision) throw error("STALE_REVISION", "The preview is out of date. Reopen the mirror and try again.", intent.requestId);
      const appearance = applyAppearancePatch(this.snapshot.player.appearance, intent.patch);
      this.snapshot = {
        ...this.snapshot,
        revision: this.snapshot.revision + 1,
        portal: { ...this.snapshot.portal, available: true, reasonUnavailable: undefined },
        player: { ...this.snapshot.player, appearance, appearanceRevision: this.snapshot.player.appearanceRevision + 1 },
      };
    } else if (intent.type === "resource.harvest") {
      const node = this.resources.find((candidate) => candidate.id === intent.nodeId);
      if (!node) throw error("NODE_NOT_FOUND", "That resource node is not registered.", intent.requestId);
      const dx = node.tile.x - this.snapshot.player.tile.x;
      const dy = node.tile.y - this.snapshot.player.tile.y;
      if (Math.hypot(dx, dy) > 2.5) throw error("OUT_OF_RANGE", "Move closer to harvest that resource.", intent.requestId);
      const lastHarvestSeconds = this.snapshot.resourceCooldowns[node.id] ?? -Infinity;
      const result = harvestResource(node, intent.tool, intent.skillLevel, intent.nowSeconds, lastHarvestSeconds);
      if (!result.ok) throw error(result.code, result.message, intent.requestId);
      this.snapshot = {
        ...this.snapshot,
        revision: this.snapshot.revision + 1,
        inventory: { ...this.snapshot.inventory, [result.itemId]: (this.snapshot.inventory[result.itemId] ?? 0) + result.quantity },
        resourceCooldowns: { ...this.snapshot.resourceCooldowns, [node.id]: intent.nowSeconds },
        player: { ...this.snapshot.player, motion: "gathering", speed01: 0 },
      };
    } else if (intent.type === "bank.tab.select") {
      const result = this.bank.setActiveTab(intent.tab);
      if (!result.ok) throw error(result.code, result.message, intent.requestId);
      this.snapshot = { ...this.snapshot, revision: this.snapshot.revision + 1, bank: result.state };
    } else if (intent.type === "bank.deposit") {
      const dx = BANK_DEPOSIT_TILE.x - this.snapshot.player.tile.x;
      const dy = BANK_DEPOSIT_TILE.y - this.snapshot.player.tile.y;
      if (Math.hypot(dx, dy) > 3) throw error("BANK_NOT_FOUND", "Move closer to the Welcome Garden bank counter.", intent.requestId);
      const available = this.snapshot.inventory[intent.itemId] ?? 0;
      if (!Number.isSafeInteger(intent.quantity) || intent.quantity <= 0) throw error("INVALID_QUANTITY", "Deposit quantity must be a positive whole number.", intent.requestId);
      if (available < intent.quantity) throw error("INSUFFICIENT_QUANTITY", "You do not have enough of that item to deposit.", intent.requestId);
      const result = this.bank.deposit(intent.itemId, intent.quantity, intent.tab);
      if (!result.ok) throw error(result.code, result.message, intent.requestId);
      const remaining = available - intent.quantity;
      const nextInventory = { ...this.snapshot.inventory };
      if (remaining === 0) delete nextInventory[intent.itemId];
      else nextInventory[intent.itemId] = remaining;
      this.snapshot = { ...this.snapshot, revision: this.snapshot.revision + 1, inventory: nextInventory, bank: result.state };
    } else if (intent.type === "bank.withdraw") {
      const dx = BANK_DEPOSIT_TILE.x - this.snapshot.player.tile.x;
      const dy = BANK_DEPOSIT_TILE.y - this.snapshot.player.tile.y;
      if (Math.hypot(dx, dy) > 3) throw error("BANK_NOT_FOUND", "Move closer to the Welcome Garden bank counter.", intent.requestId);
      if (!Number.isSafeInteger(intent.quantity) || intent.quantity <= 0) throw error("INVALID_QUANTITY", "Withdraw quantity must be a positive whole number.", intent.requestId);
      const existing = this.snapshot.inventory[intent.itemId] ?? 0;
      if (existing === 0 && Object.keys(this.snapshot.inventory).length >= INVENTORY_CAPACITY) throw error("INVENTORY_FULL", "Your inventory has no free slot.", intent.requestId);
      const result = this.bank.withdraw(intent.itemId, intent.quantity, intent.tab);
      if (!result.ok) throw error(result.code, result.message, intent.requestId);
      this.snapshot = { ...this.snapshot, revision: this.snapshot.revision + 1, inventory: { ...this.snapshot.inventory, [intent.itemId]: existing + intent.quantity }, bank: result.state };
    } else if (intent.type === "departure.confirm") {
      if (!this.snapshot.portal.available) throw error("NOT_ALLOWED", this.snapshot.portal.reasonUnavailable ?? "Departure is not available yet.", intent.requestId);
      this.snapshot = { ...this.snapshot, revision: this.snapshot.revision + 1 };
    } else {
      throw error("UNKNOWN", "This local demo does not recognize that intent.", "");
    }
    const accepted = cloneSnapshot(this.snapshot);
    this.processed.set(intent.requestId, accepted);
    return accepted;
  }
}

export class WelcomeGardenSceneController {
  private state: GardenSceneState;
  private readonly authority: GardenAuthorityPort;
  private readonly motion: PlayerMotionController;
  private readonly details: readonly DetailInstance[];
  private readonly realmObjects: readonly RealmObject[];
  private readonly bank: BankViewModel;
  private readonly npcs: readonly NpcDefinition[];
  private readonly resources: readonly ResourceNode[];
  private requestCounter = 0;

  public constructor(authority: GardenAuthorityPort, playerId = "local-demo-player") {
    this.authority = authority;
    this.motion = new PlayerMotionController(playerId);
    this.details = generateMicroDetails("welcome-garden-ground", "wetland-frontier", 129, 105, "welcome-garden-expansion-v1", 0.7);
    this.realmObjects = generateRealmDecorations("copper-lantern-realm-v1", 0.42);
    this.bank = createDefaultBankView();
    this.npcs = STARTER_NPCS;
    this.resources = generateResourceNodes("copper-lantern-realm-v1", 0.34);
    const appearance = createDefaultAppearance();
    this.state = {
      phase: "booting",
      completedGuideSteps: [],
      mapOpen: false,
      appearance: { phase: "closed", preview: appearance, confirmed: appearance },
      departure: { phase: "unseen" },
      pending: {},
      notices: ["Local demo authority: presentation-only Welcome Garden slice."],
      roofsVisible: DEFAULT_ROOF_VISIBILITY,
      action: { phase: "idle" },
    };
  }

  public getState(): GardenSceneState {
    return this.state;
  }

  public async boot(): Promise<GardenSceneState> {
    try {
      const snapshot = await this.authority.load();
      this.state = { ...this.state, phase: "ready", snapshot, activeGuideStepId: "look-around" };
    } catch {
      this.state = { ...this.state, phase: "failed", notices: [...this.state.notices, "The garden could not load. Try again."] };
    }
    return this.state;
  }

  public async handle(input: GardenInput): Promise<GardenSceneState> {
    switch (input.type) {
      case "camera.changed":
        return this.record({ type: "camera.changed" });
      case "overview.set-open":
        this.state = { ...this.state, mapOpen: input.open };
        return input.open ? this.record({ type: "overview.opened" }) : this.state;
      case "roof.visibility.toggle":
        this.state = { ...this.state, roofsVisible: toggleRoofVisibility(this.state.roofsVisible) };
        return this.state;
      case "ground.selected":
        return this.submitMove(input.destination);
      case "resource.selected":
        return this.submitHarvest(input.nodeId, input.tool, input.skillLevel, input.nowSeconds);
      case "bank.tab.select":
        return this.submitBankTab(input.tab);
      case "bank.deposit":
        return this.submitDeposit(input.itemId, input.quantity);
      case "bank.withdraw":
        return this.submitWithdraw(input.itemId, input.quantity);
      case "appearance.preview":
        if (!this.state.snapshot) return this.state;
        this.state = { ...this.state, appearance: { ...this.state.appearance, phase: "previewing", preview: applyAppearancePatch(this.state.appearance.preview, input.patch) } };
        return this.state;
      case "appearance.cancel":
        this.state = { ...this.state, appearance: { ...this.state.appearance, phase: "closed", preview: this.state.appearance.confirmed } };
        return this.state;
      case "appearance.confirm":
        return this.submitAppearance();
      case "pocketbook.open":
        this.state = { ...this.state, pocketbookPageId: input.pageId };
        return this.record({ type: "pocketbook.opened", pageId: input.pageId });
      case "anchor.selected":
        this.state = { ...this.state, selectedAnchorId: input.anchorId };
        if (input.anchorId === "departure-gate") {
          this.state = { ...this.state, departure: { phase: "inspecting" } };
          return this.record({ type: "departure.inspected" });
        }
        return this.record({ type: "anchor.interaction.acknowledged", anchorId: input.anchorId });
      case "departure.inspect":
        this.state = { ...this.state, departure: { phase: "inspecting" } };
        return this.record({ type: "departure.inspected" });
      case "departure.confirm":
        return this.submitDeparture();
      case "notice.dismiss":
        this.state = { ...this.state, notices: this.state.notices.filter((notice) => notice !== input.noticeId) };
        return this.state;
    }
  }

  public render(timeSeconds: number, deltaSeconds: number): GardenRenderModel {
    const snapshot = this.state.snapshot;
    const district = getDistrictForLevel("welcome-garden-ground");
    const realm = createRealmOverview({
      realmId: "copper-lantern-realm-01",
      title: "Sable Fen Welcome Garden",
      subtitle: "A quiet first step into a larger world",
      worldSpace: snapshot?.worldSpace ?? "sable-fen",
      levelId: snapshot?.levelId ?? "welcome-garden-ground",
      region: district?.title ?? "Welcome Garden",
      weather: "Warm dawn",
      discoveredLandmarks: this.state.completedGuideSteps.includes("look-around") ? 1 : 0,
      totalLandmarks: 3,
      markers: BEGINNER_SAFE_AREA.anchors.map((anchor) => ({
        id: anchor.id,
        label: anchor.label,
        kind: anchor.kind === "departure-gate" ? "portal" : anchor.attraction === "primary" ? "landmark" : "objective",
        x: anchor.tile.x,
        y: anchor.tile.y,
        levelId: "welcome-garden-ground",
      })),
    });
    const hud = createHudOverview(realm, {
      breadcrumb: buildLocationBreadcrumb("sable-fen", "welcome-garden-ground", snapshot?.player.tile ?? BEGINNER_SAFE_AREA.area.spawnTile),
      statusText: snapshot?.source === "local-demo" ? "Local demo garden — no online save" : "Connected",
      mapOpen: this.state.mapOpen,
      activePortal: snapshot ? { label: snapshot.portal.label, destination: snapshot.portal.destinationLabel, available: snapshot.portal.available } : undefined,
      objective: this.state.activeGuideStepId ? { title: getNextGuideStep([...this.state.completedGuideSteps])?.title ?? "Welcome", progress: `${this.state.completedGuideSteps.length}/${BEGINNER_GUIDE_PACKAGE.steps.length}`, detail: getNextGuideStep([...this.state.completedGuideSteps])?.plainLanguage ?? "Explore at your own pace." } : undefined,
    });
    const compass = createCompassHud(snapshot?.player.facingRadians ?? 0);
    const roofs = createRoofVisibilityModel(this.state.roofsVisible);
    const hudPresentation = createHudPresentation({
      overview: hud,
      compass,
      roof: roofs,
      resources: this.resources,
      realmObjects: this.realmObjects,
      details: this.details,
      action: this.state.action.phase === "accepted"
          ? { phase: "accepted", label: this.state.action.label ?? "Action complete", resourceId: this.state.action.resourceId, rewardText: this.state.action.rewardText }
        : this.state.action.phase === "rejected"
          ? { phase: "rejected", label: this.state.action.label ?? "Action failed", errorText: this.state.action.error?.message }
          : { phase: this.state.action.phase, label: this.state.action.label ?? (this.state.action.phase === "pending" ? "Working…" : "Ready"), resourceId: this.state.action.resourceId },
      inventory: snapshot ? { items: snapshot.inventory, totalItemCount: Object.values(snapshot.inventory).reduce((sum, count) => sum + count, 0) } : undefined,
    });
    const terrainElevation = snapshot ? mountainElevationAt(snapshot.player.tile) ?? 0 : 0;
    const avatar = snapshot ? {
      position: gardenTransform.tileToWorld(snapshot.player.tile, terrainElevation),
      terrainElevation,
      facingRadians: snapshot.player.facingRadians,
      pose: this.motion.update({ playerId: snapshot.player.playerId, timeSeconds, deltaSeconds, state: snapshot.player.motion, speed01: snapshot.player.speed01, facingRadians: snapshot.player.facingRadians }),
      appearance: this.state.appearance.preview,
      equippedWeapon: DEFAULT_STARTER_LOADOUT,
    } : undefined;
    return {
      state: this.state,
      hud,
      hudPresentation,
      anchors: BEGINNER_SAFE_AREA.anchors,
      details: this.details,
      starterArmorTable: WELCOME_GARDEN_STARTER_ARMOR_TABLE,
      mapBounds: EXPANDED_REALM_BOUNDS,
      compass,
      mountain: FROSTCROWN_MOUNTAIN,
      beach: SUNWASH_BEACH,
      marsh: GLOAMFEN_MARSH,
      xeriscape: REDGLASS_XERISCAPE,
      realmObjects: this.realmObjects,
      physicalProperties: REALM_PHYSICAL_PROPERTIES,
      roofs,
      bank: snapshot?.bank ?? this.bank,
      npcs: this.npcs,
      resources: this.resources,
      avatar,
      timeSeconds,
    };
  }

  private nextRequestId(prefix: string): string {
    this.requestCounter += 1;
    return `${prefix}-${this.requestCounter}`;
  }

  private async submitMove(destination: GardenTile): Promise<GardenSceneState> {
    const requestId = this.nextRequestId("move");
    try {
      const snapshot = await this.authority.submit({ type: "move.request", requestId, destination });
      this.state = { ...this.state, snapshot, pending: { ...this.state.pending, [requestId]: "accepted" } };
      return this.record({ type: "move.acknowledged", destination });
    } catch (cause) {
      return this.reject(requestId, cause);
    }
  }

  private async submitHarvest(nodeId: string, tool: ResourceTool, skillLevel: number, nowSeconds: number): Promise<GardenSceneState> {
    const requestId = this.nextRequestId("harvest");
    const node = this.resources.find((candidate) => candidate.id === nodeId);
    this.state = { ...this.state, action: { phase: "pending", resourceId: node?.resourceId }, pending: { ...this.state.pending, [requestId]: "pending" } };
    try {
      const snapshot = await this.authority.submit({ type: "resource.harvest", requestId, nodeId, tool, skillLevel, nowSeconds });
      const itemIds = Object.keys(snapshot.inventory);
      const rewardItem = itemIds[itemIds.length - 1];
      const rewardQuantity = rewardItem ? snapshot.inventory[rewardItem] : 0;
      this.state = { ...this.state, snapshot, action: { phase: "accepted", label: "Harvest complete", resourceId: node?.resourceId, rewardText: rewardItem ? `+${rewardQuantity} ${rewardItem}` : "Harvest complete" }, pending: { ...this.state.pending, [requestId]: "accepted" } };
      return this.state;
    } catch (cause) {
      const rejected = this.reject(requestId, cause);
      this.state = { ...rejected, action: { phase: "rejected", resourceId: node?.resourceId, error: rejected.lastError } };
      return this.state;
    }
  }

  private async submitBankTab(tab: BankTabId): Promise<GardenSceneState> {
    const requestId = this.nextRequestId("bank-tab");
    try {
      const snapshot = await this.authority.submit({ type: "bank.tab.select", requestId, tab });
      this.state = { ...this.state, snapshot, action: { phase: "accepted", label: `Bank tab ${tab + 1} selected` }, pending: { ...this.state.pending, [requestId]: "accepted" } };
      return this.state;
    } catch (cause) {
      return this.reject(requestId, cause);
    }
  }

  private async submitDeposit(itemId: BankItemId, quantity: number): Promise<GardenSceneState> {
    const requestId = this.nextRequestId("deposit");
    this.state = { ...this.state, action: { phase: "pending", label: "Depositing" }, pending: { ...this.state.pending, [requestId]: "pending" } };
    try {
      const before = this.state.snapshot?.inventory[itemId] ?? 0;
      const snapshot = await this.authority.submit({ type: "bank.deposit", requestId, itemId, quantity, tab: this.state.snapshot?.bank.activeTab ?? 0 });
      this.state = { ...this.state, snapshot, action: { phase: "accepted", label: "Deposit complete", rewardText: `${quantity} ${itemId} banked (${before - (snapshot.inventory[itemId] ?? 0)} removed)` }, pending: { ...this.state.pending, [requestId]: "accepted" } };
      return this.state;
    } catch (cause) {
      const rejected = this.reject(requestId, cause);
      this.state = { ...rejected, action: { phase: "rejected", label: "Deposit failed", error: rejected.lastError } };
      return this.state;
    }
  }

  private async submitWithdraw(itemId: BankItemId, quantity: number): Promise<GardenSceneState> {
    const requestId = this.nextRequestId("withdraw");
    this.state = { ...this.state, action: { phase: "pending", label: "Withdrawing" }, pending: { ...this.state.pending, [requestId]: "pending" } };
    try {
      const snapshot = await this.authority.submit({ type: "bank.withdraw", requestId, itemId, quantity, tab: this.state.snapshot?.bank.activeTab ?? 0 });
      this.state = { ...this.state, snapshot, action: { phase: "accepted", label: "Withdrawal complete", rewardText: `+${quantity} ${itemId}` }, pending: { ...this.state.pending, [requestId]: "accepted" } };
      return this.state;
    } catch (cause) {
      const rejected = this.reject(requestId, cause);
      this.state = { ...rejected, action: { phase: "rejected", label: "Withdrawal failed", error: rejected.lastError } };
      return this.state;
    }
  }

  private async submitAppearance(): Promise<GardenSceneState> {
    if (!this.state.snapshot) return this.state;
    const requestId = this.nextRequestId("appearance");
    try {
      const snapshot = await this.authority.submit({ type: "appearance.confirm", requestId, baseRevision: this.state.snapshot.revision, patch: this.state.appearance.preview });
      this.state = { ...this.state, snapshot, pending: { ...this.state.pending, [requestId]: "accepted" }, appearance: { phase: "confirmed", preview: snapshot.player.appearance, confirmed: snapshot.player.appearance } };
      return this.record({ type: "appearance.confirmed" });
    } catch (cause) {
      return this.reject(requestId, cause);
    }
  }

  private async submitDeparture(): Promise<GardenSceneState> {
    const requestId = this.nextRequestId("departure");
    this.state = { ...this.state, departure: { phase: "pending" }, pending: { ...this.state.pending, [requestId]: "pending" } };
    try {
      const snapshot = await this.authority.submit({ type: "departure.confirm", requestId });
      this.state = { ...this.state, snapshot, departure: { phase: "confirmed" }, pending: { ...this.state.pending, [requestId]: "accepted" } };
      return this.record({ type: "departure.confirmed" });
    } catch (cause) {
      return this.reject(requestId, cause, "departure");
    }
  }

  private record(event: GardenProgressEvent): GardenSceneState {
    const mapping: Partial<Record<GardenProgressEvent["type"], GuideStepId>> = {
      "camera.changed": "look-around",
      "move.acknowledged": "move",
      "overview.opened": "open-overview",
      "appearance.confirmed": "shape-character",
      "pocketbook.opened": "read-pocketbook",
      "anchor.interaction.acknowledged": "try-safe-interaction",
      "departure.inspected": "learn-portal",
      "departure.confirmed": "leave-garden",
    };
    const completed = mapping[event.type];
    const completedGuideSteps = completed && !this.state.completedGuideSteps.includes(completed) ? [...this.state.completedGuideSteps, completed] : [...this.state.completedGuideSteps];
    const next = getNextGuideStep(completedGuideSteps);
    this.state = { ...this.state, completedGuideSteps, activeGuideStepId: next?.id };
    return this.state;
  }

  private reject(requestId: string, cause: unknown, phase?: "departure"): GardenSceneState {
    const authorityError = (cause && typeof cause === "object" && "code" in cause && "message" in cause) ? cause as GardenAuthorityError : error("UNKNOWN", "The request was not accepted.", requestId);
    this.state = {
      ...this.state,
      pending: { ...this.state.pending, [requestId]: "rejected" },
      lastError: authorityError,
      appearance: phase ? this.state.appearance : { ...this.state.appearance, phase: "rejected", error: authorityError },
      departure: phase ? { phase: "rejected", error: authorityError } : this.state.departure,
      notices: [...this.state.notices, authorityError.message],
    };
    return this.state;
  }
}

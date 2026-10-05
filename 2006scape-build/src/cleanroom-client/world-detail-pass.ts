/**
 * Project Copper Lantern — micro-detail and overview presentation data.
 *
 * Decorations are deterministic, render-only content. They never create
 * collision, spawn rewards, alter navigation, or become server authority.
 */

export type DetailKind =
  | "moss"
  | "rubble"
  | "reed-cluster"
  | "pebble"
  | "root"
  | "lantern"
  | "banner"
  | "crate"
  | "water-ripple"
  | "dust-mote"
  | "fungal-glow"
  | "footprint";

export type DetailLayer = "ground" | "structure" | "atmosphere" | "interaction-accent";
export type SettingProfile = "wetland-frontier" | "windy-watchtower" | "stone-tunnel" | "dungeon-threshold";

export type DetailInstance = {
  id: string;
  kind: DetailKind;
  layer: DetailLayer;
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
  tint?: string;
  emissive?: number;
  collision: false;
  interactive: false;
};

export type SettingProfileData = {
  profile: SettingProfile;
  groundPalette: string[];
  accentPalette: string[];
  ambientLight: string;
  windStrength: number;
  humidity: number;
  detailDensity: number;
  allowedDetails: DetailKind[];
};

export type MapOverviewMarker = {
  id: string;
  label: string;
  kind: "player" | "landmark" | "portal" | "hub" | "objective";
  x: number;
  y: number;
  levelId: string;
};

export type RealmOverview = {
  realmId: string;
  title: string;
  subtitle: string;
  activeWorldSpace: string;
  activeLevelId: string;
  weatherLabel: string;
  regionLabel: string;
  discoveredLandmarks: number;
  totalLandmarks: number;
  markers: MapOverviewMarker[];
};

export type HudOverviewState = {
  realm: RealmOverview;
  locationBreadcrumb: string[];
  statusText: string;
  activePortal?: { label: string; destination: string; available: boolean };
  objective?: { title: string; progress: string; detail: string };
  mapOpen: boolean;
};

export const SETTING_PROFILES: Record<SettingProfile, SettingProfileData> = {
  "wetland-frontier": {
    profile: "wetland-frontier",
    groundPalette: ["#5D5842", "#6A654A", "#766E4E"],
    accentPalette: ["#6E9B8C", "#B58A4A", "#243A37"],
    ambientLight: "#A9C9BE",
    windStrength: 0.28,
    humidity: 0.72,
    detailDensity: 0.8,
    allowedDetails: ["moss", "rubble", "reed-cluster", "pebble", "root", "lantern", "water-ripple", "dust-mote", "footprint"],
  },
  "windy-watchtower": {
    profile: "windy-watchtower",
    groundPalette: ["#5B5447", "#746A52", "#897956"],
    accentPalette: ["#B88A4B", "#BAC5B4", "#31454A"],
    ambientLight: "#B4C7C1",
    windStrength: 0.78,
    humidity: 0.24,
    detailDensity: 0.48,
    allowedDetails: ["rubble", "pebble", "lantern", "banner", "crate", "dust-mote", "footprint"],
  },
  "stone-tunnel": {
    profile: "stone-tunnel",
    groundPalette: ["#34373A", "#464849", "#5A5145"],
    accentPalette: ["#8B7452", "#668F87", "#B69C63"],
    ambientLight: "#657875",
    windStrength: 0.06,
    humidity: 0.84,
    detailDensity: 0.62,
    allowedDetails: ["moss", "rubble", "pebble", "root", "lantern", "fungal-glow", "water-ripple", "dust-mote"],
  },
  "dungeon-threshold": {
    profile: "dungeon-threshold",
    groundPalette: ["#272A2D", "#3A3634", "#4D4038"],
    accentPalette: ["#A97849", "#6B8B83", "#8D5360"],
    ambientLight: "#4F5B58",
    windStrength: 0.02,
    humidity: 0.46,
    detailDensity: 0.42,
    allowedDetails: ["rubble", "moss", "lantern", "banner", "fungal-glow", "dust-mote"],
  },
};

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random01(seed: number): number {
  let value = seed + 0x6D2B79F5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function choose<T>(items: T[], seed: number): T {
  return items[Math.floor(random01(seed) * items.length) % items.length];
}

function detailAllowed(profile: SettingProfileData, kind: DetailKind): boolean {
  return profile.allowedDetails.includes(kind);
}

export function generateMicroDetails(
  levelId: string,
  profileName: SettingProfile,
  width: number,
  height: number,
  seedText: string,
  densityMultiplier = 1,
): DetailInstance[] {
  const profile = SETTING_PROFILES[profileName];
  const count = Math.max(0, Math.floor(width * height * profile.detailDensity * densityMultiplier * 0.18));
  const output: DetailInstance[] = [];
  const detailKinds = profile.allowedDetails;
  for (let i = 0; i < count; i += 1) {
    const seed = hash32(`${seedText}:${levelId}:${i}`);
    const kind = choose(detailKinds, seed);
    const x = Math.floor(random01(seed + 1) * width);
    const y = Math.floor(random01(seed + 2) * height);
    const palette = profile.accentPalette;
    output.push({
      id: `${levelId}-detail-${i}`,
      kind,
      layer: kind === "dust-mote" || kind === "water-ripple" ? "atmosphere" : kind === "lantern" || kind === "fungal-glow" ? "interaction-accent" : "ground",
      x,
      y,
      z: random01(seed + 3) * 0.04,
      rotation: random01(seed + 4) * Math.PI * 2,
      scale: 0.72 + random01(seed + 5) * 0.58,
      tint: choose(palette, seed + 6),
      emissive: kind === "lantern" || kind === "fungal-glow" ? 0.25 + random01(seed + 7) * 0.35 : 0,
      collision: false,
      interactive: false,
    });
  }
  return output.filter((detail) => detailAllowed(profile, detail.kind));
}

export function createRealmOverview(input: {
  realmId: string;
  title: string;
  subtitle: string;
  worldSpace: string;
  levelId: string;
  region: string;
  weather: string;
  discoveredLandmarks: number;
  totalLandmarks: number;
  markers: MapOverviewMarker[];
}): RealmOverview {
  return {
    realmId: input.realmId,
    title: input.title,
    subtitle: input.subtitle,
    activeWorldSpace: input.worldSpace,
    activeLevelId: input.levelId,
    weatherLabel: input.weather,
    regionLabel: input.region,
    discoveredLandmarks: Math.max(0, Math.min(input.discoveredLandmarks, input.totalLandmarks)),
    totalLandmarks: Math.max(0, input.totalLandmarks),
    markers: input.markers.map((marker) => ({ ...marker })),
  };
}

export function createHudOverview(realm: RealmOverview, options: {
  breadcrumb: string[];
  statusText: string;
  mapOpen?: boolean;
  activePortal?: HudOverviewState["activePortal"];
  objective?: HudOverviewState["objective"];
}): HudOverviewState {
  return {
    realm,
    locationBreadcrumb: [...options.breadcrumb],
    statusText: options.statusText,
    mapOpen: options.mapOpen ?? false,
    activePortal: options.activePortal,
    objective: options.objective,
  };
}

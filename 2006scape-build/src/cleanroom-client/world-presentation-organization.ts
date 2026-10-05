/**
 * Project Copper Lantern — world presentation organization.
 *
 * The plan keeps the map readable and tidy while adding organic variation,
 * physically plausible material cues, and bounded visual richness.
 * Presentation metadata never creates gameplay collision or authority.
 */

export type DistrictKind = "safe-garden" | "wetland" | "settlement" | "highland" | "tower" | "tunnel" | "dungeon";
export type MaterialMood = "wet" | "dry" | "weathered" | "polished" | "subterranean";
export type LandmarkPriority = "hero" | "major" | "minor" | "wayfinding";

export type MapBounds = { minX: number; minY: number; maxX: number; maxY: number };

export type DistrictPlan = {
  id: string;
  title: string;
  kind: DistrictKind;
  levelId: string;
  bounds: MapBounds;
  elevationBand: "low" | "ground" | "upper" | "deep";
  materialMood: MaterialMood;
  basePalette: string[];
  accentPalette: string[];
  propDensity: number;
  landmarkIds: string[];
  tidyRules: string[];
};

export type LandmarkPlan = {
  id: string;
  title: string;
  districtId: string;
  priority: LandmarkPriority;
  tile: { x: number; y: number };
  silhouette: "plinth" | "tower" | "gate" | "bridge" | "garden" | "cave-mouth" | "lantern-cluster" | "dungeon-door";
  overviewColor: string;
  visualCue: string;
};

export type VisualLayerPlan = {
  name: "terrain" | "structures" | "life" | "atmosphere" | "wayfinding" | "hud-overview";
  zOrder: number;
  purpose: string;
  collisionSource: "none" | "authoritative-world-data";
  maxResidentCount: number;
};

export type WorldPresentationPlan = {
  realmId: string;
  title: string;
  coordinatePolicy: string;
  districts: DistrictPlan[];
  landmarks: LandmarkPlan[];
  layers: VisualLayerPlan[];
  realismRules: string[];
  organicMotionRules: string[];
  overviewRules: string[];
};

export const WORLD_PRESENTATION_PLAN: WorldPresentationPlan = {
  realmId: "copper-lantern-realm-01",
  title: "Sable Fen and Ashfen Frontier",
  coordinatePolicy: "Keep authored tile coordinates canonical; presentation offsets never change collision or navigation.",
  districts: [
    {
      id: "welcome-garden",
      title: "Sable Fen Welcome Garden",
      kind: "safe-garden",
      levelId: "welcome-garden-ground",
      bounds: { minX: 2, minY: 5, maxX: 12, maxY: 11 },
      elevationBand: "ground",
      materialMood: "polished",
      basePalette: ["#6E9B8C", "#D6B979", "#EFE2BE"],
      accentPalette: ["#B58A4A", "#243A37", "#8A4F50"],
      propDensity: 0.74,
      landmarkIds: ["welcome-plinth", "stillwater-mirror", "departure-gate"],
      tidyRules: ["keep a clear three-tile arrival sightline", "cluster cosmetics around the mirror", "leave a calm open center for first-time movement"],
    },
    {
      id: "sable-fen-waypost",
      title: "Sable Fen Waypost",
      kind: "wetland",
      levelId: "sable-fen-exterior",
      bounds: { minX: 0, minY: 0, maxX: 14, maxY: 12 },
      elevationBand: "low",
      materialMood: "wet",
      basePalette: ["#5D5842", "#6A654A", "#496D68"],
      accentPalette: ["#6E9B8C", "#B58A4A", "#243A37"],
      propDensity: 0.68,
      landmarkIds: ["waypost-plinth", "reed-patch", "entry-bridge"],
      tidyRules: ["keep water edges coherent", "repeat reed clusters in natural bands", "avoid random props on navigation tiles"],
    },
    {
      id: "fenhold-lodge",
      title: "Fenhold Lodge",
      kind: "settlement",
      levelId: "fenhold-lodge-ground",
      bounds: { minX: 4, minY: 4, maxX: 16, maxY: 13 },
      elevationBand: "ground",
      materialMood: "weathered",
      basePalette: ["#5D5145", "#746149", "#92805E"],
      accentPalette: ["#B58A4A", "#6E9B8C", "#EFE2BE"],
      propDensity: 0.58,
      landmarkIds: ["lodge-entry", "lodge-stair-hall", "lodge-cellar-hatch"],
      tidyRules: ["align porch posts to a clean footprint", "group crates against walls", "reserve a clear center path between entry and stair hall"],
    },
    {
      id: "ashfen-lowlands",
      title: "Ashfen Lowlands",
      kind: "wetland",
      levelId: "ashfen-lowlands",
      bounds: { minX: 0, minY: 0, maxX: 24, maxY: 20 },
      elevationBand: "low",
      materialMood: "wet",
      basePalette: ["#5D5842", "#6A654A", "#766E4E"],
      accentPalette: ["#6E9B8C", "#B58A4A", "#31454A"],
      propDensity: 0.72,
      landmarkIds: ["ashfen-watchtower", "ashfen-sunken-tunnel", "ashfen-ramp"],
      tidyRules: ["use broad path ribbons instead of scattered single tiles", "stage wetland plants at water margins", "keep the tower ramp silhouette unobstructed"],
    },
    {
      id: "ashfen-watchtower",
      title: "Ashfen Watchtower",
      kind: "tower",
      levelId: "ashfen-watchtower-platform",
      bounds: { minX: 2, minY: 2, maxX: 6, maxY: 6 },
      elevationBand: "upper",
      materialMood: "weathered",
      basePalette: ["#5B5447", "#746A52", "#897956"],
      accentPalette: ["#B88A4B", "#BAC5B4", "#31454A"],
      propDensity: 0.44,
      landmarkIds: ["watchtower-platform", "watchtower-ladder"],
      tidyRules: ["keep railings continuous", "leave a stable landing around the ladder", "place banners on the windward side"],
    },
    {
      id: "ashfen-tunnel-entry",
      title: "Ashfen Tunnel Entry",
      kind: "tunnel",
      levelId: "ashfen-tunnel-entry",
      bounds: { minX: 1, minY: 2, maxX: 10, maxY: 6 },
      elevationBand: "deep",
      materialMood: "subterranean",
      basePalette: ["#34373A", "#464849", "#5A5145"],
      accentPalette: ["#8B7452", "#668F87", "#B69C63"],
      propDensity: 0.52,
      landmarkIds: ["tunnel-mouth", "crawl-branch", "dungeon-threshold"],
      tidyRules: ["preserve readable tunnel walls", "place moss where moisture gathers", "keep the dungeon door visible from the hub"],
    },
  ],
  landmarks: [
    { id: "welcome-plinth", title: "Welcome Plinth", districtId: "welcome-garden", priority: "hero", tile: { x: 6, y: 8 }, silhouette: "plinth", overviewColor: "#D6B979", visualCue: "warm central stone with a shallow light halo" },
    { id: "stillwater-mirror", title: "Stillwater Mirror", districtId: "welcome-garden", priority: "hero", tile: { x: 8, y: 8 }, silhouette: "garden", overviewColor: "#6E9B8C", visualCue: "teal water ring and cosmetic light ribbons" },
    { id: "departure-gate", title: "Fenway Departure Gate", districtId: "welcome-garden", priority: "major", tile: { x: 12, y: 8 }, silhouette: "gate", overviewColor: "#B58A4A", visualCue: "two copper uprights and a clean sky gap" },
    { id: "waypost-plinth", title: "Sable Fen Signal Plinth", districtId: "sable-fen-waypost", priority: "hero", tile: { x: 8, y: 4 }, silhouette: "plinth", overviewColor: "#B58A4A", visualCue: "dark stone and lantern-gold cap" },
    { id: "entry-bridge", title: "Entry Bridge", districtId: "sable-fen-waypost", priority: "wayfinding", tile: { x: 2, y: 2 }, silhouette: "bridge", overviewColor: "#6E9B8C", visualCue: "copperwood rails over teal water" },
    { id: "lodge-entry", title: "Fenhold Lodge Entry", districtId: "fenhold-lodge", priority: "major", tile: { x: 11, y: 8 }, silhouette: "gate", overviewColor: "#B58A4A", visualCue: "porch lantern pair" },
    { id: "ashfen-watchtower", title: "Ashfen Watchtower", districtId: "ashfen-lowlands", priority: "hero", tile: { x: 8, y: 7 }, silhouette: "tower", overviewColor: "#B88A4B", visualCue: "vertical tower line with moving banner" },
    { id: "ashfen-sunken-tunnel", title: "Sunken Tunnel", districtId: "ashfen-lowlands", priority: "major", tile: { x: 15, y: 8 }, silhouette: "cave-mouth", overviewColor: "#668F87", visualCue: "dark oval opening with moss edge" },
    { id: "dungeon-threshold", title: "Copperroot Threshold", districtId: "ashfen-tunnel-entry", priority: "major", tile: { x: 8, y: 4 }, silhouette: "dungeon-door", overviewColor: "#8D5360", visualCue: "tall sealed door with two low lanterns" },
  ],
  layers: [
    { name: "terrain", zOrder: 10, purpose: "Ground, water edges, paths, ramps, and tile-aligned surfaces.", collisionSource: "authoritative-world-data", maxResidentCount: 2200 },
    { name: "structures", zOrder: 20, purpose: "Buildings, towers, bridges, doors, railings, and cave shells.", collisionSource: "authoritative-world-data", maxResidentCount: 1200 },
    { name: "life", zOrder: 30, purpose: "Vegetation, props, wildlife silhouettes, cloth motion, and ambient micro-details.", collisionSource: "none", maxResidentCount: 1400 },
    { name: "atmosphere", zOrder: 40, purpose: "Pollen, dust, water rings, light shafts, mist, and bounded weather cues.", collisionSource: "none", maxResidentCount: 500 },
    { name: "wayfinding", zOrder: 50, purpose: "Portal glows, landmark accents, path readability, and arrival focus.", collisionSource: "none", maxResidentCount: 220 },
    { name: "hud-overview", zOrder: 100, purpose: "Realm title, location breadcrumb, map markers, objective, and safe-area notices.", collisionSource: "none", maxResidentCount: 80 },
  ],
  realismRules: [
    "Use one dominant light direction per level and a restrained fill light.",
    "Keep roughness variation visible: wet ground is darker and less rough than dry stone.",
    "Repeat material families, not identical props; variation should feel authored rather than noisy.",
    "Place clutter against walls, corners, and moisture lines; keep navigation corridors clean.",
    "Use scale references such as doorways, railings, stairs, and player height consistently.",
    "Use contact shadows and ambient occlusion sparingly to ground objects without muddying the map.",
    "Reserve the highest contrast and brightest accents for landmarks, portals, and safe-area anchors.",
    "Never use decorative geometry as hidden collision or as an unannounced interaction.",
  ],
  organicMotionRules: [
    "Vary plant sway phase by stable tile seed, not by per-frame random calls.",
    "Use slower, larger motion for reeds and banners; faster, smaller motion for pollen and dust.",
    "Keep water rings localized to water edges and interaction anchors.",
    "Let lantern flicker remain below distraction threshold and never imply gameplay damage.",
    "Pause or reduce ambient effects at low quality and on background tabs without changing state.",
  ],
  overviewRules: [
    "Show hero landmarks first, then major and wayfinding landmarks.",
    "Use one marker style per semantic kind across every map level.",
    "Keep the active player marker above all decorative map layers.",
    "Show upstairs, downstairs, tower, and tunnel level names in the breadcrumb.",
    "Use the same district title in the HUD, map overview, and realm loading card.",
  ],
};

export function getDistrictForLevel(levelId: string): DistrictPlan | undefined {
  return WORLD_PRESENTATION_PLAN.districts.find((district) => district.levelId === levelId);
}

export function getDistrictLandmarks(districtId: string): LandmarkPlan[] {
  return WORLD_PRESENTATION_PLAN.landmarks.filter((landmark) => landmark.districtId === districtId);
}

export function buildLocationBreadcrumb(worldSpace: string, levelId: string, tile: { x: number; y: number }): string[] {
  const district = getDistrictForLevel(levelId);
  return [
    WORLD_PRESENTATION_PLAN.title,
    worldSpace,
    district?.title ?? levelId,
    `Tile ${tile.x}, ${tile.y}`,
  ];
}

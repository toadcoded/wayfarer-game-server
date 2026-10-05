/**
 * Project Copper Lantern — beginner-safe login area.
 *
 * This is presentation and onboarding configuration. The server must enforce
 * safe-zone, admission, combat, and persistence rules independently.
 */

export type BeginnerAnchorKind =
  | "welcome-plinth"
  | "cosmetic-mirror"
  | "wardrobe-display"
  | "color-garden"
  | "hair-studio"
  | "face-studio"
  | "tutorial-guide"
  | "map-table"
  | "rest-bench"
  | "departure-gate";

export type SafeAreaPolicy = {
  areaId: string;
  worldSpace: string;
  levelId: string;
  spawnTile: { x: number; y: number };
  spawnRadius: number;
  combatEnabled: false;
  playerDamageEnabled: false;
  hostileSpawnsEnabled: false;
  itemLossEnabled: false;
  tradingEnabled: false;
  logoutRecoverySeconds: number;
  protectedUntilTutorialStep: string;
};

export type VisualAnchor = {
  id: string;
  kind: BeginnerAnchorKind;
  label: string;
  tile: { x: number; y: number };
  attraction: "primary" | "secondary" | "ambient";
  palette: string[];
  cosmeticFeature?: "face" | "hair" | "color" | "body" | "outfit" | "all";
  prompt?: string;
};

export type BeginnerAreaConfig = {
  area: SafeAreaPolicy;
  visualTheme: {
    title: string;
    subtitle: string;
    palette: string[];
    lighting: "warm-dawn" | "soft-daylight" | "lantern-evening";
    cameraFocus: { x: number; y: number; z: number };
    ambientMotion: string[];
  };
  anchors: VisualAnchor[];
  firstSessionPath: string[];
};

export const BEGINNER_SAFE_AREA: BeginnerAreaConfig = {
  area: {
    areaId: "sable-fen-welcome-garden",
    worldSpace: "sable-fen",
    levelId: "welcome-garden-ground",
    spawnTile: { x: 6, y: 8 },
    spawnRadius: 3,
    combatEnabled: false,
    playerDamageEnabled: false,
    hostileSpawnsEnabled: false,
    itemLossEnabled: false,
    tradingEnabled: false,
    logoutRecoverySeconds: 0,
    protectedUntilTutorialStep: "cosmetic-confirmed",
  },
  visualTheme: {
    title: "Sable Fen Welcome Garden",
    subtitle: "A quiet first step into a larger world",
    palette: ["#D6B979", "#6E9B8C", "#243A37", "#B58A4A", "#EFE2BE"],
    lighting: "warm-dawn",
    cameraFocus: { x: 0, y: 2.2, z: 0 },
    ambientMotion: [
      "slow grass and reed sway",
      "soft banner movement",
      "small floating pollen motes",
      "lantern warmth pulsing below perception threshold",
      "shallow water rings around the garden stones",
    ],
  },
  anchors: [
    {
      id: "welcome-plinth",
      kind: "welcome-plinth",
      label: "Welcome Plinth",
      tile: { x: 6, y: 8 },
      attraction: "primary",
      palette: ["#B58A4A", "#243A37", "#EFE2BE"],
      prompt: "Begin by looking around the garden.",
    },
    {
      id: "cosmetic-mirror",
      kind: "cosmetic-mirror",
      label: "Stillwater Mirror",
      tile: { x: 8, y: 8 },
      attraction: "primary",
      palette: ["#6E9B8C", "#D6B979", "#243A37"],
      cosmeticFeature: "all",
      prompt: "Shape your look: face, hair, color, and presentation.",
    },
    {
      id: "hair-studio",
      kind: "hair-studio",
      label: "Copperleaf Hair Studio",
      tile: { x: 9, y: 7 },
      attraction: "secondary",
      palette: ["#B58A4A", "#2E241E", "#6A4A35"],
      cosmeticFeature: "hair",
      prompt: "Try a silhouette, texture, or highlight.",
    },
    {
      id: "face-studio",
      kind: "face-studio",
      label: "Lantern Face Studio",
      tile: { x: 9, y: 9 },
      attraction: "secondary",
      palette: ["#D49A74", "#8A4F50", "#5E8FA3"],
      cosmeticFeature: "face",
      prompt: "Adjust eyes, face shape, freckles, and facial hair.",
    },
    {
      id: "color-garden",
      kind: "color-garden",
      label: "Color Garden",
      tile: { x: 7, y: 10 },
      attraction: "secondary",
      palette: ["#6E9B8C", "#B58A4A", "#8A4F50", "#5E8FA3"],
      cosmeticFeature: "color",
      prompt: "Preview skin, hair, eye, lip, and clothing colors.",
    },
    {
      id: "wardrobe-display",
      kind: "wardrobe-display",
      label: "Wayfarer Wardrobe",
      tile: { x: 5, y: 9 },
      attraction: "secondary",
      palette: ["#243A37", "#B58A4A", "#EFE2BE"],
      cosmeticFeature: "outfit",
      prompt: "Preview beginner-friendly cosmetic layers.",
    },
    {
      id: "tutorial-guide",
      kind: "tutorial-guide",
      label: "Garden Guide",
      tile: { x: 5, y: 7 },
      attraction: "secondary",
      palette: ["#6E9B8C", "#D6B979", "#243A37"],
      prompt: "Learn movement, safe-area rules, and how to open your overview.",
    },
    {
      id: "map-table",
      kind: "map-table",
      label: "Realm Map Table",
      tile: { x: 4, y: 8 },
      attraction: "ambient",
      palette: ["#243A37", "#EFE2BE", "#B58A4A"],
      prompt: "Preview the world without leaving the protected garden.",
    },
    {
      id: "rest-bench",
      kind: "rest-bench",
      label: "Rest Bench",
      tile: { x: 7, y: 6 },
      attraction: "ambient",
      palette: ["#5D5842", "#B58A4A"],
      prompt: "Pause here safely while your character breathes and settles.",
    },
    {
      id: "departure-gate",
      kind: "departure-gate",
      label: "Fenway Departure Gate",
      tile: { x: 12, y: 8 },
      attraction: "primary",
      palette: ["#B58A4A", "#6E9B8C", "#243A37"],
      prompt: "Leave the beginner area after confirming your cosmetic look.",
    },
  ],
  firstSessionPath: [
    "login-admission",
    "safe-spawn",
    "welcome-plinth",
    "cosmetic-mirror",
    "hair-studio",
    "face-studio",
    "color-garden",
    "map-table",
    "cosmetic-confirmed",
    "departure-gate",
  ],
};

export function isProtectedBeginnerArea(area: SafeAreaPolicy, levelId: string): boolean {
  return area.levelId === levelId && area.combatEnabled === false && area.hostileSpawnsEnabled === false;
}

export function getBeginnerAnchor(anchorId: string): VisualAnchor | undefined {
  return BEGINNER_SAFE_AREA.anchors.find((anchor) => anchor.id === anchorId);
}

export function buildBeginnerHud(area: BeginnerAreaConfig, completedStep: string): {
  title: string;
  subtitle: string;
  status: string;
  safeAreaNotice: string;
  nextAnchor?: VisualAnchor;
} {
  const currentIndex = area.firstSessionPath.indexOf(completedStep);
  const nextId = currentIndex >= 0 ? area.firstSessionPath[currentIndex + 1] : area.firstSessionPath[0];
  const nextAnchor = getBeginnerAnchor(nextId);
  return {
    title: area.visualTheme.title,
    subtitle: area.visualTheme.subtitle,
    status: completedStep === "cosmetic-confirmed" ? "Your look is saved for this session." : "Explore safely — no combat or item loss here.",
    safeAreaNotice: "Protected beginner area",
    nextAnchor,
  };
}

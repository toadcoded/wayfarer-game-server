/**
 * Project Copper Lantern — original player appearance data and surface materials.
 * Cosmetic state is presentation-only. It must never affect combat, movement,
 * hitboxes, rewards, permissions, or progression.
 */

export type HexColor = `#${string}`;
export type GenderPresentation = "feminine" | "masculine" | "androgynous" | "custom" | "unspecified";
export type BodyArchetype = "slim" | "average" | "broad" | "tall" | "compact";
export type FaceShape = "soft" | "angular" | "round" | "long" | "weathered";
export type EyeShape = "wide" | "hooded" | "narrow" | "round";
export type HairStyle = "cropped" | "wavy" | "braided" | "coiled" | "long" | "shaved" | "fade";
export type SurfaceFinish = "matte" | "soft-sheen" | "weathered" | "metallic";

export type CosmeticPalette = {
  skin: HexColor;
  skinUndertone: HexColor;
  eye: HexColor;
  hair: HexColor;
  hairHighlight: HexColor;
  lip: HexColor;
  brow: HexColor;
};

export type SurfaceMaterial = {
  slot: "skin" | "hair" | "eyes" | "brows" | "lips" | "clothing" | "accessory";
  baseColor: HexColor;
  secondaryColor?: HexColor;
  finish: SurfaceFinish;
  roughness: number;
  emissiveStrength: number;
  textureKey?: string;
};

export type PlayerAppearance = {
  version: 1;
  genderPresentation: GenderPresentation;
  bodyArchetype: BodyArchetype;
  faceShape: FaceShape;
  eyeShape: EyeShape;
  hairStyle: HairStyle;
  palette: CosmeticPalette;
  scars: string[];
  freckles: boolean;
  facialHairStyle?: "none" | "short" | "full" | "goatee" | "custom";
  materials: SurfaceMaterial[];
};

export type AppearancePatch = Partial<Omit<PlayerAppearance, "version" | "palette" | "materials">> & {
  palette?: Partial<CosmeticPalette>;
  materials?: SurfaceMaterial[];
};

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_SCARS = 4;
const MAX_MATERIALS = 12;

const DEFAULT_PALETTE: CosmeticPalette = {
  skin: "#B97855",
  skinUndertone: "#D49A74",
  eye: "#6CCBFF",
  hair: "#15141A",
  hairHighlight: "#6E687A",
  lip: "#9D5367",
  brow: "#17151D",
};

const DEFAULT_APPEARANCE: PlayerAppearance = {
  version: 1,
  genderPresentation: "androgynous",
  bodyArchetype: "broad",
  faceShape: "angular",
  eyeShape: "hooded",
  hairStyle: "fade",
  palette: DEFAULT_PALETTE,
  scars: ["starter-style-starlet"],
  freckles: true,
  facialHairStyle: "short",
  // Original frosty luxury-streetwear starter look: double-link ice, a crystal
  // pendant, dragonstone-and-gold wristwear, an imbued signet, and in-ear buds.
  materials: [
    {
      slot: "accessory",
      baseColor: "#EAF3FF",
      secondaryColor: "#D7A52F",
      finish: "metallic",
      roughness: 0.1,
      emissiveStrength: 0.22,
      textureKey: "copper-lantern-frost-double-link-chain",
    },
    {
      slot: "accessory",
      baseColor: "#73D7FF",
      secondaryColor: "#D7A52F",
      finish: "metallic",
      roughness: 0.08,
      emissiveStrength: 0.28,
      textureKey: "copper-lantern-furyheart-crystal-amulet",
    },
    {
      slot: "accessory",
      baseColor: "#D7A52F",
      secondaryColor: "#A6334A",
      finish: "metallic",
      roughness: 0.14,
      emissiveStrength: 0.16,
      textureKey: "copper-lantern-dragonstone-goldbar-combat-bracelet",
    },
    {
      slot: "accessory",
      baseColor: "#D7A52F",
      secondaryColor: "#7AD7FF",
      finish: "metallic",
      roughness: 0.12,
      emissiveStrength: 0.22,
      textureKey: "copper-lantern-imbued-wealth-signet-ring",
    },
    {
      slot: "accessory",
      baseColor: "#F5FAFF",
      secondaryColor: "#B8C4D3",
      finish: "soft-sheen",
      roughness: 0.18,
      emissiveStrength: 0.12,
      textureKey: "copper-lantern-frostbuds-in-ear-audio",
    },
    {
      slot: "accessory",
      baseColor: "#B8C4D3",
      secondaryColor: "#FFFFFF",
      finish: "metallic",
      roughness: 0.08,
      emissiveStrength: 0.16,
      textureKey: "copper-lantern-crownline-chronograph",
    },
    {
      slot: "hair",
      baseColor: "#15141A",
      secondaryColor: "#6E687A",
      finish: "soft-sheen",
      roughness: 0.4,
      emissiveStrength: 0.02,
      textureKey: "copper-lantern-fresh-shave-cut-fade",
    },
    {
      slot: "clothing",
      baseColor: "#111018",
      secondaryColor: "#6D1E48",
      finish: "soft-sheen",
      roughness: 0.34,
      emissiveStrength: 0.02,
      textureKey: "copper-lantern-midnight-brocade-jacket",
    },
    {
      slot: "clothing",
      baseColor: "#241B2D",
      secondaryColor: "#D7A52F",
      finish: "soft-sheen",
      roughness: 0.42,
      emissiveStrength: 0.01,
      textureKey: "copper-lantern-plum-satin-trim",
    },
  ],
};

function isColor(value: unknown): value is HexColor {
  return typeof value === "string" && COLOR_RE.test(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clonePalette(palette: CosmeticPalette): CosmeticPalette {
  return { ...palette };
}

function cloneAppearance(appearance: PlayerAppearance): PlayerAppearance {
  return {
    ...appearance,
    palette: clonePalette(appearance.palette),
    scars: [...appearance.scars],
    materials: appearance.materials.map((material) => ({ ...material })),
  };
}

export function createDefaultAppearance(): PlayerAppearance {
  return cloneAppearance(DEFAULT_APPEARANCE);
}

/**
 * Apply a cosmetic patch while ignoring invalid presentation values.
 * Server code should still validate ownership of unlocked cosmetic IDs.
 */
export function applyAppearancePatch(
  current: PlayerAppearance,
  patch: AppearancePatch,
): PlayerAppearance {
  const next = cloneAppearance(current);
  if (patch.genderPresentation) next.genderPresentation = patch.genderPresentation;
  if (patch.bodyArchetype) next.bodyArchetype = patch.bodyArchetype;
  if (patch.faceShape) next.faceShape = patch.faceShape;
  if (patch.eyeShape) next.eyeShape = patch.eyeShape;
  if (patch.hairStyle) next.hairStyle = patch.hairStyle;
  if (patch.facialHairStyle) next.facialHairStyle = patch.facialHairStyle;
  if (typeof patch.freckles === "boolean") next.freckles = patch.freckles;
  if (patch.scars) next.scars = patch.scars.slice(0, MAX_SCARS);
  if (patch.palette) {
    for (const key of Object.keys(next.palette) as Array<keyof CosmeticPalette>) {
      const value = patch.palette[key];
      if (isColor(value)) next.palette[key] = value;
    }
  }
  if (patch.materials) next.materials = patch.materials.slice(0, MAX_MATERIALS).map((m) => ({ ...m }));
  return sanitizeAppearance(next);
}

export function sanitizeAppearance(input: PlayerAppearance): PlayerAppearance {
  const appearance = cloneAppearance(input);
  appearance.version = 1;
  appearance.scars = appearance.scars.filter((scar) => typeof scar === "string" && scar.length <= 48).slice(0, MAX_SCARS);
  appearance.materials = appearance.materials.filter((material) => {
    return material && isColor(material.baseColor) &&
      (!material.secondaryColor || isColor(material.secondaryColor)) &&
      Number.isFinite(material.roughness) && Number.isFinite(material.emissiveStrength);
  }).slice(0, MAX_MATERIALS).map((material) => ({
    ...material,
    roughness: clamp(material.roughness, 0.05, 1),
    emissiveStrength: clamp(material.emissiveStrength, 0, 1),
  }));
  for (const key of Object.keys(appearance.palette) as Array<keyof CosmeticPalette>) {
    if (!isColor(appearance.palette[key])) appearance.palette[key] = DEFAULT_PALETTE[key];
  }
  return appearance;
}

/**
 * Convert appearance choices into renderer-ready material slots.
 * This function has no authority over equipment, stats, or hitboxes.
 */
export function buildSurfaceMaterials(appearance: PlayerAppearance): SurfaceMaterial[] {
  const safe = sanitizeAppearance(appearance);
  const p = safe.palette;
  const materials: SurfaceMaterial[] = [
    { slot: "skin", baseColor: p.skin, secondaryColor: p.skinUndertone, finish: "soft-sheen", roughness: 0.78, emissiveStrength: 0 },
    { slot: "eyes", baseColor: p.eye, finish: "soft-sheen", roughness: 0.22, emissiveStrength: 0.02 },
    { slot: "hair", baseColor: p.hair, secondaryColor: p.hairHighlight, finish: "matte", roughness: 0.92, emissiveStrength: 0 },
    { slot: "brows", baseColor: p.brow, finish: "matte", roughness: 0.94, emissiveStrength: 0 },
    { slot: "lips", baseColor: p.lip, finish: "soft-sheen", roughness: 0.58, emissiveStrength: 0 },
  ];
  return materials.concat(safe.materials);
}

export type AppearanceMorphs = {
  shoulderWidth: number;
  torsoHeight: number;
  legLength: number;
  jawWidth: number;
  cheekFullness: number;
  eyeOpenness: number;
  hairVolume: number;
};

/** Body presentation changes silhouette only; it never changes the gameplay capsule. */
export function buildAppearanceMorphs(appearance: PlayerAppearance): AppearanceMorphs {
  const safe = sanitizeAppearance(appearance);
  const body = {
    slim: { shoulderWidth: -0.12, torsoHeight: 0.02, legLength: 0.03 },
    average: { shoulderWidth: 0, torsoHeight: 0, legLength: 0 },
    broad: { shoulderWidth: 0.16, torsoHeight: 0.01, legLength: -0.01 },
    tall: { shoulderWidth: 0.04, torsoHeight: 0.14, legLength: 0.16 },
    compact: { shoulderWidth: 0.03, torsoHeight: -0.1, legLength: -0.08 },
  }[safe.bodyArchetype];
  const face = {
    soft: { jawWidth: -0.03, cheekFullness: 0.12 },
    angular: { jawWidth: 0.14, cheekFullness: -0.06 },
    round: { jawWidth: 0.1, cheekFullness: 0.2 },
    long: { jawWidth: -0.02, cheekFullness: -0.08 },
    weathered: { jawWidth: 0.06, cheekFullness: -0.02 },
  }[safe.faceShape];
  return {
    ...body,
    ...face,
    eyeOpenness: { wide: 0.16, hooded: -0.1, narrow: -0.15, round: 0.08 }[safe.eyeShape],
    hairVolume: { cropped: 0.05, wavy: 0.2, braided: 0.12, coiled: 0.18, long: 0.28, shaved: -0.18, fade: 0.02 }[safe.hairStyle],
  };
}

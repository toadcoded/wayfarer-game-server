export const COSMETIC_GENDERS = ["feminine", "masculine", "androgynous"] as const;
export type CosmeticGender = (typeof COSMETIC_GENDERS)[number];

export const HAIR_STYLES = ["cropped", "braided", "topknot", "long", "shaved"] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const EYE_STYLES = ["round", "sharp", "sleepy", "bright"] as const;
export type EyeStyle = (typeof EYE_STYLES)[number];

export const CLOTHING_STYLES = ["traveler", "ranger", "scholar", "guard", "fisher"] as const;
export type ClothingStyle = (typeof CLOTHING_STYLES)[number];

export const APPAREL_STYLES = ["cloak", "cape", "scarf", "pauldron", "satchel"] as const;
export type ApparelStyle = (typeof APPAREL_STYLES)[number];

export type CharacterCosmetics = {
  gender: CosmeticGender;
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeStyle: EyeStyle;
  eyeColor: string;
  clothingStyle: ClothingStyle;
  clothingColor: string;
  apparelStyle: ApparelStyle;
  apparelColor: string;
};

export const COSMETIC_PALETTE = {
  skin: ["#f0c7a2", "#d89b73", "#a9674d", "#704330", "#4d3029"],
  hair: ["#201a1c", "#4b2f25", "#806044", "#b58a4d", "#d3c2a0", "#526c68"],
  eyes: ["#22343b", "#315b67", "#526b45", "#76553c", "#6e4860"],
  clothing: ["#3f6b55", "#465d82", "#72534d", "#6f7048", "#514b63", "#a9784e"],
  apparel: ["#283d42", "#5b3f58", "#8b5e3c", "#737a65", "#a88b55", "#413d4d"],
} as const;

export const DEFAULT_COSMETICS: CharacterCosmetics = {
  gender: "androgynous",
  skinColor: COSMETIC_PALETTE.skin[1],
  hairStyle: "cropped",
  hairColor: COSMETIC_PALETTE.hair[0],
  eyeStyle: "round",
  eyeColor: COSMETIC_PALETTE.eyes[1],
  clothingStyle: "traveler",
  clothingColor: COSMETIC_PALETTE.clothing[0],
  apparelStyle: "cloak",
  apparelColor: COSMETIC_PALETTE.apparel[0],
};

const includes = <T extends readonly string[]>(values: T, value: unknown): value is T[number] => typeof value === "string" && values.includes(value);
const paletteValue = (values: readonly string[], value: unknown, fallback: string) => typeof value === "string" && values.includes(value) ? value : fallback;

export function normalizeCosmetics(input: unknown): CharacterCosmetics {
  const raw = input && typeof input === "object" ? input as Partial<CharacterCosmetics> : {};
  return {
    gender: includes(COSMETIC_GENDERS, raw.gender) ? raw.gender : DEFAULT_COSMETICS.gender,
    skinColor: paletteValue(COSMETIC_PALETTE.skin, raw.skinColor, DEFAULT_COSMETICS.skinColor),
    hairStyle: includes(HAIR_STYLES, raw.hairStyle) ? raw.hairStyle : DEFAULT_COSMETICS.hairStyle,
    hairColor: paletteValue(COSMETIC_PALETTE.hair, raw.hairColor, DEFAULT_COSMETICS.hairColor),
    eyeStyle: includes(EYE_STYLES, raw.eyeStyle) ? raw.eyeStyle : DEFAULT_COSMETICS.eyeStyle,
    eyeColor: paletteValue(COSMETIC_PALETTE.eyes, raw.eyeColor, DEFAULT_COSMETICS.eyeColor),
    clothingStyle: includes(CLOTHING_STYLES, raw.clothingStyle) ? raw.clothingStyle : DEFAULT_COSMETICS.clothingStyle,
    clothingColor: paletteValue(COSMETIC_PALETTE.clothing, raw.clothingColor, DEFAULT_COSMETICS.clothingColor),
    apparelStyle: includes(APPAREL_STYLES, raw.apparelStyle) ? raw.apparelStyle : DEFAULT_COSMETICS.apparelStyle,
    apparelColor: paletteValue(COSMETIC_PALETTE.apparel, raw.apparelColor, DEFAULT_COSMETICS.apparelColor),
  };
}

export function isCharacterCosmetics(value: unknown): value is CharacterCosmetics {
  return JSON.stringify(normalizeCosmetics(value)) === JSON.stringify(value);
}

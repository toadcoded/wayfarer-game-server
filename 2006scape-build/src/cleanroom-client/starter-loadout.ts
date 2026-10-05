/**
 * Project Copper Lantern — original starter loadout presentation.
 *
 * These values describe what the client can display. Moderator special access
 * and one-time armour grants remain server-authoritative.
 */

export type StarterWeaponId = "granite-maul";
export type WeaponHand = "right" | "left" | "two-handed";

export type WeaponCosmeticStyle = Readonly<{
  silhouette: "granite-maul";
  primaryFinish: "frost-granite";
  inlayFinish: "auric-brass";
  gemAccent: "ice-diamond";
  glow: "moderator-cyan";
  textureKeys: readonly [string, string, string];
}>;

export type StarterWeaponLoadout = Readonly<{
  id: StarterWeaponId;
  displayName: "Granite Maul";
  hand: WeaponHand;
  material: "granite";
  accent: "frost-steel";
  style: WeaponCosmeticStyle;
  startupEquipped: boolean;
  specialAttack: Readonly<{
    id: "double-whack";
    hits: 2;
    energyCost: 50;
    moderatorPolicy: "server-authorized-unlimited";
  }>;
}>;

export type StarterArmorPieceId = "brass-helm" | "brass-plate" | "brass-greaves" | "brass-boots";

export type StarterArmorTable = Readonly<{
  tableId: "welcome-garden-brass-armour-table";
  displayName: "Brass Starter Armour";
  claimableBy: "every-new-character";
  claimPolicy: "once-per-character";
  pieces: readonly StarterArmorPieceId[];
  material: "brushed-brass";
  accent: "warm-gold";
}>;

export const DEFAULT_STARTER_LOADOUT: StarterWeaponLoadout = {
  id: "granite-maul",
  displayName: "Granite Maul",
  hand: "two-handed",
  material: "granite",
  accent: "frost-steel",
  style: {
    silhouette: "granite-maul",
    primaryFinish: "frost-granite",
    inlayFinish: "auric-brass",
    gemAccent: "ice-diamond",
    glow: "moderator-cyan",
    textureKeys: [
      "copper-lantern-frost-granite-maul",
      "copper-lantern-auric-brass-moderator-inlay",
      "copper-lantern-ice-diamond-pommel",
    ],
  },
  startupEquipped: true,
  specialAttack: {
    id: "double-whack",
    hits: 2,
    energyCost: 50,
    moderatorPolicy: "server-authorized-unlimited",
  },
};

export const WELCOME_GARDEN_STARTER_ARMOR_TABLE: StarterArmorTable = {
  tableId: "welcome-garden-brass-armour-table",
  displayName: "Brass Starter Armour",
  claimableBy: "every-new-character",
  claimPolicy: "once-per-character",
  pieces: ["brass-helm", "brass-plate", "brass-greaves", "brass-boots"],
  material: "brushed-brass",
  accent: "warm-gold",
};

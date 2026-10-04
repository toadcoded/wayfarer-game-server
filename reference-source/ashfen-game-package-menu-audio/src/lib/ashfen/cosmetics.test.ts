import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_COSMETICS, isCharacterCosmetics, normalizeCosmetics } from "./cosmetics.ts";
import { normalizeAppearance } from "./player.ts";

test("cosmetics normalize unknown persisted values to safe defaults", () => {
  const value = normalizeCosmetics({ gender: "unknown", hairStyle: "neon", skinColor: "javascript:bad", eyeColor: "#315b67" });
  assert.equal(value.gender, DEFAULT_COSMETICS.gender);
  assert.equal(value.hairStyle, DEFAULT_COSMETICS.hairStyle);
  assert.equal(value.skinColor, DEFAULT_COSMETICS.skinColor);
  assert.equal(value.eyeColor, "#315b67");
});

test("cosmetics guard accepts exact typed palette values only", () => {
  assert.equal(isCharacterCosmetics(DEFAULT_COSMETICS), true);
  assert.equal(isCharacterCosmetics({ ...DEFAULT_COSMETICS, hairColor: "#fff" }), false);
});

test("legacy appearance is upgraded without losing equipment flags", () => {
  const appearance = normalizeAppearance({ cloak: "ash", staff: true, blade: false, hairStyle: "braided" });
  assert.equal(appearance.cloak, "ash");
  assert.equal(appearance.staff, true);
  assert.equal(appearance.blade, false);
  assert.equal(appearance.hairStyle, "braided");
});

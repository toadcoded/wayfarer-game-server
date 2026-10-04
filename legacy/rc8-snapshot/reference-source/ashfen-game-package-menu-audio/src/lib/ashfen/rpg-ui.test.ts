import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PREFERENCES, audioGain, normalizePreferences } from "./settings.ts";
import { advanceEmote, beginEmote } from "./emotes.ts";
import { craftRecipe, EMPTY_EQUIPMENT, deriveStats, previewDeathRisk } from "./rpg.ts";

test("settings clamp hostile audio values and preserve authored choices", () => {
  const prefs = normalizePreferences({ brightness: 130, audio: { masterVolume: 9, musicVolume: -2, soundtrack: "bogus" } });
  assert.equal(prefs.brightness, 130);
  assert.equal(prefs.audio.masterVolume, 1);
  assert.equal(prefs.audio.musicVolume, 0);
  assert.equal(prefs.audio.soundtrack, DEFAULT_PREFERENCES.audio.soundtrack);
  assert.equal(audioGain(prefs.audio, "music"), 0);
});

test("emotes expire on deterministic simulation ticks", () => {
  const active = beginEmote("cheer", 12, 99);
  assert.equal(advanceEmote(active, 15)?.id, "cheer");
  assert.equal(advanceEmote(active, 16), null);
});

test("derived stats sum skills and equipment exactly once", () => {
  const stats = deriveStats({ Vitality: { level: 10 }, Strike: { level: 3 } }, { ...EMPTY_EQUIPMENT, weapon: "reed-blade" }, { "reed-blade": { id: "reed-blade", name: "Reed blade", category: "gear", value: 80, stackable: false, bonuses: { strike: 1 } } });
  assert.equal(stats.maxHp, 10);
  assert.equal(stats.strike, 4);
});

test("unskulled wilderness risk keeps three most valuable entries", () => {
  const risk = previewDeathRisk([{ id: "a", name: "A", qty: 1, value: 10, protected: false }, { id: "b", name: "B", qty: 1, value: 30, protected: false }, { id: "c", name: "C", qty: 1, value: 20, protected: false }, { id: "d", name: "D", qty: 1, value: 5, protected: false }], 7, { kind: "unskulled" }, "wilderness");
  assert.deepEqual(risk.keep.map((item) => item.id).sort(), ["a", "b", "c"].sort());
  assert.equal(risk.lose[0]?.id, "d");
});

test("crafting consumes only required materials and creates typed equipment", () => {
  const result = craftRecipe("mire-axe", [
    { id: "ash-log", name: "Ash log", qty: 3 },
    { id: "bogstone", name: "Bogstone", qty: 2 },
    { id: "raw-fish", name: "Raw mirefish", qty: 4 },
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.result.slot, "weapon");
  assert.deepEqual(result.pack, [
    { id: "raw-fish", name: "Raw mirefish", qty: 4 },
    { id: "mire-axe", name: "Mire axe", qty: 1 },
  ]);
});

test("crafting fails atomically when materials are missing", () => {
  const inventory = [{ id: "ash-log", name: "Ash log", qty: 1 }];
  const result = craftRecipe("fen-mail", inventory);
  assert.equal(result.ok, false);
  assert.deepEqual(result.pack, inventory);
});

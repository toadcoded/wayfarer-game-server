# Wayfarer v1.1 — PolyCodex interface

This release keeps the v1.0 authoritative realm protocol and persistent gameplay contract intact while adding a new original presentation/game-feel layer inspired by the project references.

## New

- 12-node **Resonance PolyCodex** with original rune names, color families, musical note labels, deterministic three-node chord resolution, local cooldown, optional Web Audio tones, and explicit fantasy-only framing.
- A physical **dodecahedral PolyCodex device** in the Babylon world, ringed by 12 colored resonance nodes. HUD selections light the matching 3D nodes; casting a chord produces a temporary local light burst.
- North-up **circular minimap** showing the local player, nearby players, NPCs, Halden/camp, and the landing beacon.
- Compact **system/public chat surface**. System events are real local/realm state messages; Public is intentionally labeled unavailable until a network chat transport exists. The client does not invent fake remote chatters.
- Seventh HUD tab, **Codex**, added without removing Practice, Combat, Gathering, Quest, Inventory, or Settings.
- Mobile reflow for the minimap, chat surface, seven-tab HUD, and resonance wheel.

## Authority boundary

The server remains authoritative for identity, movement, combat/training, quest state, inventory, progression, skilling and snapshots. Resonance effects in v1.1 are intentionally cosmetic/local; they do not alter authoritative movement, combat, loot, XP, or persistence. This avoids silently expanding the network/persistence schema before a versioned protocol migration is designed and tested.

The note/color layout is fictional game design. It does not assert that colors, frequencies, dodecahedral geometry, or resonance effects have medical or physical powers.

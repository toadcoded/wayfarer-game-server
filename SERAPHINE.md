# Seraphine — Moonlit Sentinel

rc.10 adds a procedural 3D transform-node rig in multiplayer: facial features, winged crown/diadem, long hair, ivory armor/skirt, sapphire gems and pinned animated crescent cape. Distinct idle/walk/cape profile; all equipment and gameplay requirements stay server-owned. No automatic crystal weapon, unique spell or combat bonus. Original PNG remains 2D fallback/offline art. GPU visual review is pending; see `3D-RENDERING.md`. Older notes below are historical.

Seraphine wears sapphire-blue and ivory armor edged in gold, a winged crown and a crescent-moon cape. Her crystal sword is a visual part of the supplied artwork.

Suggested lore: a watchkeeper of the moonlit causeways, Seraphine escorts travelers through the reedlands and protects the landing lanterns. Calm, observant and steadfast, she believes a safe path is worth more than a glorious battle.

## Implemented

- Select **Seraphine · Moonlit Sentinel** in Appearance in the realm or offline walking preview.
- Her appearance replicates to nearby players and survives local saved-profile restoration.
- The original transparent 533 × 735 PNG is retained unchanged, rendered as a single-pose sprite with existing movement bob/lean.
- Existing earned equipment and server-owned combat rules apply unchanged. The pictured crystal sword is cosmetic; choosing Seraphine grants no weapon, damage bonus or inventory item.
- Asset validation allows bounded high-resolution source frames, with an 8,388,608-pixel sheet budget and the existing 2 MB PNG transfer cap.

## Not yet implemented

Directional walk frames, rigged 3D mesh, attack animation, unique abilities, voice and an NPC quest role. The title and lore are design additions, not extra mechanics. Supplied art ownership/licensing is unverified; resolve that before public distribution.

This is internal v0.8 rc.8, not a public v0.8.1 release. rc.7 is preserved. Fresh browser rendering remains unverified because the available Chromium runtime crashes before page startup.

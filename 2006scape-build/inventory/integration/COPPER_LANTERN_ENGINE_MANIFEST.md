# Copper Lantern Engine Manifest

**Purpose:** Canonical map of the clean-room source modules and their engine-facing role.

## Active integration surface

| Area | Source | Engine role | Validation |
|---|---|---|---|
| Scene authority | `welcome-garden/welcome-garden-slice.ts` | Boots local authority, handles intents, composes render model | Welcome Garden integration test |
| HUD and minimap | `hud-system.ts`, `compass.ts` | Typed panels, chat tabs, layers, symbols, resource/object markers | HUD assertions in Welcome Garden test |
| Resources | `resource-system.ts` | Deterministic nodes, tools, levels, yields, cooldowns | Resource system test |
| NPCs | `npc-system.ts` | Dialogue, reputation, flags, trade offers | NPC system test |
| Bank | `bank-system.ts` | Tabs, stacks, placeholders, notes, search | Bank system test |
| World presentation | `realm-expansion.ts`, `world-detail-pass.ts` | Objects, details, physical metadata, environment layers | Welcome Garden integration test |
| Vertical presentation | `roof-visibility.ts`, world module | Render-only roof control and level-aware presentation | Roof assertions |
| Player | `player-motion.ts`, `player-appearance.ts` | Motion, appearance, avatar render state | TypeScript checks and slice test |

## Source-of-truth policy

The active clean-room source under `/home/ubuntu/2006scape-build/src/cleanroom-client` is the implementation source. Drive exports and archives are evidence, snapshots, or delivery packages until imported and validated. No archive is treated as executable engine code automatically.

## Current verified wiring

The Welcome Garden render model exposes `hud`, `hudPresentation`, `compass`, `realmObjects`, `resources`, `bank`, `npcs`, `roofs`, environment details, and avatar state. TypeScript strict checks and deterministic runtime tests pass.

## Drive filing recommendation

Keep this manifest in `06_10_10_OPTIMIZATION` alongside the existing canonical filing index and change log. Keep large ZIP archives and older exports in their current locations until content-level lineage review is complete.

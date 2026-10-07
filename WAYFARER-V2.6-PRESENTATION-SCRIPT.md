# Wayfarer v2.6 — Combat & Hostile Camps
## Presentation script

**Opening — 30 seconds**

Welcome to Wayfarer v2.6, the release that turns the expanded realm from a beautiful world to a world with real field danger. This update introduces hostile camps, multi-combat encounters, server-owned projectiles, and loot that is earned through play rather than granted by the client.

**Scene 1: Three hostile regions — 45 seconds**

First, we have three distinct encounter spaces. Old Bell Grave is home to skeletons. Mirewake Hollow is a zombie marsh. Broken Standard Camp is the high-risk campsite, populated by thugs, bandits, and muggers. Each hostile has its own health, damage profile, camp identity, and rare steel drop.

Point out the camps in the HUD: the player can target a specific mob, see its health, and identify the camp it belongs to.

**Scene 2: Server-authoritative combat — 60 seconds**

Every meaningful combat transition is resolved by the authoritative realm. The client does not decide whether a target is alive, whether an attack is in range, how much damage is dealt, or whether a drop exists. The server validates the command, checks weapon compatibility and cooldowns, applies damage, and replicates the result.

For melee, demonstrate slash, crush, strike, and lunge. Crush is a strong choice against skeletons, while lunge trades cooldown for reach. An incompatible weapon or an out-of-range target is rejected without advancing the attack clock.

**Scene 3: Multi-combat pressure — 60 seconds**

Now approach Broken Standard Camp. The first attack can alert nearby camp members. Because this is a multi-combat area, several enemies can join the same encounter. The HUD explicitly reports the number and types of attackers.

This creates a tactical loop: lure one enemy away, manage distance, retreat when health falls, or use protection. Enemies pursue only within a bounded detection and leash range, then return to their home positions.

**Scene 4: Ranged and magic projectiles — 45 seconds**

Ranged attacks consume arrows. Magic attacks consume runes. Both are represented as server-owned projectiles. The server schedules an impact tick; damage is not applied at launch. If the target disappears before impact, the result is a miss. Projectile counts are bounded so a client cannot flood the simulation.

**Scene 5: Drops and progression — 45 seconds**

A defeated hostile rolls its steel drop on the server at a strict five-percent threshold. Drops appear as ground loot and remain range-gated. The player must move close and collect the item; the inventory update is validated and counted as hostile loot. Steel weapons also become usable equipment with their own combat profiles.

**Scene 6: Hardening and validation — 45 seconds**

This release preserves the existing Wayfarer systems: movement, click-to-walk, skills, Xam, cross-device saves, persistence, weather, and the visual fallback. The complete suite passes 324 tests, including hostile combat, projectile timing, multi-combat aggro, loot migration, network behavior, persistence, renderer recovery, and live-server contracts.

**Closing — 20 seconds**

Wayfarer v2.6 is the foundation for a living realm: exploration has consequences, combat has readable rules, and the server owns the truth. The next step is to expand encounter variety while keeping the same bounded, testable, authoritative model.

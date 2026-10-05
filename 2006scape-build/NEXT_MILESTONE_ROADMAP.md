# Copper Lantern Next-Milestone Roadmap

## Recommendation

The next milestone should be a **small playable vertical slice**, not another isolated content system. The current workspace already has strong presentation foundations: player appearance, motion, beginner safety, onboarding, environmental detail, map organization, and multi-level transitions. The project now needs the runtime seams that connect those systems into one repeatable player journey.

The recommended slice is:

> **Log in → appear safely in the Welcome Garden → customize appearance → move through the garden → open the overview and pocketbook → inspect a portal → enter one original exterior zone → return safely.**

This slice will reveal integration problems earlier than additional decoration, map expansion, or isolated mechanics.

## Priority order

### 1. Wire the existing presentation modules into one client scene

Create a single client entry point that composes the beginner safe area, appearance system, motion controller, world-detail pass, presentation organization, HUD overview, and guide package. The goal is not to build every screen. It is to make one player session run from login through the first safe-area loop.

The scene should load the Welcome Garden, place the player at the protected spawn tile, display the first guide step, and expose the mirror, map table, pocketbook, and departure gate. The renderer should treat decorative layers as presentation-only and should obtain collision and transition decisions from the authoritative world model.

**Exit criterion:** A fresh local session can complete the first seven beginner steps without manually editing state.

### 2. Add an original protocol and server-authoritative session loop

The current Go world authority validates levels and connectors, but the project still needs a transport boundary. Define a versioned protocol for login admission, player intent, movement acknowledgement, appearance patches, guide-step acknowledgement, overview requests, and connector traversal.

The client should send intent rather than position, inventory, rewards, or transition results. The server should validate the request, apply the state change, and return an acknowledgement with a revision number.

**Exit criterion:** A client cannot move between levels, change protected state, or complete onboarding by editing local presentation data.

### 3. Persist the minimum player profile

Add a small development persistence layer for player identity, current level and tile, appearance selection, completed beginner steps, and pocketbook read state. Use synthetic development accounts until the account and privacy decisions are finalized.

A minimal schema is preferable to a broad economy schema at this stage. The first restore test should prove that a player can log out after confirming cosmetics and log back in at the correct safe location with the same appearance and guide progress.

**Exit criterion:** Login, logout, and re-login preserve the minimum profile without duplicating or losing state.

### 4. Build the first original renderer-backed map

Use the existing Ashfen expansion manifest as a content input, but add a loader that converts authored JSON into renderable levels, structures, landmarks, and connector prompts. The first map should include the Welcome Garden, one exterior route, the watchtower ramp, and the tunnel entrance.

Keep the first environment visually coherent rather than large. Use the existing district palettes, landmark priorities, lighting rules, and seeded micro-details. Add a quality setting that reduces atmosphere and decorative density without changing world state.

**Exit criterion:** The player can see and traverse one polished original route with clear landmarks, stable collision, and no hidden decorative blockers.

### 5. Add the launcher only after the local slice is repeatable

The Drive inventory includes launcher and bootloader material, but the project brief correctly treats it as unverified reference material. The next launcher should therefore be an original prototype that installs only project-produced artifacts.

Implement a signed test manifest, hash-and-length verification, side-by-side version slots, health-check startup, and rollback. Do not connect the launcher to unapproved archives, legacy clients, proprietary caches, or unidentified protocol material.

**Exit criterion:** The launcher installs a known test build, detects a deliberately corrupted artifact, and rolls back to the previous healthy slot.

### 6. Add quality, accessibility, and failure-state passes

Once the slice works, add settings for camera sensitivity, text scale, contrast, reduced motion, ambient-detail density, and simplified effects. Every important action should have a readable text state: loading, unavailable, accepted, rejected, or requiring confirmation.

Test disconnects during movement, cosmetic confirmation, portal inspection, and departure. The client should recover to the last server-confirmed state instead of presenting a misleading local pose or location.

**Exit criterion:** A new player can understand each state without relying on color, animation, or prior MMO knowledge.

## What not to prioritize yet

Do not expand into a complete economy, public accounts, large-scale combat, broad NPC schedules, or a full legacy-compatible launcher before the vertical slice is stable. Do not import Drive archives or unidentified assets into the build. The Drive root contains useful candidate files, including HUD, game-store, cosmetics, launcher, and architecture material, but their presence does not establish ownership, compatibility, or permission for runtime use.

The safest use of those files for now is read-only comparison and provenance review. The clean-room project should continue using original code, original content, and expressly licensed dependencies.

## Suggested implementation sequence

| Milestone | Main result | Proof of completion |
|---|---|---|
| A | Client composition | Welcome Garden loop runs end to end |
| B | Protocol boundary | Server accepts intent and returns revisions |
| C | Minimum persistence | Re-login restores profile and guide state |
| D | Renderer-backed content loader | Ashfen route renders and traverses correctly |
| E | Original launcher prototype | Signed install and rollback work locally |
| F | Accessibility and failure handling | New-player and disconnect tests pass |

## The highest-value next feature

If only one feature is chosen next, build **the connected Welcome Garden vertical slice**. It will turn the current scripts into a visible playable foundation and will provide the correct integration point for future buildings, caves, towers, NPCs, combat, skills, inventory, and launcher work.

### References

[1]: file:///home/ubuntu/2006scape-build/research/implementation-brief.md "Clean-room implementation brief"
[2]: file:///home/ubuntu/2006scape-build/BUILD_STATUS.md "Current build status"
[3]: file:///home/ubuntu/2006scape-build/research/launcher-review.md "Launcher and bootloader review"
[4]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/content/ashfen-expansion-v1.json "Ashfen expansion content manifest"

## v1.2.0 — 2026-10-05

- Moved PolyCodex casting into the authoritative gameplay reducer with server range/cooldown validation, persistence v6 and server-owned Magic/Runecrafting XP.
- Added six one-use resonance attunements for Woodcutting, Mining, Fishing, Agility, Magic and Defence; gathering bonuses are atomic and cannot duplicate on partial capacity.
- Added deterministic Celestial Observatory location, authoritative Codex point replication and compatibility revision 16 / scene revision 3.
- Added original procedural Sunward Orchard, Prism Dew garden and Moonlight Cavern presentation inspired by the supplied coastal, crystal-mine, enchanted-book, luminous-fauna and orbital-observatory references.
- Added a dodecahedral world Codex, twelve pylons/nodes, orbit rings, cavern crystals, timber walk, moon pool, portal, lanterns, glowshrooms and astral snail.
- Added a dependency-free bridge that upgrades the checked-in Babylon bundle when the normal dependency-backed bundler is unavailable.
- Fresh Node 24.19.0 / npm 10.9.2 verification: canonical build and full suite **330/330 passed**; Python asset validation **8/8 passed**. See `V1.2-VERIFICATION.md` for scope and remaining deployment/visual-review limits.

## v1.1.0 — 2026-10-04

- Added the original 12-node Resonance PolyCodex UI with deterministic three-node chord resolution, cooldowns, optional Web Audio tones and explicit fantasy-only framing.
- Added a circular north-up minimap, compact system/public chat surface and a seventh Codex HUD tab with mobile/reduced-motion styling.
- Added Babylon source for a dodecahedral PolyCodex world device whose nodes mirror HUD selections and can emit a local resonance light burst.
- Kept the v1.0 authoritative movement/gameplay/persistence/network contract unchanged; resonance remains cosmetic/local in this release.
- Added focused PolyCodex surface and logic tests.

## v1.0.0 — 2026-10-04

Persistent single-realm server release: SQLite guest/Xam saves, HTTPS deployment stack, exclusive authority lease, public request safeguards, process recovery tests, backup/migration tools and deployment runbook. See README.md and V1-VERIFICATION.md for current evidence and limits.

# v0.9 rc.3 — unified world merge

- Reconciled `wayfarer-v0.9-rc2-xam-candidate.zip` and `wayfarer-v0.8-rc8-xam-candidate.zip` into one package.
- v0.9 remains the only active movement/gameplay authority; the complete rc.8 tree is preserved under `legacy/rc8-snapshot/` as non-runtime source/reference.
- Ported rc.8 Xam protection semantics into the newer v0.9 agent instead of running two Xam controllers.
- Warden targeting/damage now excludes protected participants while protected actors can still submit ordinary validated gameplay intents.
- Xam view explicitly reports protected/untouchable/nonblocking/no-auto-retaliate identity and requested equipment identity.
- Added `XAM_MAX_FOCUS_TICKS = 6000` (five minutes at 20 Hz) as a hard focus ceiling.
- Added merge coverage metadata, namespaced rc.8 preservation, and three regression tests for protection/atomic staged commits/Xam identity.
- Fresh dependency-independent verification: 203 tests passed, 0 failed.

# v0.8 rc.6

Reconciled persistence and gameplay hardening, fixed disconnect-save reconnect race, bounded periodic save pressure, exposed persistence failure and bumped simulation contract to 6. Full 196-test suite passed; fresh Chromium launch blocked.

# Identity + persistence v0.8 candidate 5

Added strict versioned player saves, restored position/appearance/Quiet Tithe/pack/equipment, relative cooldown persistence, HMAC-signed local profile cookies, single-active-profile socket enforcement, serialized atomic JSON profile writes, periodic/disconnect/graceful flushes, replay format v2 with sanitized restored state, and simulation revision 5. Added seven persistence/replay regression tests. This remains a loopback development candidate: the cookie is not production authentication, shared-world state is not durable, and cloud/database staging remains open.

# Inventory v0.8 candidate 4

Added a bounded private pack, three reward choices, one-time server-owned token exchange at Halden, equip/stow item conservation, shared weapon presentation, strict item schemas and six inventory regression tests. Cosmetic animation redraws are capped at 30 FPS; the server retains its 20 Hz fixed clock. Simulation revision 4 rejects old clients. This continues the single public v0.8 milestone; the next public release remains v0.9.

# Reedhaven v0.8 candidate 3

Adapted Quiet Tithe content into the existing 20 Hz authoritative runtime. Added private capped inventory, shared reed regeneration, tick-based gathering cooldown, server proximity checks, atomic quest transitions, quest HUD and replay coverage. Simulation revision 3 rejects incompatible clients. This is a v0.8 candidate, not a new public patch version.

## v0.8 research candidate 2 — 2026-10-02

Movement, gameplay and tick now share one validated commit. Added bounded accepted-input replay journals, canonical SHA-256 verification, idle timer shutdown, /health and startup compilation. Recorded uploaded artifact hashes and integration differences. 170 automated tests and a live Chromium session replay passed.

## v0.8 candidate — 2026-10-01

Atomic staged movement ticks, v2 local action protocol, shared appearances and landing beacon, character-relative ABC cape, and real Chromium verification. See V0.8-READINESS.md for unfulfilled final-release gates.

# v0.7.9 ABC — experimental extension

- Added spatial A downflow, B upflow and signed C circulation with cylindrical falloff.
- Per-point force sampling, simulation-time pulses and combined wind cap before gravity.
- ABC controls, seven presets, source markers and radius ring; inspector and impulse use local field direction.
- Seven new tests; previous runtime remains unchanged outside local cloth presentation.

# v0.7.9 — multitool and soft-body vectors

- Shared local action registry with button/keyboard gates, tooltips and disabled explanations.
- Mesh lab point selection, inspector, XYZ wind, force line, impulse, pause, step, reset, focus and wireframe.
- Bounded wind and accumulated impulse speed; anchors remain fixed; reset clears force history.
- Offline crossing/pause/reset use the same registry abstraction.
- Six new Node tests; existing authoritative network behavior unchanged.

# v0.7.8 — mesh and asset integration

- Shared fetch queue, deduplication, copy-isolated byte cache, deadlines, one server-error retry and response limits.
- Validated runtime asset catalog, PNG dimensions, corrected same-origin fetch CSP.
- Negotiated text/JSON gzip on both hosts, preserving uncompressed image assets.
- Bundled Babylon mesh lab, real mesh adapter and bounded 63-point anchored cloth.
- Strict Pydantic catalog validation, mypy check and optional pinned Python tools.
- Babylon 9.28.0, TypeScript 6.0.3, esbuild 0.28.2 pinned; license/notice retained.
- Eight new Node tests plus two Python tests; separate loopback hosts verified.

# v0.7.7 — characters and organic motion

- Four supplied humanoid appearances wired into both walking previews, with articulated vector fallback.
- Distance-driven gait, bounded body spring and vector cape spring; reduced-motion support.
- Rounded foliage/stone sphere meshes inside unchanged collision extents.
- Seven preserved source GIFs, lossless frame sheets, timing metadata and animated asset studio.
- Correct PNG/GIF/JSON MIME types on both local hosts.
- Seven new regression tests; authoritative walking and network contract unchanged.

# v0.7.6 — realm terrain surveys

- Added bounded terrain classification, four-neighbor open components and conservative arrival-patch screening.
- Atlas shows survey counts, steep-cell overlays and candidate rings.
- WORLD-ATLAS.json schema 2 includes survey data; new ./terrain-survey export.
- Six new tests; generator, collision and network contract remain unchanged.

# v0.7.5 — Atlas of Ten Reaches

- Ten authored realm identities anchored to real matching procedural biomes.
- Interactive map, terrain sample thumbnails, keyboard-accessible selection and twelve planned travel links.
- Reusable atlas API and generated WORLD-ATLAS.json catalog.
- Five new tests cover generated placement, graph integrity, sample evidence, immutability and stub-DOM controls.
- Generator and multiplayer scene/wire contract unchanged.

# v0.7.4 — buffered movement presentation

- Added bounded, copy-isolated snapshot interpolation with monotonic presentation time.
- No extrapolation; large jumps/gaps snap, departed players disappear immediately.
- Network client renders on animation frames, clears input on stale snapshots and closes after five seconds without fresh state.
- Preserved server authority and v0.7.3 wire contract.
- Eight new buffer tests; real-socket stub-DOM client test extended for stale timeout and fresh rejoin.

# v0.7.3 — explicit compatibility contract

- Shared strict hello/welcome codec and generated interoperability manifest.
- Required WebSocket subprotocol plus world/coordinate/tick/snapshot compatibility check before join.
- Bounded pending handshake deadline and capacity reservation.
- Client validates echoed server contract and retains readable rejection messages.
- Nine new compatibility checks; previous socket tests upgraded to the new handshake.
- This is a wire-breaking local-rehearsal change: v0.7.2 clients are rejected until updated.

# v0.7.2 — local transport rehearsal

- Added loopback-only WebSocket host and browser client using shared Willowglass geometry/colliders.
- Wired server timing, identity, snapshots, actual socket queue checks, payload/rate limits, Origin/Host checks, heartbeat and cleanup.
- Added a manual join/disconnect UI with keyboard/touch directions and cached scenery.
- Added 11 integration checks using real sockets, including a stub-DOM browser-client lifecycle check.
- Pinned ws 8.22.0. Offline preview remains available.

# v0.7.1 — fail-stop simulation boundary

- Fixed exposure of mixed-tick player state after a sampler throws midway through a session tick.
- Both WorldSession and RealmRuntime now latch faults and block further state publication/advancement.
- Retained disconnect cleanup and added explicit active/faulted status.
- Preview reports failures and can rebuild its local scene through Return.
- Added six regression tests, including second-player faults, catch-up faults, trusted hook faults and replacement realms. Extended the preview smoke test to cover fault display and restart.

# v0.7.0 — rebuilt realm foundation

Rebuilt from v0.4 with fixed-clock scheduling, RealmRuntime, strict realm replication, an outgoing flow policy and an integrated local preview. Adds a two-player in-process example and 20 new behavioral tests. Updates the existing preview test for animation frames, pause/resume and stalls.

This is a new, independently tested implementation of part of the research design. It does not recover the original report's missing source or claim its unimplemented modules.

# 0.4.0

- Safely extracted and inventoried nine reference archives; kept source variants separate.
- Merged reviewed isometric and normalized-preference utilities.
- Added coordinate frame adapters and transport-neutral session authority.
- Added local isometric crossing preview, tap routes, minimap and keyboard controls.
- Added provenance, branch comparison and regression tests.
- Browser visual QA remains outstanding; this release is a scaffold, not a deployed MMO.

# Changelog

## 0.3.0

Added construction version 1: globally aligned edited terrain meshes, blended foundation pads, decks and ramps with seam validation, side rails, foundation masonry, three themed crossing planners, nearby inscriptions, site reservations, renderer-neutral scene meshes and a geometry-derived atlas. Added 15 tests; all 38 tests pass. Verified fixed-tick crossing movement and compatibility with surrounding procedural colliders. Legacy generator version 1 and recipe protocol remain unchanged. Construction plans are trusted build artifacts and are not added to the old wire codec.

## 0.2.0

Added mesh-aligned ground sampling, local navigation bounds, footprint checks, continuous horizontal obstacle sweeps, A* paths, fixed-tick authoritative walking, strict direction-input codec, stale-input timeout and collider chunk lifecycle. Added geometry for eight prop kinds. Added 13 tests; all 23 tests pass. Added navigation example and integration guide. Existing generator version 1 terrain/catalog behavior remains unchanged.

## 0.1.0

Initial ten-biome catalog, deterministic terrain chunks, river channel, weather metadata, landmark blockouts, recipe codec, geometry helpers and ten tests.

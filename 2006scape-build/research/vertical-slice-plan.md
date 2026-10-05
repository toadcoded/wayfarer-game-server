# Project Copper Lantern — First Playable Browser/Client Vertical Slice

**Status:** implementation plan (not a build or release artifact)  
**Scope:** original browser-client proof slice for a new fantasy MMORPG  
**Temporary identity:** *Project Copper Lantern* is an internal working label only. It is not a public product name, title, or claim of affiliation.

## 1. Decision and non-negotiable boundary

This plan defines the first **playable, clean-room browser vertical slice**: a player enters a small original marsh waystation, moves across a tile-based 3D scene, gathers one resource, and sees the server-confirmed item in a compact inventory HUD. The result is deliberately narrow. It proves the visual language, browser rendering loop, point-and-click movement, an original intent-based protocol seam, interaction feedback, and deterministic demonstration without implying compatibility with, dependence on, or derivation from a legacy game.

The supplied corpus remains **quarantined research evidence**. Nothing from it is copied into the runtime, repository, asset directory, prompt references, protocol, map, UI, content definitions, build inputs, or release artifacts. In particular, the slice must not use third-party game names, logos, art, music, maps, item terminology, cache files, client binaries, packet/opcode layouts, authentication flows, update formats, or reconstructed behavior. The supplied `combining.js` is only a Unicode combining-codepoint range table; it provides no game functionality for this slice and will not be imported.

The plan implements the project baseline that all fairness- or persistence-affecting rules belong to a server, while the browser is a presentation and intent endpoint.[1] [2] A local `?demo` adapter is allowed strictly as a visibly labeled, non-persistent presentation fixture; it is not a multiplayer authority and must never be reachable in a production admission path.

> **Go/no-go gate.** Engineering may scaffold this slice only after the clean-room baseline has a do-not-use register, contributor attestation, original world brief, asset-provenance register, and a build that does not consume quarantined material. A public release additionally requires the ownership, brand, security, and operations decisions identified in the implementation brief.[1]

## 2. Slice definition

### Player promise

The playable moment is set at the original **Sable Fen Waypost**, a small raised-stone rest stop amid copper-leaf trees and shallow teal water. The player controls a lantern-bearing surveyor. They click a traversable tile to walk from the entry bridge to a patch of **mirrorglass reeds**, activate the reeds only while in range, and receive one **mirrorglass bundle** after the authoritative result arrives. The resource changes to a harvested visual state and the HUD updates from `0 / 8` to `1 / 8`.

The intended session is two to four minutes for a human player and 14 seconds for a deterministic proof run. It is a complete vertical behavior rather than a content demo: arrival, navigation, range-gated interaction, server result, durable-state contract, and clear visual acknowledgement are all present.

### Included and deliberately excluded scope

| Area | Included in first playable slice | Explicitly deferred |
|---|---|---|
| World | One original 14 × 12 static tile map (`21 m × 18 m`) with an entry bridge, stone path, water edge, three tree clusters, one reed patch, and blocked tiles. | Map streaming, procedural terrain, additional regions, imported maps, and user-authored content. |
| Avatar | One procedural, stylized surveyor mesh assembled from original primitive geometry and original textures; idle and walk pose changes. | Imported character rigs, skeletal animation, cosmetics, player trading, and character customization. |
| Core loop | Click-to-move on walkable ground; move along a server-approved route; gather the reed patch; show one inventory item. | Combat, enemies, quests, skills progression, banking, economy, chat, guilds, PvP, and parties. |
| Networking | Project-owned versioned JSON-over-WebSocket development contract, short-lived test admission ticket, command IDs, server snapshots/results, and rejections. | Any legacy wire format, cache/data format, proprietary handshake, production matchmaking, and protocol optimization. |
| Persistence | Server transaction contract for an inventory revision and an idempotent gather result; local development database fixture. | Real accounts, public data collection, payments, player support tooling, and live operations. |
| Browser delivery | Full-screen React/Babylon WebDev client, `?demo` deterministic fixture, screenshot evidence, and a publish-ready checkpoint. | Desktop launcher, auto-update system, native packaging, or a temporary public proxy URL. |
| Audio | No audio required for slice acceptance; the first user gesture may later unlock a small original sound set. | Autoplay-dependent audio proof, copied music, voice acting, or full audio mixing. |

The slice deliberately uses a **fixed, static navigation grid**. It does not claim dynamic navigation, client collision authority, physics simulation, or a seamless-world architecture. This keeps the first proof focused on correctness and visible playability.

## 3. Visual target and original world brief

### Visual direction

The target is a clean, readable three-quarter 3D browser view with a restrained early-browser-fantasy sensibility rather than an imitation of any existing title. The palette combines oxidized copper, wet teal, peat brown, soft parchment, and a small amount of warm lantern gold. Materials are bold and matte. Silhouettes remain legible from an elevated camera: the surveyor has a short sea-green cloak and brass lantern; the reed patch has tall faceted blue-green blades; the waypost uses irregular dark stone and copperwood posts.

The scene should read as handcrafted and compact, not as a dense open world. Ambient hemispheric illumination and one warm directional light create form without depending on volumetric fog, screen-space effects, elaborate water shaders, dense particles, depth of field, or complex cast-shadow setups. The camera is fixed to an isometric-like three-quarter framing during normal play and moves only through bounded zoom/rotation controls. The result should feel grounded, calm, and inspectable at 16:9.

### Mandatory visual-target generation request

Before implementation, create a **new, original** 16:9 reference image using the built-in image-generation workflow. Save the original outside the code repository under `/home/ubuntu/webdev-static-assets/copper-lantern/`, record its creation metadata and checksum in the asset register, and record the approved output URL in the WebDev project's `ASSETS.md`. It is a visual QA reference, not a shipped third-party source image.

Use this implementation-bounded prompt; it enumerates only objects the slice will actually build:

> Screenshot of an original stylized 3D browser fantasy game, 16:9. Camera: fixed elevated three-quarter view, about 52 degrees downward, looking across a small 21 by 18 meter marsh waystation. Game objects: one 1.7 meter surveyor in a sea-green short cloak with a brass lantern, standing at the lower-left stone bridge; one blue-green patch of tall faceted mirrorglass reeds at center-right; one short octagonal dark-stone signal plinth at upper center; three copper-leaf tree clusters around the map edge; a short copperwood railing and dark-stone stepping path; a few shallow teal-water pools bordering the path. Environment: wet peat ground, irregular square stone tiles, low stone edges, no distant city, no extra creatures, no vehicles, no combat. HUD: compact parchment-dark status strip at upper left reading “Sable Fen Waypost”; small 8-slot inventory at lower right with one empty highlighted slot; interaction prompt above the reed patch only when in range. Palette of oxidized copper, wet teal, peat brown, sea green, and lantern gold. Clean sharp game-engine output, matte materials, readable silhouettes, soft ambient lighting, no motion blur, no depth of field, no volumetric fog, no lens flares, no existing-game references.

**Visual-target approval criteria** are that every visible prop is in the asset plan below, the surveyor/reeds/plinth are separable and legible at intended scale, the HUD contains only planned elements, and no generated motif or wording is judged too close to a prohibited reference by the art/provenance review.

## 4. Gameplay, world data, and authority model

### Static map and interaction rules

The original content package contains a hand-authored data file, for example `sable-fen-waypost-v1.json`, with integer tile coordinates, tile flags, prop positions, spawn point, and one interactable definition. It is authored from the project world brief and is not converted from any external map, asset archive, or coordinate data. The canonical map uses a 1.5 m tile size, an entry spawn at `(2, 2)`, a reed patch at `(9, 5)`, and static tree/railing blockers. The path is deliberately authored so that the player visibly changes direction around an obstacle.

The resource has a unique opaque server entity ID, a gather range of 1.8 m, a cooldown state, and a harvested visual replacement. The browser may display a range prompt but cannot grant itself the item, choose a reward amount, change its position, alter the resource state, or overwrite the inventory. Upon a valid gather command, the server locks and verifies the resource, records an idempotent command result, increments the inventory revision in one transaction, and emits the result and new world state. A duplicate command returns the prior result rather than granting another bundle.

### Original development protocol seam

The first implementation uses human-inspectable JSON frames over TLS WebSocket to optimize debugging, with strict schema validation and bounded frame sizes. This is a new project contract; its names, frame shapes, sequencing, errors, and serialization are authored for Copper Lantern and are not modeled on any third-party format. A binary encoding can replace JSON only behind the same versioned schema after the slice is proven.

| Direction | Frame | Required fields and server behavior |
|---|---|---|
| Client → server | `client.hello` | `protocolMajor`, `protocolMinor`, capability list, and bounded client build ID. The gateway rejects unsupported combinations. |
| Client → server | `session.admit` | A one-time, short-lived, audience-bound test ticket. The gateway consumes it once and binds it to the connection. Credentials never traverse the game command channel. |
| Client → server | `move.intent` | `commandId` and destination tile only. The server checks tile bounds, collision, character ownership, rate limits, and current simulation state, then chooses the route. |
| Client → server | `interact.intent` | `commandId`, opaque target ID, and the original action key `gather`. The server checks target state, range, cooldown, ownership, and idempotency. |
| Server → client | `world.snapshot` / `world.delta` | Server tick, avatar transform, approved route segments, resource state, and inventory revision. The browser renders this state. |
| Server → client | `command.resolved` / `command.rejected` | Correlated command ID and player-safe outcome code. `command.resolved` for gathering includes the resulting inventory revision and item delta. |

All frames have a maximum byte length, schema validation before use, message-rate limits, a correlation ID for redacted logs, and no stack traces or internal rule details in player-visible errors. The client sends intent only; no `position`, inventory, currency, damage, reward, or world mutation assertion is accepted from it.[2]

## 5. Babylon/React client structure

The host is a Manus WebDev **static React project** with Babylon.js installed. React provides the lifecycle-safe frame only; Babylon owns rendering, scene graph, mesh lifecycle, camera, lights, raycasting, and animation. All gameplay objects are plain TypeScript under `client/src/game/` and can be unit-tested without React. The `/` route renders `<GameCanvas />` as its sole app content; the component contains the full-screen canvas and a HUD mount only.

React 19 development mode must initialize Babylon exactly once despite strict-mode remount behavior. `GameCanvas` guards initialization with a ref, awaits scene creation, starts one render loop, calls `engine.resize()` on resize, and disposes the game handle, engine, and every DOM listener on unmount. The scene entry point follows the required contract:

```ts
export type GameHandle = {
  scene: Scene;
  dispose(): void;
};

export async function createGameScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Promise<GameHandle>;
```

The camera is a bounded `ArcRotateCamera` with a fixed target at the map center and restricted alpha, beta, radius, and panning values. Pointer lock, free first-person controls, imported GLB pipelines, physics plugins, and runtime/procedural terrain generation are not part of the slice. Deliberately authored primitive meshes are permitted for the avatar and props. Ground picks use Babylon's mesh picking and a static tile lookup; all navigation approval remains on the service side.

### Planned project layout

The WebDev client should live at `apps/game-client/` in the clean-room monorepo. Its generated web host has the following primary ownership structure; names may be refined, but ownership must not be blurred.

```text
apps/game-client/
├── PLAN.md                         # risk slices and acceptance criteria from this plan
├── STRUCTURE.md                    # module ownership and runtime contracts
├── MEMORY.md                       # implementation discoveries, failures, and fixes
├── ASSETS.md                       # generated original assets, prompts, URLs, checksums
└── client/
    └── src/
        ├── App.tsx                 # renders GameCanvas only
        ├── components/GameCanvas.tsx
        └── game/
            ├── scene.ts            # createGameScene and high-level update ownership
            ├── GameWorld.ts         # map, entities, tick interpolation, disposal
            ├── config/sliceConfig.ts
            ├── actors/Surveyor.ts   # procedural mesh, pose state, approved route motion
            ├── world/TileMap.ts     # original static content and pick-to-tile conversion
            ├── world/ReedPatch.ts   # visual resource states only
            ├── input/InputManager.ts
            ├── camera/CameraController.ts
            ├── interaction/InteractionController.ts
            ├── net/WorldGateway.ts  # interface, schemas, and live adapter
            ├── net/WebSocketGateway.ts
            ├── demo/DemoGateway.ts  # visibly test-only deterministic fixture
            ├── demo/DemoPilot.ts
            ├── ui/HudController.ts  # DOM HUD, no domain rules
            ├── assets.ts            # generated texture URL constants
            └── test/                # browser-independent client tests
packages/
├── protocol/src/copperLanternV1.ts  # versioned schemas and contract fixtures
├── domain/src/                      # pure rule validation and deterministic simulation
└── content/src/                     # original map/item/asset-manifest definitions
apps/game-server/
└── src/slice/                       # admission, authoritative command handlers, persistence
```

`GameWorld` owns the scene-level update and delegates to `Surveyor`, `ReedPatch`, `InteractionController`, and `HudController`. The `Surveyor` owns only Babylon nodes and presentation state: it interpolates server-approved route segments and swaps between a standing pose and a simple procedural walk pose. `TileMap` owns only rendering-friendly static geometry and raycast translation. The protocol/domain packages own no Babylon or React imports. `HudController` renders only server-derived state and semantic prompts; it never directly changes inventory or resource state.

| Concern | Owner | Key invariant |
|---|---|---|
| Canvas, engine, resize, disposal | `GameCanvas` | One engine and one render loop per mounted canvas; no leaked listeners after unmount. |
| Scene, lights, materials, frame update | `GameWorld` / `scene.ts` | A fresh scene is constructed for each lifecycle; scene disposal tears down Babylon-owned resources. |
| Semantic input | `InputManager` | Click ground → `RequestMove`; click target or `F` in range → `RequestInteract`; no raw key checks scattered through objects. |
| Rendering and avatar interpolation | `Surveyor` | Visual movement follows only route data accepted by the gateway; local pose changes cannot mutate world state. |
| Network transport | `WorldGateway` implementations | Live adapter validates the project schema; demo adapter has no persistent or public authority. |
| Server rules and storage | `domain`, game-server slice | Only this side validates movement/interactions and commits the inventory revision. |
| HUD | `HudController` | Displays snapshot/delta state, command feedback, and demo watermark; no rule evaluation. |

## 6. Original asset plan and provenance

Generated art is mandatory for the executed slice, but it must be generated from the approved original briefs below rather than copied, extracted, or traced from outside game material. Use the built-in image-generation workflow for the reference and texture assets. Store original generation outputs under `/home/ubuntu/webdev-static-assets/copper-lantern/`; upload only approved runtime PNGs with `manus-upload-file --webdev`; then use the returned `/manus-storage/...` URLs from `assets.ts`. Large image files must not be committed to the WebDev project tree.

Procedural boxes, cylinders, planes, and faceted extrusions form the mesh silhouettes. Generated images supply their material identity. This avoids an imported-model/rigging pipeline while still delivering visible original art.

| Asset ID | Type and intended in-game size | Original creation brief | Runtime use |
|---|---|---|---|
| `slice-reference-16x9` | 1K 16:9 review reference; not runtime | The exact visual-target prompt in Section 3. | Art-direction QA anchor; recorded in `ASSETS.md`. |
| `peatstone-ground` | Seamless 1K texture; repeats every 2 m | Top-down wet peat and irregular dark-stone flecks, oxidized copper mineral specks, uniform light, clean seamless edges, no symbols or text. | Tiled ground and path material. |
| `teal-water` | Seamless 1K texture; repeats every 3 m | Calm shallow teal marsh water with subtle hand-painted ripples, uniform light, seamless, no reflections of recognizable objects. | Flat low-water planes; UV scroll is optional and cosmetic only. |
| `copperwood-bark` | Seamless 1K texture; repeats every 1 m | Matte copper-brown bark with pale lichen and broad sea-green leaf shapes, seamless, clean edges. | Procedural tree trunks and leaf-card planes. |
| `mirrorglass-reeds` | 1K transparent cutout sheet; 1.6 m tall cluster | Bold faceted blue-green marsh reeds with thin copper tips, isolated on a solid temporary background, no ground shadow, readable silhouette. | Crossed planes for the gatherable patch; swaps to short cut stems after success. |
| `signal-plinth-face` | 1K texture; 1.2 m high octagonal prop | Original dark-stone plinth face with abstract concentric copper inlay, no letters, no known iconography, soft matte surface. | Procedural octagonal plinth material. |
| `surveyor-cloth` | 1K texture; 1.7 m avatar | Sea-green woven cloak cloth with a tiny abstract lantern-grid embroidery, neutral non-branded design, no crest or text. | Avatar cloak plane/cape and small banner accent. |
| `hud-parchment` | 1K nine-slice-compatible panel texture | Dark blue-gray parchment/fiber panel with thin copper edge, intentionally sparse, no text and no familiar UI motifs. | HUD panel background; labels and slots remain DOM/CSS for accessibility. |

Each approved row in `ASSETS.md` and the central asset register must record: asset ID, prompt, generator/tool version, generation date, creator/reviewer, original output path, uploaded storage URL, SHA-256, intended use, license/ownership status, approval date, and rejection notes if regenerated. The reference image and runtime assets are reviewed before integration for prohibited words, symbols, recognizably copied silhouettes, and accidental text. A rejected output is removed from runtime selection and remains only in access-controlled review history if retention policy permits.

## 7. Risk decomposition and build order

The build is intentionally risk-first. Each risk slice produces a runnable, inspectable checkpoint before visual polish is layered on. A failure in any risk slice blocks later content work rather than being hidden by it.

| Order | Isolated risk | Why it is isolated | Constrained approach | Verify before continuing |
|---:|---|---|---|---|
| 0 | Clean-room and host baseline | A visually working browser page is not acceptable if it quietly imports unreviewed files or gives React two engines. | Create the WebDev static project; add Babylon core; add quarantine/provenance checks; render an empty full-screen canvas through `GameCanvas`. | Dependency/license records exist; source scan finds no quarantined paths; strict-mode mount produces exactly one engine and one render loop; unmount releases listeners and engine. |
| 1 | Camera, picking, and static-grid route request | Raycast-to-tile translation and path presentation can look plausible while disagreeing with collision rules. | Use one ground mesh plus visible tile debug overlay; quantize picks to the authored grid; client sends only the tile; server returns the canonical route around static blockers. | Click three known tiles; each maps to expected coordinates; blocked or out-of-bounds requests are rejected; accepted path is identical for the same fixture state; avatar never visually crosses blocker tiles. |
| 2 | Intent authority, reconciliation, and idempotency | This is the most important fairness boundary and must not be replaced by client-state messages. | Implement live WebSocket schemas and a local game-service fixture; animate only accepted snapshots/routes; command IDs produce one durable interaction result. | Forged position/inventory fields fail schema/are ignored; out-of-range gather rejects; repeated gather command returns one bundle and one inventory revision; reconnect snapshot restores the same state. |
| 3 | Procedural avatar motion | Even a simple walk pose can drift or pop if it is coupled to rendering frame rate. | Use a fixed 10 Hz simulation step and a presentation interpolator; swap only idle ↔ walk pose with bounded limb swing, no skeletal assets. | Idle → walk → idle has no pose snap; avatar heading follows approved route; the same tick trace gives the same final transform at 30, 60, and 120 fps render caps. |
| 4 | Generated texture loading and material fallback | Missing URLs, alpha fringes, and stretched textures are common browser-visible failures. | Upload approved PNGs to WebDev storage; preload all textures; use a small original diagnostic checker only in development; do not ship it as a silent fallback. | Network log has no failed asset request; reed alpha is clean against water/ground; ground/water tiling is not visibly stretched; screenshot matches the approved palette and object scale. |
| 5 | Deterministic presentation mode | Manual screenshots cannot reliably prove movement, interaction timing, or state handoff. | `?demo&seed=copper-lantern-slice-01` selects a fixed fixture, fixed server ticks, scripted semantic actions, and a bounded camera move. | Two fresh demo runs emit identical semantic event logs and final world state; the 14-second capture visibly shows move, gather, harvested resource, item receipt, and final HUD. |

After the risk slices pass, the main build integrates authored map dressing, full HUD styling, interaction highlights, rejection messages, and production-like admission wiring. It must not add a new high-risk system merely to make the scene look larger.

## 8. Deterministic `?demo` specification

`?demo&seed=copper-lantern-slice-01` is an explicit presentation mode. The `DemoPilot` drives the same semantic command path used by a player; it does not teleport the mesh, directly edit an inventory, or call render-only methods to fake success. `DemoGateway` is a deterministic fixture of the project-owned contract, runs with a fixed world fixture, and displays `DEMO FIXTURE — NO ACCOUNT DATA` in the HUD. It must be excluded from production builds or require a development-only build flag in addition to the query parameter.

The simulation uses a 100 ms fixed tick. Rendering may interpolate between states, but game-state advancement must not depend on `Date.now()`, random values, network latency, wall-clock time, or external data. All random-looking decorative placement is seeded from the specified seed and recorded in the demo event log.

| Demo time / tick | Semantic action | Visible proof |
|---|---|---|
| 0.0 s / 0 | Load the fixed map, snapshot, surveyor, and empty 8-slot inventory. | Sable Fen Waypost title, map composition, and the demo watermark are visible. |
| 0.8 s / 8 | Submit `move.intent` for the reed approach tile. | Surveyor turns and follows the server-approved route around the railing/tree blocker. |
| 4.8 s / 48 | Receive route completion snapshot; show in-range interaction prompt. | Surveyor stops beside the reeds; prompt appears only now. |
| 5.2 s / 52 | Submit one `interact.intent` with fixed command ID `demo-gather-0001`. | Reed patch highlights briefly while request is pending. |
| 5.6 s / 56 | Receive `command.resolved`; apply item delta and resource delta. | Reeds switch to cut stems; toast reads “Mirrorglass bundle acquired”; inventory becomes `1 / 8`. |
| 7.0–12.5 s / 70–125 | Hold final state and run a small deterministic camera easing move. | Capture shows the gathered state, item, route destination, and material detail without depending on manual input. |
| 14.0 s / 140 | Freeze on the successful final state. | Screenshot taken at or after this tick always contains the same success evidence. |

A normal player session uses the live gateway rather than `DemoGateway`. Network latency may delay client presentation, but no server acceptance/rejection semantics change. The deterministic adapter exists solely to make browser screenshots and regression testing repeatable.

## 9. Verification and acceptance criteria

### Automated checks

| Layer | Required check | Passing evidence |
|---|---|---|
| Clean-room/provenance | CI validates that runtime asset manifest entries have approval fields and checksums; build inputs contain no quarantined corpus paths; dependency licenses are reviewed. | Machine-readable provenance report and a passing release gate. |
| Type/build | Run `pnpm check` and `pnpm build` in the WebDev client. | Both exit successfully with no TypeScript errors. |
| Domain rules | Unit-test static route validation, bounds/blockers, gather range, cooldown, command idempotency, inventory revision increment, and rejection codes. | Same inputs produce same outputs; duplicate gather cannot duplicate the item. |
| Protocol | Contract tests validate accepted/rejected v1 JSON frames, unknown-field behavior, maximum payloads, ticket consumption, command correlation, and version mismatch. | Client/service fixture interoperate only through the documented project contract. |
| Determinism | Run the demo reducer/event trace twice for the fixed seed and compare normalized world snapshot, event sequence, and final inventory revision. | Byte-for-byte normalized trace equality; stable final state at different render frame caps. |
| Browser lifecycle | Mount/unmount test checks one engine, one resize listener, one render loop, and full cleanup. | No duplicate canvas/engine or listener accumulation under React strict mode. |
| Runtime logs | Inspect the relevant `.manus-logs/*.log` tails after each visual iteration. | No uncaught exceptions, WebGL errors, failed textures, or protocol decode errors. |

### Interactive and visual QA

A reviewer must test a normal local test-ticket session as well as `?demo`. In normal play, clicking walkable ground moves the surveyor in the expected direction, clicking a blocked tile receives a readable rejection or no permitted route, and the gather prompt cannot complete while the player is out of range. In-range gathering must show a pending state, then exactly one server-confirmed inventory update and harvested resource state. Refresh/reconnect must render the server snapshot instead of restoring a client-authored inventory.

For visual proof, use `webdev_take_screenshot` against the WebDev preview at a 16:9 viewport after `?demo&seed=copper-lantern-slice-01` reaches tick 140. Capture a second screenshot during the route segment to prove live movement rather than a static outcome. The screenshots must visibly show the original map, surveyor, reeds, route motion or final harvested state, inventory count, and compact HUD with no clipped text, missing textures, debug mesh, fallback material, or copied branding. If a requirement cannot be seen in one of these browser captures or asserted by a deterministic test, it is not done.

### Definition of done

The first browser/client vertical slice is accepted only when the following are simultaneously true:

1. A fresh local environment starts the original browser client and local slice service from source using only approved dependencies, generated/original assets, and synthetic fixture data.
2. A local test ticket admits a seeded character to Sable Fen Waypost; the client sends only original versioned intent frames and renders server snapshots/results.
3. The player can visibly move around a static obstruction, gather one resource in range, and see one persisted inventory result without client-side authority.
4. `?demo&seed=copper-lantern-slice-01` reproduces the specified 14-second success sequence and yields identical normalized semantic traces across two runs.
5. `pnpm check`, `pnpm build`, domain/protocol/determinism tests, provenance checks, and browser runtime-log inspection pass.
6. Approved screenshots demonstrate both movement and successful interaction at the specified visual target quality.
7. `PLAN.md`, `STRUCTURE.md`, `MEMORY.md`, and `ASSETS.md` are current at the WebDev project root. A verified checkpoint is saved, and any later public delivery uses the WebDev Publish flow rather than a temporary debugging URL.

## 10. Implementation sequence and handoff artifacts

The team should execute in five short checkpoints: (1) clean-room/WebDev shell and empty canvas; (2) static map, camera, grid picking, and accepted route; (3) service admission plus authoritative gather/persistence contract; (4) generated original textures, procedural props/avatar, HUD, and interaction state; and (5) deterministic demo, screenshots, tests, checkpoint, and provenance review. Each checkpoint updates `MEMORY.md` with actual browser observations, not just code changes.

The implementation handoff is complete when the repository contains the four pipeline context files, protocol v1 documentation and fixtures, original world/content definitions, asset manifest/provenance records, test commands, a screenshot evidence folder or WebDev checkpoint reference, and a short runbook describing how to launch the local service and client. This plan intentionally does **not** authorize a desktop launcher, production sign-in, public analytics, real player data, or a public game release; those remain subject to the separate security, distribution, and governance gates.[1] [3]

## Sources consulted

[1] [Implementation brief](implementation-brief.md) — clean-room decision, staged delivery, authority, provenance, and release constraints.  
[2] [Clean-room architecture](architecture.md) — original protocol and server-authority principles.  
[3] [Launcher review](launcher-review.md) — distribution trust boundary and deferred launcher requirements.  
[4] [Drive inventory](drive-inventory.md) — mixed/unverified corpus assessment and quarantine rationale.  
[5] `/home/ubuntu/upload/combining.js` — inspected only to classify the supplied file as an unrelated Unicode range table; it is excluded from the product.

# Copper Lantern Welcome Garden Client Composition

**Track:** `client-composition`  
**Title:** Client composition and scene integration  
**Author:** Manus AI  
**Decision:** Compose the declared TypeScript modules behind a new, original **Welcome Garden scene controller** with a renderer port and an authority port. The first runnable build should be a presentation-only local demo with explicitly synthetic session state. It must not read, import, compile, emulate, or otherwise operationalize Drive or legacy RSPS material.

## Executive conclusion

The declared client modules are a strong content-and-presentation foundation, but they do not yet compose into an application. They define a protected Sable Fen Welcome Garden, an eight-step guide, cosmetic appearance transforms, procedural pose offsets, deterministic micro-detail generation, and a presentation plan. They do **not** define a browser entry point, renderer, input router, scene state store, authoritative client/server contract, movement endpoint, asset manifest, or build tooling. The clean-room world package validates levels and connectors and can authorize a connector traversal, but it has no client-facing transport or authoritative normal movement interface. [1] [2] [3] [4] [5] [6] [7]

The practical first vertical slice is therefore a new, original **single-scene client demo**: load a synthetic Welcome Garden snapshot; render an avatar at the declared spawn; render anchors, guide and protected-area HUD; permit camera, overview, cosmetic preview, and inspect interactions; and animate only against locally presented state. Any later networked adapter must submit intents and apply only server acknowledgements. In particular, a client button must never claim that a player has departed, moved, saved a cosmetic, earned a reward, or changed safety status until the project’s own authority service acknowledges it.

The design below reuses only the declared clean-room modules as data/utility imports. It introduces no dependency on the Ashfen content file because it describes a different world space and contains no Welcome Garden level. It introduces no dependency on any Drive, cache, legacy protocol, client, map, or launcher payload. [8] [9] [10]

## Current-state observations

| Area | What is available now | Composition consequence |
|---|---|---|
| Onboarding content | `BEGINNER_GUIDE_PACKAGE` has eight ordered, plain-language steps. Each names a `GuideAction`, an expected completion signal, and a safe-area restriction. The pocketbook and accessibility guidance are ready to render. [1] | The scene should derive its active step from `GuideStepId` and map normalized client events to guide progress. It must not treat prose completion signals as server messages. |
| Safe-area presentation | `BEGINNER_SAFE_AREA` establishes the Welcome Garden world space, level, spawn, palette, ten visual anchors, and a first-session path. It explicitly says policy is presentation/onboarding configuration and the server must enforce safety. [2] | The scene can construct its visual layout and explanatory HUD from this data, but `combatEnabled: false` is not client authority and must not become a local security decision. |
| Cosmetics | `player-appearance.ts` offers defaults, patches, sanitization, renderer-facing material slots, and silhouette-only morph values. The file explicitly excludes gameplay effects. [3] | The cosmetic mirror can own a session-local `preview` and a confirmed local display value. Persistence needs a separate original server request/acknowledgement later. |
| Avatar motion | `PlayerMotionController` returns a relative procedural `Pose` from an explicit state, time, speed, direction, and facing. Its pose offsets do not contain a world position. [4] | A scene adapter must provide world position separately and apply the pose only below the avatar root. Motion state must be derived from acknowledged movement or a clearly labelled local demo simulation. |
| World details and overview | `generateMicroDetails` provides deterministic, non-colliding decorative instances. `createRealmOverview` and `createHudOverview` construct display state. [5] | Details should be generated once per garden content seed, then filtered away from anchors and the arrival/movement corridor. Overview markers must be constructed from garden anchors and current authoritative location. |
| Presentation plan | The plan includes a `welcome-garden` district, compatible bounds, three garden landmarks, layer rules, and a canonical-coordinate policy. [6] | It provides the scene’s district bounds and render layering. The landmark identifier `stillwater-mirror` does not match safe-area anchor identifier `cosmetic-mirror`, so an explicit binding is required instead of string coincidence. |
| Authority sample | The Go world package validates level support and connectors, then authorizes only connector traversal against the current graph revision and player origin. Tests cover stale revision and locked/unavailable rejection. [7] [11] | Do not fabricate a TypeScript import of Go types or presume a walk/move API exists. An original adapter contract and a synthetic demo adapter are needed before a real gateway is implemented. |
| Ashfen authored content | Ashfen declares an original clean-room source boundary and shows a level/connector content schema, but uses `ashfen-frontier` and has no `welcome-garden-ground` level. [8] | It is not input to the Welcome Garden demo. It may inform a future project-owned content schema review, but must not be silently repurposed as the garden’s navigation or authority data. |
| Repository/runtime | The declared `cleanroom-client` directory contains exactly the six source modules reviewed here. No root `package.json`, `tsconfig.json`, Vite configuration, entry point, renderer, or client tests were found. | The first implementation must establish a minimal original client scaffold and test configuration before scene code can be run. This review did not compile any file. |

### Important mismatches to resolve in the composition layer

The guide package, safe-area configuration, and presentation plan use related but not identical identifiers. `SafeAreaPolicy.protectedUntilTutorialStep` contains `"cosmetic-confirmed"`, while guide progress is typed as `GuideStepId` and has no such identifier. `firstSessionPath` also mixes system milestones such as `"login-admission"` and `"safe-spawn"` with anchor IDs. `buildBeginnerHud` accepts an untyped `string`, which makes an unknown progress value fall back to `login-admission`, an entry with no anchor. The scene must therefore not use this function as its canonical guide-state reducer. It may use the function for display only after a new adapter maps canonical guide status to its legacy string input. [1] [2]

The data model also uses two coordinate conventions. A `DetailInstance` uses `x` and `y` as grid axes and `z` as a small elevation offset. `Vec3` in player motion uses `y` as vertical space. A direct spread from one object to the other would turn a tile row into avatar height. One explicit `TileWorldTransform` must own all tile/grid-to-render conversions. [4] [5]

Finally, cosmetic sanitization validates colors and bounded array lengths but does not validate the runtime membership of every appearance enum or `SurfaceMaterial.slot`. The scene should call the existing sanitizer, but the new server and renderer boundaries should still validate untrusted values. Before remote cosmetic payloads are accepted, extend sanitization with explicit enum allowlists and renderer-safe texture-key rules. [3]

## Proposed composition boundary

The scene is organized as a unidirectional presentation shell:

```text
original snapshot / local demo fixture
              │
              ▼
       GardenAuthorityPort ── acknowledgement / rejection ──┐
              │                                               │
              ▼                                               │
input → GardenSceneController → GardenSceneState → render model → GardenRenderer
              │                         │
              │                         ├─ BEGINNER_GUIDE_PACKAGE
              │                         ├─ BEGINNER_SAFE_AREA
              │                         ├─ appearance + motion utilities
              │                         └─ world details + presentation plan
              ▼
       visible pending / error / consent UI
```

`GardenSceneController` is the only module allowed to turn user input into an intent. `GardenRenderer` is a passive projection: it receives a render model and emits normalized semantic input. `GardenAuthorityPort` is the only boundary allowed to request a state-changing operation. A first demo implementation can fulfill this port from a synthetic in-memory fixture, but it must identify itself as `local-demo` in state and visual UI. No renderer, animation controller, or guide component may mutate location, departure, reward, or persisted appearance by itself.

### Coordinate and layer rules

Use the existing garden district bounds as canonical tile coordinates. The initial scene should use **one render unit per tile** unless an asset scale later requires an explicit conversion. Coordinate conversion remains centralized:

```ts
export type GardenTile = Readonly<{ x: number; y: number }>;
export type GardenVec3 = Readonly<{ x: number; y: number; z: number }>;

export type TileWorldTransform = Readonly<{
  tileSize: number;
  origin: GardenVec3;
  tileToWorld(tile: GardenTile, elevation?: number): GardenVec3;
  worldToTile(position: GardenVec3): GardenTile;
}>;

// The one required mapping: tile y is render z; render y is elevation.
export const gardenTransform: TileWorldTransform = {
  tileSize: 1,
  origin: { x: 0, y: 0, z: 0 },
  tileToWorld: (tile, elevation = 0) => ({
    x: tile.x,
    y: elevation,
    z: tile.y,
  }),
  worldToTile: (position) => ({
    x: Math.round(position.x),
    y: Math.round(position.z),
  }),
};
```

Render ordering follows the existing plan: terrain, structures, life, atmosphere, wayfinding, then HUD. Avatar collision remains outside these layers. Micro-details, interaction glows, camera ease, material morphs, and poses are decorative only. The scene should reserve the arrival sightline, the safe walking strip between plinth and mirror, and one-tile interaction rings around anchors before detail placement. [2] [5] [6]

## Exact new interfaces and types

These declarations should be placed in a new client-owned file. They are an original project contract; they are intentionally not Go imports and are not a translation of unverified material.

```ts
// src/cleanroom-client/welcome-garden/contracts.ts
import type { AppearancePatch, PlayerAppearance } from "../player-appearance";
import type { GuideAction, GuideStepId } from "../beginner-guide-package";
import type { MotionState, Pose, Vec3 } from "../player-motion";
import type { HudOverviewState } from "../world-detail-pass";
import type { BeginnerAnchorKind, VisualAnchor } from "../beginner-safe-area";

export type GardenTile = Readonly<{ x: number; y: number }>;
export type GardenConnectionStatus = "local-demo" | "connecting" | "online" | "offline";
export type GardenRequestPhase = "idle" | "pending" | "accepted" | "rejected";
export type GardenDeparturePhase = "unseen" | "inspecting" | "awaiting-confirmation" | "pending" | "confirmed" | "rejected";
export type GardenCosmeticPhase = "closed" | "previewing" | "pending" | "confirmed" | "rejected";

export type GardenPlayerSnapshot = Readonly<{
  playerId: string;
  tile: GardenTile;
  facingRadians: number;
  motion: MotionState;
  speed01: number;
  appearance: PlayerAppearance;
  appearanceRevision: number;
}>;

export type GardenPortalSnapshot = Readonly<{
  anchorId: "departure-gate";
  label: string;
  destinationLabel: string;
  available: boolean;
  reasonUnavailable?: string;
}>;

export type GardenWorldSnapshot = Readonly<{
  source: GardenConnectionStatus;
  revision: number;
  worldSpace: "sable-fen";
  levelId: "welcome-garden-ground";
  player: GardenPlayerSnapshot;
  portal: GardenPortalSnapshot;
}>;

export type GardenIntent =
  | Readonly<{ type: "move.request"; requestId: string; destination: GardenTile }>
  | Readonly<{ type: "appearance.confirm"; requestId: string; baseRevision: number; patch: AppearancePatch }>
  | Readonly<{ type: "departure.confirm"; requestId: string }>;

export type GardenAuthorityError = Readonly<{
  code: "OFFLINE" | "INVALID_DESTINATION" | "STALE_REVISION" | "UNAVAILABLE" | "NOT_ALLOWED" | "UNKNOWN";
  message: string;
  requestId: string;
}>;

export type GardenAuthorityPort = Readonly<{
  load(): Promise<GardenWorldSnapshot>;
  submit(intent: GardenIntent): Promise<GardenWorldSnapshot>;
}>;

export type GardenProgressEvent =
  | Readonly<{ type: "camera.changed" }>
  | Readonly<{ type: "move.acknowledged"; destination: GardenTile }>
  | Readonly<{ type: "overview.opened" }>
  | Readonly<{ type: "appearance.confirmed" }>
  | Readonly<{ type: "pocketbook.opened"; pageId: string }>
  | Readonly<{ type: "anchor.interaction.acknowledged"; anchorId: string }>
  | Readonly<{ type: "departure.inspected" }>
  | Readonly<{ type: "departure.confirmed" }>;

export type GardenInput =
  | Readonly<{ type: "camera.changed" }>
  | Readonly<{ type: "ground.selected"; destination: GardenTile }>
  | Readonly<{ type: "overview.set-open"; open: boolean }>
  | Readonly<{ type: "anchor.selected"; anchorId: string }>
  | Readonly<{ type: "appearance.preview"; patch: AppearancePatch }>
  | Readonly<{ type: "appearance.cancel" }>
  | Readonly<{ type: "appearance.confirm" }>
  | Readonly<{ type: "pocketbook.open"; pageId: string }>
  | Readonly<{ type: "departure.inspect" }>
  | Readonly<{ type: "departure.confirm" }>
  | Readonly<{ type: "notice.dismiss"; noticeId: string }>;

export type GardenSceneState = Readonly<{
  phase: "booting" | "ready" | "failed";
  snapshot?: GardenWorldSnapshot;
  selectedAnchorId?: string;
  completedGuideSteps: readonly GuideStepId[];
  activeGuideStepId?: GuideStepId;
  mapOpen: boolean;
  pocketbookPageId?: string;
  appearance: Readonly<{
    phase: GardenCosmeticPhase;
    preview: PlayerAppearance;
    confirmed: PlayerAppearance;
    error?: GardenAuthorityError;
  }>;
  departure: Readonly<{
    phase: GardenDeparturePhase;
    error?: GardenAuthorityError;
  }>;
  pending: Readonly<Record<string, GardenRequestPhase>>;
  notices: readonly string[];
  lastError?: GardenAuthorityError;
}>;

export type GardenAvatarRenderState = Readonly<{
  position: Vec3;
  facingRadians: number;
  pose: Pose;
  appearance: PlayerAppearance;
}>;

export type GardenRenderModel = Readonly<{
  state: GardenSceneState;
  hud: HudOverviewState;
  anchors: readonly VisualAnchor[];
  avatar?: GardenAvatarRenderState;
  timeSeconds: number;
}>;

export type GardenRenderer = Readonly<{
  mount(root: HTMLElement): void;
  render(model: GardenRenderModel): void;
  onInput(listener: (input: GardenInput) => void): () => void;
  dispose(): void;
}>;
```

The deliberately narrow authority port has only `load` and `submit`. It avoids baking a transport technology into scene code and makes all rejected mutations explicit. The real server-side implementation will need a distinct, versioned API specification and tests. It must validate session admission, input, current location, navigation, cosmetic entitlement, persistence, and departure eligibility independently. The existing Go `Traverse` behavior demonstrates the needed acknowledgement/rejection pattern for connector transitions, but it is not an implementation of this proposed API. [7] [11]

### Guide completion mapping

Implement guide completion as an explicit, local, testable mapping. The event only marks a step when it matches that step’s declared action and the event occurred in the Garden scene. This keeps guide text reusable while avoiding arbitrary string completion signals.

| `GuideStepId` | Required event | Required condition |
|---|---|---|
| `look-around` | `camera.changed` | First non-zero user camera adjustment in the mounted scene. |
| `move` | `move.acknowledged` | Acknowledged destination is inside the Welcome Garden snapshot. The demo adapter may acknowledge only its synthetic grid. |
| `open-overview` | `overview.opened` | `mapOpen` transitioned from false to true. |
| `shape-character` | `appearance.confirmed` | The authority port or explicitly local-demo adapter acknowledged the preview; never on slider change alone. |
| `read-pocketbook` | `pocketbook.opened` | Page belongs to `start-here`. |
| `try-safe-interaction` | `anchor.interaction.acknowledged` | Selected anchor is `tutorial-guide` or `map-table`; it produces a presentation acknowledgement only. |
| `learn-portal` | `departure.inspected` | Gate information is visible; no departure has happened. |
| `leave-garden` | `departure.confirmed` | Only a real future authority acknowledgement may complete it. The local demo should leave it incomplete and state that no travel service is connected. |

`activeGuideStepId` is always `getNextGuideStep(completedGuideSteps)?.id`. The legacy first-session string `cosmetic-confirmed` should be replaced in new state by the guide completion of `shape-character`. A `gardenProgressToHudMilestone` adapter may map it back to a display milestone only while `buildBeginnerHud` remains in use.

## State flow for the first scene

1. **Bootstrap.** `welcome-garden-entry.ts` constructs `LocalGardenDemoAuthority`, `WelcomeGardenRenderer`, and `GardenSceneController`. The controller calls `port.load()`. The fixture uses `BEGINNER_SAFE_AREA.area` for spawn identity and `createDefaultAppearance()` for the player. It declares `source: "local-demo"`.

2. **Content assembly.** `createWelcomeGardenContent()` selects the `welcome-garden` district from `WORLD_PRESENTATION_PLAN`, validates the exact level ID against `BEGINNER_SAFE_AREA.area.levelId`, maps anchors to overview markers, and creates deterministic micro-details from a fixed original seed. It filters details from reserved tile rectangles and anchor interaction radii. It does not infer walkability from the district or details.

3. **First render.** The controller projects `GardenSceneState` into a `GardenRenderModel`. It uses `buildLocationBreadcrumb`, `createRealmOverview`, and `createHudOverview` for visible text and map state. It displays a conspicuous local-demo/protected-area notice rather than implying online safety enforcement. [5] [6]

4. **Camera or overview input.** The renderer emits semantic `GardenInput`, not DOM events. The reducer changes only presentation state, emits the corresponding guide event, and re-renders. No port call is necessary.

5. **Ground selection.** The renderer reports a `GardenTile`. The controller records the request as pending and calls `authority.submit({ type: "move.request", ... })`. It does not animate the actor root to the selected tile before the acknowledgement. After acknowledgement, it replaces `snapshot`, then starts an interpolation from previous acknowledged tile to new acknowledged tile. The pose controller gets `walking` during that interpolation and `idle` afterward.

6. **Mirror interaction.** Selecting `cosmetic-mirror` opens session preview. Each edit applies `applyAppearancePatch(state.appearance.preview, patch)` and builds materials/morphs only for render. Confirm sends `appearance.confirm` with the last acknowledged appearance revision. An acknowledgement replaces both `confirmed` and `preview`; rejection leaves the confirmed version intact and retains preview for correction.

7. **Safe interaction and pocketbook.** Selecting `tutorial-guide` or `map-table` opens a locally authored explanatory panel. It can complete the guide’s safe-interaction step only after an explicit visible acknowledgement action. Opening a `start-here` pocketbook page completes the reading step. These are presentational acknowledgements and do not grant state or rewards.

8. **Departure.** Selecting the gate first opens destination and safety information from `GardenPortalSnapshot`; this completes inspection. A confirm action is disabled in `local-demo` and when `portal.available` is false. In a future online scene it sends `departure.confirm`; the scene changes level or announces departure only after a returned snapshot identifies a different level. Existing code has no Garden departure connector or server endpoint, so no real departure is included in the first runnable demo.

9. **Frame update.** `requestAnimationFrame` provides clamped delta seconds to `PlayerMotionController`. The scene computes `avatar.position` from acknowledged/interpolated tile location, calls `controller.update`, and applies `Pose.rootPosition` as a child transform. It must never add pose offsets back into tile state.

10. **Failure and teardown.** A rejected request clears its pending slot, preserves last acknowledged snapshot, places an accessible error notice in state, and leaves navigation/appearance unchanged. `dispose()` unsubscribes renderer input and cancels animation frames.

## First implementation files, in dependency order

| Order | File | Purpose and first contents |
|---:|---|---|
| 1 | `package.json` | New minimal clean-room client toolchain only. Pin TypeScript, a test runner, and a local dev server. Do not add Drive artifacts, native cache tooling, legacy clients, or third-party assets without provenance. |
| 2 | `tsconfig.json` | Strict TypeScript configuration for browser code and tests. Enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noEmitOnError`. |
| 3 | `src/cleanroom-client/welcome-garden/contracts.ts` | The interfaces above, including authority/renderer ports, state, input, snapshot, and render model. |
| 4 | `src/cleanroom-client/welcome-garden/content.ts` | `createWelcomeGardenContent()`, `TileWorldTransform`, reserved-tile filtering, and an explicit mapping between `cosmetic-mirror` and `stillwater-mirror`. Validate garden district, level, and anchor coordinates at startup. |
| 5 | `src/cleanroom-client/welcome-garden/progress.ts` | Pure `reduceGuideProgress(completed, event)` and `activeGuideStep()` functions using existing `GuideStepId` and `BEGINNER_GUIDE_PACKAGE`. Add the table above as unit tests. |
| 6 | `src/cleanroom-client/welcome-garden/scene-state.ts` | Pure reducer and initial-state builder. It owns pending/rejected request transitions, modal state, and accessible notices. It must have no DOM, network, or render imports. |
| 7 | `src/cleanroom-client/welcome-garden/local-demo-authority.ts` | A clearly labelled synthetic `GardenAuthorityPort` implementation. Permit only a declared small Garden tile set, keep the portal unavailable, return cloned snapshots, and never persist. Do not consume Ashfen or Go source at runtime. |
| 8 | `src/cleanroom-client/welcome-garden/scene-controller.ts` | Wires inputs to reducer/port calls, owns request IDs, projects state to render model, runs motion updates, and avoids optimistic authoritative state changes. |
| 9 | `src/cleanroom-client/welcome-garden/dom-renderer.ts` | First renderer port implementation using original CSS/SVG/Canvas primitives. Render a tile grid, stylized original anchor shapes, avatar silhouette, HUD, guide card, overview, pocketbook, and mirror panel. It should use no copied sprites, fonts, layouts, screenshots, audio, or cache assets. |
| 10 | `src/cleanroom-client/welcome-garden-entry.ts` and `index.html` | Browser mount point. Add a local development title that uses the project’s own approved temporary name, not a third-party name. |
| 11 | `src/cleanroom-client/welcome-garden/*.test.ts` | Unit tests for content validation, coordinate transform, reserved-detail filtering, guide mapping, state reducer, and demo authority rejection semantics. |
| 12 | `docs/protocol/welcome-garden-v1.md` | A later, original versioned specification for the online authority port before replacing the demo adapter. Include message schemas, auth/session behavior, idempotency, versioning, and error codes. |

The initial DOM renderer is intentional. It produces an inspectable runnable scene without prematurely selecting a rendering engine or acquiring unreviewed 3D assets. A later WebGL renderer can implement the same `GardenRenderer` contract, use `buildSurfaceMaterials` and `buildAppearanceMorphs`, and preserve the controller/state tests. [3] [4]

### Required content helper behavior

`content.ts` should reject configuration drift rather than rendering a misleading world. Its startup validation must verify all of the following:

- The safe area has `worldSpace === "sable-fen"` and `levelId === "welcome-garden-ground"`.
- The selected presentation district is `welcome-garden`, has the same level ID, and contains the safe-area spawn plus every anchor tile in its bounds.
- Every required guide-interaction anchor exists exactly once: `welcome-plinth`, `cosmetic-mirror`, `tutorial-guide`, `map-table`, and `departure-gate`.
- Every visual anchor has a stable overview marker. The mirror uses an explicit mapping to `stillwater-mirror`; the code must not rely on semantic label matching.
- Detail generation is deterministic for a fixed project-owned seed and returns only `collision: false` / `interactive: false` instances. Its output does not decide whether a player can walk to a tile.

## Acceptance criteria

The first implementation is accepted only when all criteria below pass with original/synthetic inputs.

| Category | Acceptance criterion |
|---|---|
| Runnable scene | A fresh checkout with the new declared toolchain starts a local browser page that mounts the Welcome Garden at `welcome-garden-ground`, shows the player at tile `(6, 8)`, and contains the plinth, mirror, guide, map table, and departure gate. The UI clearly states `local demo` and `protected area presentation; server enforcement required`. |
| Original-content boundary | The dependency lockfile, imports, dev-server assets, and output contain no Drive archive, legacy RSPS repository, cache, proprietary client, legacy protocol code, copied sprite/font/audio/image, or third-party brand. The scene’s only world data imports are declared clean-room modules plus its own synthetic fixture. |
| Type and content integrity | Strict type checking and content-validation tests pass. The bootstrap fails visibly if district/area level IDs, bounds, required anchors, or explicit landmark mappings drift. |
| Camera and guide | Moving the camera once completes only `look-around`. Opening overview completes only `open-overview`. Re-opening either remains idempotent and does not skip steps. Guide text and safety information remain reachable after a step completes. |
| Movement boundary | Clicking a permitted demo tile produces a pending indicator, then moves only after demo adapter acknowledgement. Clicking a blocked/out-of-bounds tile rejects without changing the acknowledged tile. Avatar pose changes do not change rendered tile location or scene state. |
| Cosmetics boundary | Mirror edits update preview materials/morphs but do not alter player gameplay fields because no such fields are present in the scene. Cancel restores the confirmed display. Confirm uses the authority port and has an acknowledgement/rejection result. Unknown enum/material values are rejected before renderer use. |
| Overview and details | The overview’s active player marker follows acknowledged location and appears above decorative layers. Reopening the scene with the same seed produces identical detail IDs/locations. No micro-detail appears in the reserved arrival corridor or interaction rings. |
| Departure safety | Gate inspection displays destination/safety copy and completes `learn-portal` without moving the player. The local demo cannot complete `leave-garden`, cannot change level, and cannot claim a server transition. |
| Accessibility and resilience | All controls work with keyboard focus, guide and error messages are exposed through appropriate text/ARIA live regions, color is never the sole cue, and reduced-motion mode suppresses nonessential ambient/motion animation without altering state. Rejected requests preserve the last confirmed state and explain the failure in plain language. |
| Test isolation | Pure reducer, progress, content, and demo-authority tests run without browser networking. No test starts a legacy service or compiles/loads unverified source. |

## Risks and mitigations

| Risk | Why it matters | Mitigation and release gate |
|---|---|---|
| Local configuration mistaken for security | `BEGINNER_SAFE_AREA` says its policy is presentation-only, while a user-facing safe-area claim can sound authoritative. [2] | Always render the distinction in demo mode. Before online release, require server-side safety, admission, combat, trade, loss, and persistence tests; the client may display but never enforce these rules. |
| No authority API for ordinary movement or Garden departure | The reviewed Go sample authorizes connector traversal but does not expose a gateway or normal move endpoint; no Garden connector is defined. [7] | Keep first build local-demo and disable real departure. Write and approve a project-owned protocol specification plus contract tests before enabling an online adapter. |
| Identifier and milestone drift | The guide, safe-area, and plan currently have mismatched mirror IDs and an untyped `cosmetic-confirmed` milestone. [1] [2] [6] | Introduce one explicit binding module and typed guide reducer. Add startup consistency tests; do not use arbitrary strings as scene authority. |
| Coordinate-axis bugs | Grid `y` and render height `y` have conflicting meanings in the existing modules. [4] [5] | Use `TileWorldTransform` exclusively. Unit-test rows, elevation, spawn conversion, anchor conversion, and inverse conversion. |
| Decorative content obscures usable space | Generated details are non-colliding, but unrestricted placement can cover path cues or anchors visually. [5] [6] | Filter using reserved tiles and interaction radii. Make clear that decoration never supplies navigation data or clickable hitboxes. |
| Cosmetic preview becomes unintended persistence | Existing helpers are renderer-oriented and accept runtime payloads that require further enum/slot validation. [3] | Treat preview as ephemeral. Validate enum values, material slots, color strings, texture references, entitlement, revision, and rate limits on the future server; return only acknowledged appearance. |
| Premature renderer/asset commitment | A 3D-first scene can force undocumented tool, asset, and license choices. | Start with original DOM/SVG/Canvas primitives behind `GardenRenderer`. Add a renderer only after asset provenance, performance, accessibility, and clean-room review. |
| Brand and source contamination | The working path and prior reviews refer to 2006Scape/RSPS material, which is expressly quarantined. [9] [10] | Use Copper Lantern/Sable Fen names only where approved. Add a prohibited-term/provenance CI scan and asset register before distribution; never make quarantined material part of the dev environment. |
| Launcher interpreted as scene authorization | A local page or desktop launcher cannot prove server access, content ownership, or safety enforcement. [10] | Treat launcher/update work as a separate signed distribution boundary. Do not add any launcher integration until original artifacts, provenance, and a versioned service are available. |

## Recommended next decision

Authorize the **presentation-only Welcome Garden demo scaffold** and its test suite as the next implementation increment. It creates a concrete runnable scene while retaining a hard seam between original client presentation and future server authority. Do not authorize a networked movement, cosmetic persistence, or departure implementation until an original protocol and server feature exist with their own contract tests. Do not use the Ashfen file as an implicit replacement for Garden authority data, and do not touch unverified Drive or legacy material.

## References

[1]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/beginner-guide-package.ts "Copper Lantern beginner guide package"
[2]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/beginner-safe-area.ts "Copper Lantern beginner-safe area configuration"
[3]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/player-appearance.ts "Copper Lantern player appearance presentation module"
[4]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/player-motion.ts "Copper Lantern procedural player motion module"
[5]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/world-detail-pass.ts "Copper Lantern world detail and overview presentation module"
[6]: file:///home/ubuntu/2006scape-build/src/cleanroom-client/world-presentation-organization.ts "Copper Lantern world presentation organization"
[7]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/world.go "Copper Lantern clean-room world authority sample"
[8]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/content/ashfen-expansion-v1.json "Ashfen expansion original-authored clean-room content"
[9]: file:///home/ubuntu/2006scape-build/research/implementation-brief.md "Clean-room implementation brief"
[10]: file:///home/ubuntu/2006scape-build/research/launcher-review.md "Launcher and bootloader implementation review"
[11]: file:///home/ubuntu/2006scape-build/src/cleanroom-world/world_test.go "Clean-room world authority tests"

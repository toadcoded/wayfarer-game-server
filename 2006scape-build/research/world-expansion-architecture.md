# Copper Lantern World Expansion Architecture

## Purpose

This document advances the clean-room Phase 1 architecture from a single outdoor waypost to a world model that can support **caves, larger buildings, multi-room interiors, upper floors, stairs, doors, NPC anchors, and future region streaming** without importing legacy maps, caches, client behavior, protocols, or assets.

The design keeps all fairness-sensitive state server-authoritative and uses only original or expressly licensed content. The current playable slice remains the first milestone; caves and large buildings are the next architectural expansion, not a reason to widen the initial release indiscriminately.

## Design decision

Use a **layered world-coordinate model**:

- A `WorldSpace` identifies a connected authored region, such as Sable Fen Waypost, Fenhold Lodge, or the Copperroot Caverns.
- A `LevelId` identifies a vertical layer within that space, such as exterior ground, lodge upper floor, cellar, or cave depth two.
- A `TileCoord` identifies the logical navigation cell on that level.
- A `Portal` connects two coordinates and levels. Examples include a stair, hatch, cave mouth, ladder, lift, or one-way drop.
- A `RoomVolume` and `Occluder` describe rendering and visibility boundaries but do not replace server collision rules.
- A `RegionChunk` is a future streaming unit. It is an optimization boundary, not an authority boundary.

The canonical player location is therefore:

```text
WorldSpace + LevelId + TileCoord + facing + movement revision
```

Never encode a cave or building as an implicit coordinate hack. A transition is an explicit server-approved command with a destination, transition ID, and resulting world snapshot.

## World data model

The authored content package should contain original JSON or a typed equivalent:

```ts
type LevelId = string & { readonly __levelId: unique symbol };
type PortalId = string & { readonly __portalId: unique symbol };
type RoomId = string & { readonly __roomId: unique symbol };

type TileCoord = {
  x: number;
  y: number;
  level: LevelId;
};

type Portal = {
  id: PortalId;
  from: TileCoord;
  to: TileCoord;
  kind: "door" | "stairs" | "ladder" | "cave-mouth" | "hatch" | "drop";
  traversal: "walk" | "interact" | "climb" | "drop";
  bidirectional: boolean;
  requiredAction?: string;
  lockedStateKey?: string;
  destinationSpawnRadius: number;
  visibilityPolicy: "fade" | "cut" | "doorway";
};

type RoomVolume = {
  id: RoomId;
  level: LevelId;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  ceilingHeight: number;
  roofPolicy: "always-visible" | "hide-when-entered" | "cutaway";
  ambientProfile: "outdoor" | "stone-interior" | "wood-interior" | "cave";
};

type WorldLevel = {
  id: LevelId;
  worldSpace: string;
  tileSizeMeters: number;
  width: number;
  height: number;
  collision: number[];
  rooms: RoomVolume[];
  portals: Portal[];
  occluders: Array<{ x: number; y: number; width: number; height: number }>;
};
```

The server loads validated content definitions and rejects malformed topology at startup. Validation must catch missing portal endpoints, out-of-bounds tiles, inconsistent bidirectional links, duplicate IDs, unreachable authored rooms, impossible destination radii, and a portal that crosses into a level not registered by the same world package.

## Caves

### Cave structure

Caves should be authored as connected levels rather than as visual holes in the outdoor mesh. The first cave expansion should contain:

1. An exterior cave mouth in the Sable Fen region.
2. A short entrance chamber with a clear transition point.
3. One branching chamber with two valid navigation routes.
4. A lower level reached through a stair or rope descent.
5. One server-authoritative interaction anchor, such as a survey marker or mineral growth.
6. A return route that does not require teleporting the player.

This gives the architecture a meaningful test of vertical transitions, visibility, collision, route validation, and reconnect behavior without requiring a complete underground biome.

### Cave lighting

Cave lighting is a client presentation concern constrained by server state. The server sends the active level, room, and any gameplay-relevant light-state flags. The client renders original materials, ambient colors, local lantern falloff, and bounded fog. The client must not use darkness as a security boundary: hidden entities, collision, loot, and interaction eligibility are still determined by the server.

Use a small set of authored lighting profiles:

- `cave-entrance`: cool ambient, soft exterior spill.
- `cave-stone`: low warm-neutral ambient, limited local lights.
- `cave-depth`: darker blue-green ambient with authored emissive markers.
- `cave-workroom`: warmer lantern cluster around an interaction anchor.

Avoid expensive volumetric effects in the first slice. Use room-level ambient parameters and a small number of point/hemispheric lights, with a deterministic fallback for mobile browsers.

### Cave visibility

At minimum, the client should render the active level and a small portal-adjacent preview region. The server never relies on the client’s visibility result for authority. The client may hide roofs, fade doorway shells, and unload distant meshes, but it must retain a stable entity/portal identity map so that a late snapshot cannot attach to a different object.

## Larger buildings and interiors

### Building decomposition

A large building is a content package with separate layers:

```text
BuildingDefinition
├── footprint and exterior shell
├── level definitions
├── room volumes
├── doors and windows
├── stair/lift/ladder portals
├── roof and cutaway rules
├── interaction anchors
├── NPC spawn/idle anchors
├── occluders and camera bounds
└── interior asset manifest
```

The first large building should be **Fenhold Lodge**, an original two-floor structure with:

- A covered entrance porch.
- A public ground-floor hall.
- A side workshop with a gather/craft anchor reserved for a later skill system.
- A stairwell to an upper archive room.
- A roof that hides or becomes a transparent cutaway when the player enters.
- Two NPC anchor points, but no full dialogue system yet.
- One locked side door represented as a server-controlled door state.

### Roof and camera policy

Roofs and upper shells are not deleted when the player enters. The client changes their visibility or material according to the active room and camera position. Use a deterministic priority order:

1. Show the player’s current room.
2. Preserve the current floor collision shell.
3. Hide or fade only roof/occluder meshes that block the camera view.
4. Keep adjacent portals and doorway silhouettes readable.
5. Restore the shell on exit or when the player changes level.

The client must never infer room authority from camera position alone. The server snapshot includes the active `LevelId`, room ID when available, and transition revision.

### Doors and dynamic obstruction

Doors are server-owned entities. A door may change from `open` to `closed` or `locked`, which updates both interaction eligibility and the navigation graph. The client can animate the door immediately for responsiveness only after receiving an accepted state transition; it must reconcile to the authoritative result.

A closed door is a collision edge, not merely a visual mesh. Path validation must test the graph version used by the requested movement. If the graph version has changed, the server rejects or replans the route and emits a fresh snapshot.

## Navigation model

### Phase 1.5: hierarchical authored graph

Do not introduce a general-purpose dynamic navmesh yet. Use a deterministic hierarchical graph:

```text
WorldSpace
  -> LevelGraph
       -> RoomGraph
            -> TileGraph
                 -> walk edges
                 -> portal edges
                 -> dynamic door edges
```

Movement requests remain intent-based. The client sends a destination tile or a portal interaction intent; the server validates ownership, bounds, collision, current graph revision, and transition prerequisites. The server chooses the route and emits approved route segments.

A portal edge carries:

```text
portal_id
source_level
source_tile
destination_level
destination_tile
traversal_kind
graph_revision
```

The route executor must pause at a portal boundary, resolve the transition, then resume on the destination level only after the server commits the new position.

### Future streaming boundary

Region chunks should be introduced only after the multi-level content works locally. A chunk can contain several rooms or cave chambers, but a portal may cross chunks. The streaming system must maintain:

- A stable world-space and level identity.
- A portal registry loaded before either endpoint becomes interactive.
- A server snapshot that remains valid when a client unloads visual geometry.
- A preload ring around the player and active portal path.
- A hard memory cap and mobile-quality fallback.

Streaming must never change the authoritative simulation. It only controls which approved meshes, textures, room decorations, and non-authoritative effects are resident in the client.

## Server authority and transition protocol

Add project-authored frames to the existing Copper Lantern protocol:

```text
portal.inspect.intent
portal.traverse.intent
world.transition.resolved
world.transition.rejected
```

`portal.traverse.intent` contains only:

```json
{
  "type": "portal.traverse.intent",
  "protocolMajor": 1,
  "commandId": "opaque-command-id",
  "portalId": "fenhold-lodge-stair-up",
  "clientGraphRevision": 12
}
```

The server checks:

- The command is correlated to the authenticated player session.
- The portal exists in the current world package.
- The player is at the source tile and within the allowed interaction radius.
- The portal is open or the required action has been completed.
- The graph revision is current or safely re-plannable.
- The destination spawn area is walkable and not occupied by an invalid blocker.
- The command ID has not already resolved.

The result includes the authoritative destination and transition revision:

```json
{
  "type": "world.transition.resolved",
  "commandId": "opaque-command-id",
  "worldSpace": "sable-fen",
  "levelId": "fenhold-lodge-upper",
  "tile": { "x": 6, "y": 3 },
  "roomId": "archive-room",
  "graphRevision": 13,
  "transitionRevision": 4
}
```

## Minimal Go authority snippet

This is a project-owned domain example, not a legacy protocol implementation:

```go
package world

import "errors"

type Portal struct {
	ID              string
	FromLevel       string
	FromX, FromY    int
	ToLevel         string
	ToX, ToY        int
	Open            bool
	InteractionRange int
}

type PlayerState struct {
	ID              string
	Level           string
	X, Y            int
	GraphRevision   uint64
	TransitionRevision uint64
}

type TraverseIntent struct {
	CommandID          string
	PortalID            string
	ClientGraphRevision uint64
}

type TransitionResult struct {
	CommandID          string
	Level              string
	X, Y               int
	GraphRevision      uint64
	TransitionRevision uint64
}

func TraversePortal(p PlayerState, portal Portal, intent TraverseIntent, graphRevision uint64) (TransitionResult, error) {
	if intent.CommandID == "" || intent.PortalID == "" {
		return TransitionResult{}, errors.New("invalid command")
	}
	if portal.ID != intent.PortalID || !portal.Open {
		return TransitionResult{}, errors.New("portal unavailable")
	}
	if p.Level != portal.FromLevel || p.X != portal.FromX || p.Y != portal.FromY {
		return TransitionResult{}, errors.New("player not at portal")
	}
	if intent.ClientGraphRevision != graphRevision {
		return TransitionResult{}, errors.New("stale graph revision")
	}
	return TransitionResult{
		CommandID: intent.CommandID,
		Level: portal.ToLevel,
		X: portal.ToX,
		Y: portal.ToY,
		GraphRevision: graphRevision,
		TransitionRevision: p.TransitionRevision + 1,
	}, nil
}
```

Production code must add idempotency storage, transaction boundaries, rate limits, collision checks around the destination, audit logging, and a safe retry policy. The snippet intentionally keeps the authority surface narrow and testable.

## Client rendering modules

Extend the existing client layout with:

```text
client/src/game/
├── world/
│   ├── WorldSpace.ts
│   ├── LevelScene.ts
│   ├── TileMap.ts
│   ├── RoomVolume.ts
│   ├── PortalRenderer.ts
│   ├── DoorEntity.ts
│   ├── RoofController.ts
│   ├── OcclusionController.ts
│   └── ChunkResidency.ts
├── navigation/
│   ├── ClientRoutePreview.ts
│   ├── PortalIntentController.ts
│   └── GraphRevisionTracker.ts
├── lighting/
│   ├── LightingProfile.ts
│   └── LightBudget.ts
└── net/
    ├── WorldGateway.ts
    └── TransitionMessages.ts
```

`LevelScene` owns Babylon meshes for one level and disposes them as a unit. `WorldSpace` owns the active level and transition lifecycle. `RoofController` and `OcclusionController` are visual only. `PortalIntentController` sends intent and waits for authoritative resolution. `ChunkResidency` may unload meshes but never removes the logical portal registry or state identity map.

## Implementation order

### Slice A — topology foundation

Add two levels to a synthetic test world, one outdoor level and one lodge interior. Implement authored JSON validation, level-aware tile coordinates, one stair portal, and snapshot serialization.

**Acceptance:** player can transition from exterior to lodge ground floor and back; reconnect restores the same level and tile; malformed portal definitions fail startup.

### Slice B — large building shell

Build Fenhold Lodge from original primitive geometry: porch, hall, workshop, stairwell, upper archive room, roof, doors, and room volumes.

**Acceptance:** entering the lodge hides/fades only the roof shell; the player cannot walk through closed doors; upper-floor camera bounds remain readable; level transitions are deterministic.

### Slice C — cave branch

Add Copperroot Caverns with an entrance chamber, branching chamber, lower level, and one interaction anchor. Use a separate cave lighting profile and a bounded local mesh set.

**Acceptance:** both cave routes are navigable; the lower-level transition requires the portal action; the client does not render stale outdoor entities as active cave entities; reconnect and snapshot recovery work at depth.

### Slice D — dynamic doors and graph revisions

Add one server-controlled door state and graph revision increment. Test a route request racing with a door closure.

**Acceptance:** stale routes reject or replan; duplicate portal commands resolve idempotently; a client cannot force an open door or teleport across it.

### Slice E — bounded residency

Add a simple two-ring residency policy: active level plus adjacent portal-preview level. Keep the server snapshot independent of visual residency.

**Acceptance:** client memory stays within a configured test budget; unloading/reloading a level preserves mesh identity and authoritative state; mobile fallback disables expensive effects without changing gameplay.

## Non-goals for this expansion

Do not add seamless open-world streaming, procedural caves, destructible buildings, physics-based stairs, free-flight cameras, imported 3D assets, legacy map conversion, legacy cache decoding, a proprietary protocol, full NPC dialogue, combat, economy, or public distribution as part of this architecture increment.

## Quality gates

- All cave, building, room, portal, and door content has original-art and provenance records.
- Server domain tests cover transitions, stale graph revisions, closed doors, invalid destinations, duplicate commands, reconnects, and room-level persistence.
- Client tests cover level disposal, roof visibility, portal presentation, camera bounds, and deterministic residency.
- Demo mode includes one building transition and one cave transition while remaining visibly labeled as a non-account fixture.
- No supplied Drive archive, legacy client, cache, map, protocol note, plugin, or `editor.c` enters the product tree or build context.

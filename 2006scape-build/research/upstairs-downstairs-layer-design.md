# Upstairs / Downstairs Layer Design

## Scope

This design adds two usable vertical layers to the Copper Lantern world without relying on the supplied `mapman64.zip` or any other Drive archive as a runtime input. The archive remains read-only evidence until artifact-specific rights and security review are completed.

The target is an original, testable structure that exercises:

- Exterior-to-interior entry.
- Ground-floor rooms.
- An upstairs floor with a stair portal.
- A downstairs cellar/cave connection.
- Roof visibility and camera handling.
- Level-aware collision and navigation.
- Server-authoritative transitions and reconnects.

## Chosen location: Fenhold Lodge

Fenhold Lodge is a large original building at the edge of Sable Fen Waypost. It is intentionally compact enough for the first multi-level implementation while being large enough to prove the architecture.

### Layer stack

```text
Z = +1  FENHOLD_LODGE_UPPER
       Archive room · caretaker landing · balcony overlook
       16 × 12 logical tiles · 3.4 m floor-to-floor height
       Stair portal from ground floor
       No roof collision in the playable interior volume

Z =  0  SABLE_FEN_EXTERIOR / FENHOLD_LODGE_GROUND
       Porch · public hall · workshop · stair hall · locked side door
       20 × 16 logical tiles · exterior transition boundary
       Main player arrival and building entrance

Z = -1  FENHOLD_LODGE_CELLAR
       Storage cellar · root cellar · sealed tunnel mouth
       14 × 10 logical tiles · low ceiling and limited sightlines
       Hatch/stair portal from ground floor

Z = -2  COPPERROOT_CAVERNS_ENTRY
       Cave entrance chamber · branching chamber · survey marker
       Separate world level connected by a controlled tunnel portal
       Future lower cave depth deferred
```

The player’s logical location always contains the level identity. Do not represent upstairs or downstairs as a large Y coordinate in one flat collision grid.

## Ground floor: `fenhold-lodge-ground`

### Room layout

```text
North
┌────────────────────┬────────────────────┬──────────────┐
│ Public Hall        │ Stair Hall         │ Side Door    │
│ room: hall         │ stair-up portal    │ locked       │
│                    │ stair-down portal  │ door entity  │
├────────────────────┼────────────────────┼──────────────┤
│ Covered Porch      │ Workshop           │ Service     │
│ exterior entry     │ future craft anchor│ Corridor    │
│ spawn/arrival      │ NPC anchor         │ cellar hatch │
└────────────────────┴────────────────────┴──────────────┘
South
```

### Ground-floor rules

- The porch is part of the exterior level for camera and weather continuity.
- Crossing the threshold changes the active room but not the level until the player is fully inside.
- The main hall is public and contains one NPC anchor.
- The workshop contains an interaction anchor but no full crafting system yet.
- The stair hall exposes two portal entities: `lodge-stair-up` and `lodge-stair-down`.
- The side door begins locked and is a server-owned obstruction.
- The cellar hatch is visually present but only traversable through the authored hatch portal.

## Upstairs: `fenhold-lodge-upper`

### Room layout

```text
North
┌────────────────────────────┬──────────────────────────┐
│ Archive Room               │ Caretaker Landing        │
│ room: archive              │ room: landing            │
│ survey documents anchor   │ NPC anchor               │
│ window/overlook occluder  │ stair-down portal        │
└───────────────┬────────────┴──────────────────────────┘
                │ stair opening / railing
                │ portal origin: (6, 3)
South           │
```

### Upstairs behavior

- The upstairs floor is a separate `LevelId`, not a room flag.
- The stair landing is the authoritative destination spawn tile.
- The archive contains one original survey interaction anchor for later content.
- The roof shell is hidden or faded only while the camera is inside the upper floor’s room volume.
- Exterior walls and windows remain readable as silhouettes; the client does not remove the entire building.
- The stair opening has a collision railing around it. The portal is a deliberate interaction boundary, not a walk-off edge.
- Upper-floor camera radius is clamped more tightly than the exterior camera so the player remains visible inside the smaller floor plan.
- Reconnecting upstairs restores `worldSpace`, `levelId`, room ID, tile, facing, and transition revision.

### Upstairs acceptance tests

1. A player can reach the stair hall on the ground floor.
2. An accepted `portal.traverse.intent` moves the player to the upper landing.
3. A player cannot reach the archive by walking through the stair wall.
4. The roof fades without changing collision or room authority.
5. A closed or invalid stair portal rejects without changing player location.
6. A reconnect snapshot restores the upstairs level and archive-room state.

## Downstairs: `fenhold-lodge-cellar`

### Room layout

```text
North
┌──────────────────────┬─────────────────────────┐
│ Root Cellar          │ Storage Cellar          │
│ room: roots          │ room: storage           │
│ low shelves          │ crate blockers          │
│                      │ tunnel seal            │
├──────────────────────┴───────────────┬─────────┤
│ Hatch Landing                        │ Tunnel  │
│ portal origin from ground            │ locked  │
│ low ceiling / lantern light          │ mouth   │
└──────────────────────────────────────┴─────────┘
South
```

### Downstairs behavior

- The cellar is a separate level with a lower ceiling and a smaller light budget.
- The cellar hatch destination is a fixed, validated landing tile.
- Storage crates are ordinary collision blockers, not client-only decoration.
- The sealed tunnel mouth is visible but unavailable until a later content milestone; it must not be a fake portal that silently teleports the player.
- The cellar can later connect to `copperroot-caverns-entry` through a server-controlled tunnel portal, but that connection is deferred until the cave slice is ready.
- The client uses the `wood-interior` or `stone-interior` lighting profile with warm local lantern falloff and no expensive volumetric fog.

### Downstairs acceptance tests

1. The ground-floor hatch transitions only when the player is in range and the hatch is available.
2. The cellar collision grid prevents movement through crates and walls.
3. The sealed tunnel rejects traversal with a safe player-facing result.
4. No exterior entities are accidentally rendered as active cellar entities after transition.
5. A reconnect at cellar depth restores the correct level and room.
6. The client remains within the configured mobile light and mesh budget.

## Portal registry

The initial portal table should be authored as content data:

| Portal ID | From level | From tile | To level | To tile | Kind | State |
|---|---|---:|---|---:|---|---|
| `lodge-entry-main` | `sable-fen-exterior` | `(11, 8)` | `fenhold-lodge-ground` | `(2, 8)` | doorway | open |
| `lodge-stair-up` | `fenhold-lodge-ground` | `(12, 5)` | `fenhold-lodge-upper` | `(6, 3)` | stairs | open |
| `lodge-stair-down` | `fenhold-lodge-ground` | `(12, 7)` | `fenhold-lodge-cellar` | `(3, 7)` | hatch/stairs | open |
| `lodge-stair-return` | `fenhold-lodge-upper` | `(6, 3)` | `fenhold-lodge-ground` | `(12, 5)` | stairs | open |
| `cellar-hatch-return` | `fenhold-lodge-cellar` | `(3, 7)` | `fenhold-lodge-ground` | `(12, 7)` | hatch/stairs | open |
| `cellar-tunnel-seal` | `fenhold-lodge-cellar` | `(12, 6)` | `copperroot-caverns-entry` | `(2, 4)` | tunnel | locked |

The content validator must require a matching return portal for every bidirectional portal. The return route may use a different tile but must preserve a stable transition identity and destination spawn radius.

## Collision and navigation

Each level owns its own collision grid. A route request may include a destination tile on the current level, but a level transition requires a portal intent. The server never accepts a destination tile that crosses a level boundary implicitly.

A route executor follows this sequence:

1. Validate the player’s current level and tile.
2. Validate the destination on the current level.
3. Stop the route at the portal origin.
4. Resolve `portal.traverse.intent` on the server.
5. Commit the new level, tile, room, graph revision, and transition revision.
6. Emit `world.transition.resolved` and a fresh snapshot.
7. Resume movement only after the new snapshot is acknowledged by the client.

A door or hatch state change increments the graph revision for the affected level and any connected portal edge. Stale client routes reject or replan; they never move the player through an outdated obstruction.

## Rendering and roof policy

The client keeps the following render layers separate:

```text
LevelScene
├── floor collision/render shell
├── walls and structural shell
├── room contents
├── portals and doors
├── roof/upper shell
├── occluders
├── lighting profile
└── HUD/transition feedback
```

When the player is upstairs:

- Keep the upper-floor floor, walls, portals, and room contents.
- Fade the roof and only the occluders blocking the active room.
- Keep exterior silhouettes and windows as low-opacity structural context.
- Do not hide the ground floor from the server or delete its entity state.

When the player is downstairs:

- Dispose or unload only the exterior visual meshes outside the preview ring.
- Keep the cellar shell, portals, and local interaction anchors.
- Use a bounded local camera and low-cost lighting.
- Preserve stable entity IDs across unload/reload.

## Demo expansion

Extend the deterministic demo seed to:

```text
?demo&seed=copper-lantern-layers-01
```

The 28-second demonstration should show:

1. Exterior arrival at Fenhold Lodge.
2. Entry into the ground-floor hall.
3. Stair traversal to the upstairs archive.
4. Return to ground floor.
5. Hatch traversal into the cellar.
6. Safe rejection at the sealed tunnel.
7. Return to ground floor.
8. Final HUD state showing the active level and transition count.

The demo must use the same semantic portal command path as normal play. It may use a clearly labeled fixture adapter but must not mutate location or inventory directly from the renderer.

## Implementation sequence

### Layer milestone 1 — two-level building proof

Implement exterior plus ground floor and upstairs only. Add level-aware content validation, one staircase, roof policy, snapshot fields, and reconnect tests.

### Layer milestone 2 — downstairs cellar

Add the cellar level, hatch portal, lower-ceiling lighting profile, crate collision, sealed tunnel rejection, and mobile rendering budget tests.

### Layer milestone 3 — cave connection

Connect the cellar tunnel to the original Copperroot Caverns entrance. Add a second world-space/level identity, cave lighting profile, branching navigation, and preview residency.

### Layer milestone 4 — dynamic state

Add one server-controlled door or hatch state, graph revision changes, idempotent portal commands, and stale-route rejection.

## Source boundary

The supplied `mapman64.zip` is recorded as a Drive reference with ID `1D7w4rImwXFef3ZMVV2CKRmesTSEd2z34`. It is **not** extracted, executed, compiled, converted, or used to derive these layouts. The upstairs/downstairs design above is original project architecture and must be implemented from new authored data and original/licensed assets only.

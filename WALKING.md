# Walking and navigation (0.2.0)

## Concrete behavior

- `terrainSampler(world)` samples the actual two-triangle terrain cells used by `terrainMesh`, with a bounded 4096-cell cache. This avoids the smooth-source/flat-mesh mismatch between cell vertices. It matches mathematical triangles; final renderer Float32 rounding may differ slightly.
- `NavigationWorld` checks bounds, nine footprint samples, slope, step discontinuities, water depth, body height and registered obstacles.
- `traverse` samples terrain every 0.25 units by default, plus an analytic segment sweep against expanded obstacle boxes. Thin walls cannot hide between samples.
- `findPath` performs bounded eight-neighbor A* with deterministic tie-breaking. Every edge uses the same traversal rules as movement. Results distinguish blocked endpoints, unreachable destinations and exhausted search budgets.
- `ServerWalker` accepts direction/sequence messages. Only host ticks advance position. Diagonal speed is normalized, repeated or older sequences are ignored, and input stops after ten ticks without an update (0.5 seconds at 20 Hz).
- `propPrimitives` creates shared low-poly dimensions for trees, rocks, flowers, reeds, cacti, palms, crystals and ruins. `NavigationChunks` owns their static colliders and cleans them up on unload.

## Quick start

```ts
import { generateChunk } from './dist/world.js';
import { NavigationWorld, terrainSampler } from './dist/navigation.js';
import { NavigationChunks } from './dist/navigation-chunks.js';
import { ServerWalker, encodeMoveIntent } from './dist/movement.js';

const world = { seed: 20260928, generatorVersion: 1 } as const;
const nav = new NavigationWorld(terrainSampler(world), {
  bounds: { minX: -32, maxX: 64, minZ: -32, maxZ: 64 },
  radius: 0.35,
  height: 1.8,
  cellSize: 2,
});
const colliders = new NavigationChunks(nav);
// Structures and large props can extend from adjacent owner chunks.
for (let cx = -2; cx <= 2; cx++) {
  for (let cz = -2; cz <= 2; cz++) {
    colliders.mount(generateChunk(world, cx, cz));
  }
}

const player = new ServerWalker(nav, { x: 0, z: 0 });
// Called when the authenticated session supplies a direction packet:
player.receiveInput(encodeMoveIntent({ sequence: 1, dx: 1, dz: 0 }));
// Called by your server's fixed-rate simulation loop, NOT by the socket callback:
const snapshot = player.advance();
// Render/interpolate this authoritative snapshot on the client.
const route = nav.findPath(snapshot.position, { x: 8, z: 0 });
```

Run `npm run demo:walk` or `node dist/navigation-example.js` for the standalone example. The example includes structure colliders; the quick start above includes both structures and props.

## Connecting to a real multiplayer app

Associate one walker with each authenticated player session. Never take player identity, speed, time delta or position from the movement packet. Reject invalid packets at the socket boundary and bound frames before parsing. Apply per-session rate limits; duplicate rejection alone is not a traffic limiter. The server scheduler must run at the configured tick frequency and enforce a catch-up budget. Calling advance for each packet would defeat the fixed-rate model.

The client sends `{sequence, dx, dz}` with axes in [-1,1]. Send fresh sequences while holding controls, plus `{dx:0,dz:0}` on release or focus loss. Keep the sequence increasing for the walker lifetime. Reconnection/session-reset behavior belongs to the host. Input receipt acknowledges only the newest accepted command; snapshots are not a full reconciliation protocol. Network framing, authentication, prediction/interpolation, persistence and multi-player collision are not bundled.

Keep static collision coverage wider than the simulated player area. A server must reject movement into unloaded territory rather than assuming missing colliders mean open ground. This module's explicit bounds are one way to enforce that. The caller is responsible for keeping all intersecting chunk colliders loaded inside those bounds. Unload only when no active simulation needs that chunk's obstacles. Static IDs are namespaced separately from dynamic host colliders.

For dynamic gate doors, the server can add/remove a box collider using `upsertCollider` and `removeCollider`. Gate permission checks, animation, persistence and preventing a door from closing on an occupant are still host responsibilities. The included stronghold already has an open arch; the walker can pass beneath its overhead lintel.

## Geometric limits

This is a bounded heightfield walker, not an all-purpose physics engine or a completed navmesh.

- Maximum 65,536 navigation cells per area. Default A* budget is 4096 visited cells. Query within a region and connect regions using a future portal graph; do not run one continent-wide search.
- Terrain and shoreline checks are sampled. Obstacles have continuous horizontal box sweeps. Features narrower than the terrain sampling interval can require a smaller interval or a physics engine.
- Footprint collision is conservative: square-expanded obstacle boxes and eight perimeter probes around a circular radius. Exact touching counts as blocked; keep spawn points slightly clear of walls.
- Cones and spheres use conservative AABBs. Solid rocks are blocked, not climbable. Decorations marked `none` do not collide.
- Swept vertical overlap uses the whole path's sampled height range. This intentionally errs toward blocking near complicated overhangs.
- A* snaps endpoints to grid-cell centers when a direct route is blocked. Very narrow passages can therefore report blocked/unreachable even when an exact continuous route exists; reduce cell size or use a proper navmesh.
- Version 0.3 adds axis-aligned bridge decks and ramps through `ConstructionWorld.sample`. The original random bridge remains decorative. Stacked floors, stairs and cave ceilings still require a richer movement model; walking beneath a bridge is not supported by this heightfield system.
- Existing landmarks are still not terrain-fitted. A wall floating above a hill or buried in it must be fixed by pad/foundation generation before production use.
- Generated prop blockouts currently ignore yaw because their shared collider shapes are axis-aligned. Do not rotate only the rendered boxes without updating collision.
- All operations are synchronous. Profile real map density/player counts before scaling; move pathfinding off the main loop or add spatial indexing as needed.

## Next map expansion

Version 0.3 now implements bridge decks, approach ramps, fitted pads and verified crossing spawn/arrival points. Next candidates are connected road networks, gates that safely close around occupants, and links between navigation regions. Your existing map, movement controller and server remain untouched until their actual source is supplied.

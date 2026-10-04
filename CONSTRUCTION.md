# Construction and crossings — version 0.3

## What is actually implemented

Three buildable crossing recipes, each with two terrain-fitted landing pads, two sloping approaches, a supported deck, side barriers, foundation masonry, architectural details and a nearby inscription. Candidate crossings are scanned from actual generated water and rejected when dry banks or traversable approaches cannot be established. This is deterministic site planning, not runtime world-scale hydrology.

Both the walker and the renderer use the same surface equations. Terrain editing uses a global one-unit triangle lattice. Pads have a flat rectangular core with a smooth blend toward original ground. Decks and ramps use linear height functions with continuous joining heights. Overlapping support interiors and mismatched seams are rejected. The old terrain generator remains unchanged: construction is a separate overlay with `CONSTRUCTION_VERSION = 1`.

## Start here

```ts
import { terrainSampler } from './dist/navigation.js';
import { planCrossing, mountCrossing } from './dist/crossings.js';
import { surfaceMesh, railMeshes } from './dist/construction.js';
import { primitiveMesh } from './dist/scene-meshes.js';

const config = { seed: 20260928, generatorVersion: 1 } as const;
const base = terrainSampler(config);
const plan = planCrossing(base, {
  id: 'willowglass-01', style: 'willowglass',
  z: 0, minX: -16, maxX: 176,
});
const { construction, navigation } = mountCrossing(base, plan);
const ground = construction.terrainMesh(plan.bounds, '#63865C');
const structures = [
  ...plan.surfaces.flatMap(s => [surfaceMesh(s), ...railMeshes(s)]),
  ...plan.primitives.map(primitiveMesh),
];
const route = navigation.findPath(plan.start, plan.goal);
```

Convert the returned positions/indices to your renderer's mesh API. Compute normals and choose materials there. Render edited ground IN PLACE OF the original ground covering those bounds; rendering both creates overlapping faces. Larger worlds should produce aligned terrain patches per chunk. The construction lattice is one unit, finer than the original four-unit terrain, so use compatible boundary vertices/skirts when mixing resolutions.

`node dist/crossing-example.js` walks a server-controlled test character from the first landing to the second at 20 Hz and throws if it encounters a blockage. This is a real local simulation check, not a networked deployment.

## Planning contract

`planCrossing` accepts an integer Z coordinate and an X search interval of at most 192 units. Width is an even integer from 6 to 12 units. The default is eight. Clearance above the sampled river corridor defaults to 1.25 units. It tests approaches of 16, 24, 32, 40 and 48 units, accepting the first viable candidate.

- Water is sampled across the full crossing width.
- The selected river must form one contiguous wet span within the scan.
- Banks and landing footprints must be dry.
- Landing elevations use the highest sampled ground under each footprint plus 0.15 units.
- Ramp grades must be at most 24 degrees. The navigation profile permits 30 degrees, giving a margin for approaches.
- Buried ramp/deck samples reject a candidate.
- The entire centerline must pass the same footprint, water, slope, step and rail checks used by movement.
- Failures throw a specific explanation. Do not silently spawn an unverified bridge when planning fails.

Only the recorded centerline and sampled surfaces are verified. This is not a guarantee that every surrounding hill, decorative edge or arbitrary player build is reachable. The planner does not handle crossing a bend diagonally, branching rivers or multiple spans. Generic support geometry can run along X or Z, but the automatic river planner currently scans X only.

## Existing procedural geometry

Apply `reserveSites(chunk, [plan])` before passing chunks to `NavigationChunks` or rendering their props. It filters nearby props and conflicting random landmarks while keeping the original chunk and generator intact. It reserves earthwork extents and four units around support footprints. This is conservative clearance, not general object-packing or prop overlap resolution.

If chunks are already mounted, unmount their OLD colliders first, then mount the filtered descriptors. `NavigationChunks.mount` intentionally ignores already-mounted IDs. Rebase retained prop Y values with `construction.terrainAt(x, z).height` when drawing them near edited ground. `crossingScene` demonstrates this for its reference render. Navigation chunks outside the reservation generally retain their original heights; an engine with larger edit falloffs should rebuild all affected colliders.

Keep nearby owner chunks loaded; objects can cross chunk boundaries. `mountCrossing` adds site details and rails, but it does not automatically import all original world obstacles. The tests separately mount reserved neighboring procedural chunks and confirm the crossing remains traversable.

## Authority and state

Plans are trusted build artifacts made on the server or during world compilation. They are NOT accepted as arbitrary client messages. The old 1024-byte world recipe codec has not been expanded to carry construction plans. Negotiate construction version, world seed, plan IDs and an exact plan-content hash in your host manifest before using local reconstruction. Persist the selected plan so later code/catalog changes do not silently alter live terrain. Do not overload the old generatorVersion to imply construction compatibility.

A server should own plan installation/removal and broadcast the matching scene revision. `ConstructionWorld.revision` tracks surface/pad changes; `NavigationWorld.revision` tracks collider changes. Cached routes must be invalidated when either changes. Apply physical surfaces and associated rail colliders together, and check player occupancy before removing or changing a structure. The helper does not provide a database transaction, authority checks or player relocation.

## Representation limits

The walker remains a single-height 2.5D model. It selects a support above terrain at each X/Z coordinate; there is no separate under-bridge route, stacked interior floor, jumping or falling. Do not use it for a multi-level dungeon without adding a layer/volume-aware movement system.

Rail rendering follows ramp slope; conservative collision boxes cover each rail's full height range. Piers are decorative from the upper-walkway perspective. Foundation stones finish just below the ground floor to avoid coplanar mesh overlap. Spheres are represented by low-poly octahedra in `primitiveMesh`; their collision bounds remain conservative boxes.

Water uses the existing cell-plane convention. Shoreline clipping and water flow are still renderer work. Foundation pads can blend steeply into extreme surrounding terrain; only the tested route is guaranteed. Artificially submerged supports retain water depth and are rejected by normal walking. Multiple pads with overlapping blend extents are rejected rather than relying on insertion order.

Sampling is finite. The tests verify the supported generator and defined construction shapes, not arbitrary sub-sample terrain. Site bounds, mesh extents and search loops are limited, but collision queries still scan registered obstacles. Profile dense areas and add spatial indexing before scaling to many simultaneous players.

## Reproduce the atlas

```sh
node tools/export-atlas.mjs /tmp/atlas-scenes.json
python tools/render_atlas.py /tmp/atlas-scenes.json art/wayfarer-construction-atlas.png
```

The optional atlas renderer needs Python and Pillow. The TypeScript game module has no runtime package dependency. The atlas uses flat orthographic projection of `crossingScene` buffers, not AI-generated concept art. Its bright line is an annotated verified centerline, not a physical glowing object. The three scenes are style studies on one test world's river; choosing an architecture palette does not change its underlying biome or spawn table.

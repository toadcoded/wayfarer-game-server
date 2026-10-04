# Non-attackable wildlife — rc.15

Fourteen visual entries: bunny (a smaller rabbit variant), rabbit, squirrel, fox, songbird, pigeon, otter, ferret, groundhog, mole, shrew, mouse, hedgehog and duck. The procedural retro-styled rigs vary in size, ears, muzzle, tail, body length, coloration and bird wings/beaks.

## Placement across the map

`wildlifeForChunk(config,cx,cz)` produces seeded stable IDs, biome-specific choices and checked dry sites for any valid procedural chunk, including negative coordinates. All ten biome types have authored habitat pools. Each chunk gets at most six placements by default, with bounded retries and a hard budget of twelve. Wet/steep sites are skipped. Otter and duck chunk sites also require nearby water. These are proposed visual populations separate from the unchanged generator-v1 chunk protocol.

The atlas now displays each region's habitat list, generated sample-chunk species and white wildlife markers. This makes the map-wide placement surface concrete; it does not make all regions traversable multiplayer destinations. The playable causeway renders one curated ground-checked wildlife pocket at the two landings: all fourteen visual entries are present in the checked build.

## Non-attackable behavior

Every descriptor explicitly has attackable=false, collidable=false and drops=false. Wildlife meshes are non-pickable and do not check collisions. They are not players, fighters, gathering nodes or members of RealmRuntime combat state; they have no health, drops or XP awards. Existing attack actions still belong to the server's Warden encounter. Walking through small critters is intentional for this decorative layer.

## Animation and lifecycle

Animals roam gently within approximately one metre of their seeded origin, with pauses, head motion, alternating paws, rabbit hops and bird wing movement. Curves are absolute-time and activity transitions taper smoothly. Each update samples the terrain; water or steep samples hold the last safe position. Reduced motion gives a neutral static pose. Rigs are bounded to 48 active animals per layer and can be synchronized in/out using stable IDs, with all nodes and shared materials disposed on closure.

This is cosmetic local presentation. Clients share seeded population descriptors, but animation clocks are not synchronized by the server. Birds do not yet fly between trees, squirrels do not climb, moles do not burrow and otters do not swim. Those species-specific behaviors and obstacle-aware navigation remain later refinements. Cosmetic wildlife positions are not account saves and are not written to PGlite.

## Verification

Tests cover all biome pools, deterministic chunk placement, budgets, dry sites, immutable catalog data, actual causeway populations, bounded motion and reduced motion, all fourteen non-pickable rigs, steady mesh counts, invalid descriptor rejection, streaming removal, full disposal and retaining the last dry position. The atlas UI test checks the non-attackable habitat display for every named region.

Babylon tests use NullEngine. Physical-device appearance and frame time remain open; no new GPU verification is claimed. The authoritative contract stays revision 10 and gameplay saves stay schema 3.

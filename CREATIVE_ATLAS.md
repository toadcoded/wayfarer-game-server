# The Crossing Folio

Three places where a journey can pause long enough to become memorable. Each has a working passage first, then a recognizable material language and an inspectable trace of the people who might live there.

## 01 · Willowglass Causeway

**Place:** a green valley crossing, tended rather than conquered.

Willow-seed lantern forms sit on slender posts. Low stone planting beds make the approach feel inhabited without filling the walking lane. The deck is muted wood; foundation blocks borrow the cool color of wet river stones. A pale green accent runs through the lantern forms.

**Inspectable inscription:** “Travelers leave an unlit lantern here for a journey they have not yet dared to begin.”

**Implemented:** two fitted earthwork landings, wood-colored deck and ramps, solid side barriers, lantern-post geometry, faceted lantern forms, planting-bed forms, foundation stones and proximity-gated text.

**Art direction, not implemented simulation:** moving leaves, rain-darkening materials, reflected lantern light and a hollow wooden chime. The lantern color does not yet create a dynamic light source.

**Future gameplay hook:** a traveler asks the player to carry an unlit lantern to a distant hilltop. This is a story seed, not an implemented quest or reward.

## 02 · Saffron Meridian

**Place:** a desert or oasis crossing organized around shadow and orientation.

Warm masonry rises into paired obelisks. Small turquoise bands break the vertical surfaces; sun-disc forms give each approach a marker visible from a distance. The bridge offers a long, readable line through the scene, while the landings suggest courts where caravans could gather.

**Inspectable inscription:** “At noon the paired obelisks cast a narrow road of shade. The keepers call it the second bridge.”

**Implemented:** sandstone-colored deck, graded ramps, obelisk blockouts, faceted tips/discs, contrasting band inlays, foundation masonry and inspection text.

**Art direction, not implemented simulation:** solar alignment, functioning shadow calendar, drifting sand and ceramic wind chimes. Geometric bands are invented ornament; no real historical writing system is claimed.

**Future gameplay hook:** align a portable sighting instrument with the court's marks to discover a buried aqueduct. The timing puzzle and aqueduct are not included yet.

## 03 · Mothlight Boardwalk

**Place:** a marsh crossing whose repairs remember earlier floods.

Grey-green timber, squat resting benches and mushroom-cap lantern silhouettes make the passage feel weathered and low to the water. Small marks climb the approach posts. Mossy stone holds the banks without turning the marsh into a fortress.

**Inspectable inscription:** “Each flood-mark bears a tiny brass moth. The lowest marks remember houses the marsh has borrowed.”

**Implemented:** timber-colored surfaces, graded approaches, cap-shaped ornaments, marked posts, bench blockouts, footings and nearby inspection text.

**Art direction, not implemented simulation:** fireflies, swaying reeds, flood cycles, phosphorescent materials and soft wooden knocks. The marks are geometry; they do not track a dynamic water level.

**Future gameplay hook:** collect flood observations from several crossing posts to locate a safe seasonal route. No collection state or server event schedule is implemented in this version.

## Design constraints shared by all three

The walking lane remains legible. Decorative structures stay beside it. Open approaches do not depend on invisible teleport transitions. Mesh surfaces and movement share the same height definitions. A detail that reads as solid uses a declared collision rule; ornament high above the walking lane can remain non-solid. Existing procedural decoration is reserved away from the construction footprint.

The next place should add a different kind of traversal, rather than merely more decoration: a hillside switchback, a gated market courtyard, a ruined aqueduct with a lower towpath, or a coastal stair cut into stone. Multi-level routes will require a richer navigation model before they can be claimed playable.

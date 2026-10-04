# Atlas of Ten Reaches

This release adds an explorable planning atlas to the existing procedural world. It does not extend the navigable multiplayer scene.

## Use

Run `npm run preview` and open http://127.0.0.1:8080/preview/atlas.html. Select a numbered map marker, a named button, or the region dropdown. The detail panel shows setting text, proposed places, one generated 64-metre chunk near the region center, resource catalog entries, and a planned itinerary from Reedhaven. The shared realm host also serves this page at /preview/atlas.html.

## Map semantics

The 17 × 17 grid spans region indices −8 through 8. Each cell represents 512 × 512 metres; north is negative Z. Colors use actual generator-v1 biome palettes for seed 20260928. World coordinates use X/Z horizontally and Y for height.

For each of the ten biome identities, the atlas selects the nearest matching region center by squared grid distance, breaking ties by Z then X. This is deterministic and does not override the terrain generator. Other occurrences of the same biome remain visible as unlabelled cells. An anchor is a catalog location, not a tested safe spawn.

The terrain thumbnail samples the chunk at floor(center / 64), displaying generated water cells, height shading and prop dots. It does not show the entire 512-metre region. Counts and height ranges come from that same chunk. Resource lists describe biome metadata; harvesting is not implemented.

## Authored geography

| Realm | Biome | Proposed focus |
|---|---|---|
| Reedhaven Vale | River valley | Orchards, willow roads, river keep |
| Barrow Meadow | Grassland | Bronze bells and burial ridges |
| Moonroot Elderwood | Forest | Living library and root courtyards |
| Ashfen Mire | Mire | Ferry posts and peat pools |
| Saffron Dominion | Desert | Sandstone courts and shadow calendars |
| Glass Oasis | Oasis coast | Palm canals and salt coves |
| Cloudbreak Heights | Alpine | Monastery terraces and cliff gardens |
| Aurora Expanse | Tundra | Stone rings and winter harbor |
| Emberfall Caldera | Volcanic | Geothermal gardens and obsidian walls |
| Luminous Underdeep | Cavern | Crystal archives and fungal courtyards |

Names are setting proposals. Named settlements, quest objects, hazards, boats, harvesting, fast travel and streaming between regions are not implemented. The cavern biome is currently a heightfield theme, not an underground layer.

## Routes and extension boundary

Twelve undirected authored links connect all ten settings. The highlighted itinerary minimizes link count, not physical distance, slope, danger or walking cost. All links remain `planned`; dashed lines may cross impassable terrain. Use the existing navigation module for actual local movement queries. A future regional route needs surveyed terrain, collision/water checks, safe arrival points and explicit transitions before being promoted to playable travel.

The existing Willowglass realm and three offline crossing styles remain the concrete walking demonstrations. Their geometry is not relocated to these story anchors.

## Reuse and verification

The `./world-atlas` export provides buildAtlas, inspectAnchor, planItinerary, REGION_STORIES and ATLAS_LINKS. `npm run build && npm run atlas:catalog` regenerates WORLD-ATLAS.json. The bounded anchor search throws if a supplied seed lacks one of the biomes in its search window; it never invents a matching region.

Tests cover actual biome placement across five seeds, all 100 itinerary endpoint pairs, generated sample evidence, immutable setting content and selection/resizing with a stub DOM/canvas. These checks do not establish real-browser layout or rendering quality.

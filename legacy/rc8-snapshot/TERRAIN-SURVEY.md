# Local terrain survey

The world atlas now screens each displayed 64 × 64 metre chunk before proposing a terrain arrival candidate. This is a step toward regional exploration, not a change to playable movement.

## Rules

Each chunk has 16 × 16 four-metre cells. A cell is water if its generated center water depth is positive. Otherwise it is steep if its highest minus lowest corner height, divided by four metres, exceeds 0.5. Remaining cells are open. This corner-range measure is conservative for grade; it is not an exact slope calculation for a mesh triangle.

Open cells are grouped with four-neighbor connectivity. Diagonal contact does not connect two patches. The largest component is selected, with ties resolved by the first row-major cell. Within it, candidate centers must have all nine cells in their 3 × 3 neighborhood open and be away from the chunk boundary. The closest eligible cell to chunk center wins, with row-major ties. If none qualifies, the candidate is null. The reported height is the mean of the cell's four vertex heights.

The UI draws steep cells in coral and a gold ring around the candidate. Counts and coordinates remain available in text. WORLD-ATLAS.json schema 2 records cell classes, component counts, largest-component size and the candidate for every realm sample. Rebuild and run npm run atlas:catalog to regenerate it.

## What this does not establish

Open means the sampled terrain passes these rules. It does not imply safe walking or spawning. Props, landmarks, construction, avatar size, collision, mesh interpolation details and hazards are not checked. Water is sampled at cell centers and can miss narrow wet areas. Connectivity describes cell adjacency only; no continuous segment traversal is certified. The survey covers one chunk per realm, not a full region or an inter-region link.

Candidates are not mounted into the runtime and do not change the existing spawn. Before activating regional travel, run the candidate and approach route through the actual navigation/collision model, including clearance and water sampling, and define bounded scene transitions. No route status changes from planned in this release.

## API and evidence

The ./terrain-survey export supplies surveyChunk(chunk, maxGrade = 0.5). It validates grid lengths, finite heights, nonnegative finite water depths and an allowed grade threshold from zero through one. It returns fresh data without modifying the source chunk. Work is bounded by the fixed 256-cell grid.

Six regressions cover flat/negative-coordinate placement, water-separated components, exact grade boundaries, isolated dry cells, malformed inputs and every atlas sample. Existing atlas controls are exercised using the stub DOM/canvas with the new survey panel present. Real-browser layout and visual rendering remain unverified.

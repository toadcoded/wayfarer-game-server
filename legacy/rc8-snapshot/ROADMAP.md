# Path to v0.8 and v0.9

## Current concrete candidate: v0.8 rc.5

The 20 Hz authoritative realm now includes the Reedhaven/Quiet Tithe loop, private pack/equipment, deterministic replay v2, and an **optional local durable player-profile adapter**. The adapter restores server-owned position, appearance, quest and inventory/equipment through a signed local cookie; it is not production authentication and does not make shared world state durable.

The immediate next work should avoid adding broad gameplay until this identity/persistence boundary is qualified with a clean dependency install and fresh browser run. After that: production account ownership/session revocation, transactional durable storage, and a hosted WSS staging adapter should precede major economy/trading expansion.

## Historical roadmap context
Version policy requested by the user: the current preparation series is v0.7.x. v0.8 is the next main-game integration milestone. The following milestone is v0.9. Do not publish v0.8.1 or v0.8.2.

## Current concrete baseline: v0.7.9

A shared authoritative local crossing, offline crossing variations, world atlas, terrain surveys and character presentation coexist in one package with linked pages. Input works through the game runtime. The atlas and reference asset studio are still separate views, and most named regional content remains planned.

The v0.7.8 mesh lab adds real Babylon rendering and an anchored cloth experiment. It remains separate from the authoritative walking loop. Cosmetic fetches are now bounded and validated; Python/mypy checks are part of the development toolchain.

v0.7.9 adds a local action registry shared by the cloth toolbar and offline controls. This is presentation/tool dispatch; it is not yet an authoritative network interaction registry. Point forces do not affect server gameplay.

The experimental 0.7.9-abc.1 variant adds per-point ABC forces around a fixed cloth rig. Character-follow fields and any authoritative character lifting are still unimplemented.

## Work before calling v0.8 integrated

1. Validate terrain arrival candidates using actual navigation, actor clearance, props and water checks. Preserve explicit failure results when no location qualifies.
2. Mount a bounded regional scene and define entry/exit ownership so exploring from the atlas becomes an actual game action with tested transitions.
3. Add a small coherent interaction loop using mounted world objects, action range checks and authoritative outcomes. Merely placing the lantern/boar/stump art does not implement gameplay.
4. Consolidate the views and controls into the main-game flow. Establish how character identity and cosmetics are shared; preserve movement/clock authority.
5. Complete actual desktop and mobile browser checks: asset loading, reduced motion, pause/resume, world transitions, two-client movement and disconnect/rejoin. Test the packaged archive from a clean extraction.
6. Publish v0.8 only with an accurate feature inventory, limitations, verification output and one integrated startup path. Hosting, persistence and full soft-body physics require their own implemented/tested scope if included.

v0.9 follows v0.8. This roadmap does not assert that unfinished systems are already integrated or guarantee all proposed features within a fixed release.

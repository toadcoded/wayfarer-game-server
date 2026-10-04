# rc.10 rendering contract

Direction: faceted fantasy, readable human proportions, sapphire/ivory/gold Seraphine, individual movement identities, cloth motion and cool moonlight against warm lanterns. Real meshes, not screenshot backgrounds.

## Implemented

- Six procedural articulated humanoids: face/eyes/nose/mouth/ears, limbs, pauldrons, gloves and boots. Distinct breathing, stride, cadence and cape weight. Transform-node rigs, not imported production skeletal assets.
- Seraphine: crown wings/diadem, long hair locks, brows, ivory skirt panels, blue/gold tabard, collar and armor gems. Gold-bordered crescent-moon cape: 63 vertices, 96 triangles.
- Cape top row is pinned; lower rows deform with bounded cosmetic wind/movement. Pause stabilizes secondary motion. ABC controls reduce to clamped scalar C+B-A: not full directional aura/cloth collision physics.
- Halden and Warden rigs use validated positions; Warden presence and pulse ring follow encounter state. Player roots use existing interpolation, never cosmetic collision changes. Existing legal equipment gets a simple procedural held mesh; cosmetics grant no weapon/stats.
- Follow/orbit/zoom camera, 30 Hz render cap, hidden-document skip and cleanup of missing/replaced rigs/materials.
- Same causeway world recipe, bridge, terrain and props as existing collision geometry, with moonlight/fog and warm landing lamps. Existing quest, encounter, inventory and exclusive training remain authoritative.
- Navy/gold existing controls, not a fake reference HUD. Existing PNG artwork remains fallback/offline 2D.

## Not finished

References are a target, not current screenshots. Castle/cavern/academy regions, complex waterfalls, fishing/mining/agility loops, reference HUD/icon art, banks, equippable capes/quivers/sacks, imported production skeletal/facial assets, attack animation clips, cape collision, water shaders, shadows and LOD/performance tuning are not delivered. No automatic crystal sword or unique Seraphine powers.

Headless mesh/full-scene tests pass. GPU appearance is still a release gate: cloud Chromium reports WebGL unsupported. Supplied-art rights require review before public distribution.

`npm run dev -- --port 4173` starts a disposable development bridge, not production hosting or persistent accounts. Normal `npm start` retains existing loopback Host/Origin restrictions. Signed local profiles are development identity, not production authentication. Next public milestone after final v0.8 remains v0.9.

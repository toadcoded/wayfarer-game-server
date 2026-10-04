# Living realm / retro detail pass — rc.14

The causeway now has a first decorative life layer. This is original faceted, retro-inspired storybook art, not Nintendo assets or console emulation. Maximum/High/Balanced Babylon presets remain available. The retro checkbox changes fog tone and suppresses bloom; higher-density anti-aliasing remains available. It does not introduce authentic console texture filtering or dithering.

## Micro-details

Eleven seeded descriptors at each of the two landings create 22 prop roots: birdhouse with perched bird, spotted mushrooms, flowers, bench, non-graphic skeleton remains, barrel, tapped keg, corked bottle, firework crate, balloon tied to a fence rail and clockwork beetle. Ground heights come from the current construction terrain. Placement is off the walking lane; these props are decorative and do not add collision, gathering nodes, loot or equipment.

Stationary detail meshes are batched by material to reduce draw calls. Balloons, clockwork toys, fireflies and particles retain bounded animated nodes. Shared detail materials and all NPC nodes dispose with the scene. No event spawns unbounded meshes or timers.

## Animation and incidental events

A small NPC beside the clockwork beetle and a woodcutter with axe/stump use the existing procedural hero rig. New gestures include wave, chop, sneeze and play. Every roster appearance gains short, phased eye blinks. Cape position and normal buffers are reused rather than allocated anew every frame.

A seeded cosmetic schedule rotates through conversation, toy activation, sneeze, distant lightning and fireworks. Lines appear in the ambient HUD. These are authored incidental lines, not social chat or an AI dialogue system. The toy moves locally, balloons sway, fireflies glow and drift in this permanently moonlit scene, distant clouds hold a brief lightning silhouette and a small radial firework display appears occasionally.

Events use the local presentation clock. Two players can see different event timing; no claim of server-synchronized weather or NPC activity is made. Gameplay time, movement, inventory, XP, damage and persistence remain server-owned and unchanged. This pass dresses the playable causeway; it does not populate all ten atlas biomes.

Pause effects and reduced-motion preferences suppress ambient events, gestures and glows; a separate checkbox disables lightning/firework effects. No fullscreen lightning flash is used. Cosmetic controls are session-local; PGlite still stores only the quality preset.

## QoL and heartbeat

The visible heartbeat derives from actual snapshot arrival age: awaiting first snapshot, live below 500 ms, waiting at 500 ms and updates lost at 5 seconds. A hidden page reports resting. Existing stale movement stop and disconnect behavior remains intact. The heartbeat does not manufacture packets or ticks to look healthy.

Check host health performs a no-store request to the existing /health endpoint with a 3-second abort deadline. It reports readiness, simulation tick and running/resting status separately from snapshot freshness. This loopback rehearsal endpoint does not certify production deployment.

## Verification limits

Seeded layout/schedule, finite motion, constant mesh counts over long updates, full disposal, blinks/gesture pause behavior and heartbeat thresholds are tested. The actual browser-client module is also exercised over a real local socket with a stub DOM. Babylon geometry tests use NullEngine; physical-device visuals, bloom/palette taste, firework appearance and sustained GPU frame time remain open. No finished-world or 10/10 quality claim is made.

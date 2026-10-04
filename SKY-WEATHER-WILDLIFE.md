# Coordinated sky and animal presentation

| Layer | Current bound and behaviour |
| --- | --- |
| Sky dome | One low-resolution faceted sphere, vertex gradient, infinite-distance presentation |
| Clouds | 24 initial low-poly puffs merged into one mesh; cloud coverage changes tint/visibility |
| Moon/stars | One moon mesh and one 70-triangle star mesh; both dim with cloud cover |
| Rain | One reusable 64-line system; 24, 48 or 64 nonzero streaks by quality; CPU update at most10Hz |
| Climate | Seed plus server tick clock; clear/cloudy/rain/mist categories with smooth normalized values |
| Dampness | Exponentially weighted recent rain samples; gradual cosmetic drying |
| Fog | Bounded exponential density coupled to humidity and wetness |
| Chunk nodes | At most16 cached moisture records, refreshed at each one-second clock bucket |
| Wildlife | All14 existing species receive facial/silhouette details, blinking and tail motion |
| Role NPCs | Halden and Warden receive four cosmetic accessories each |

The client supplies the validated server game tick times50ms while joined. Before joining, the preview uses its local render clock. Seeded weather is replay-friendly but is not durable server weather state: restarting the host resets its weather clock. The model uses smooth periodic proxies for cloud water and rainfall; the wetness filter samples recent periodic history rather than tracking world water volume or crop hydration.

The renderer and pure climate module are separate TypeScript components. WeatherChunkCache adds bounded local humidity/wetness variation while retaining the shared rain value, so it does not create contradictory precipitation for nearby material chunks. It refreshes as the time bucket changes and returns detached values. It is a cosmetic cache rather than terrain streaming or a new authoritative chunk protocol.

Surface moisture currently darkens existing world material colours by up to16% and adds modest specular response. It leaves vertex colours, terrain coordinates and collision unchanged. There are no puddle colliders, slippery terrain, crop bonuses, flooded paths, water inventory or profile-save fields. Any future gameplay weather effects should be designed in the authoritative runtime and replay/save contract first.

Rain reuses vectors and mesh buffers, clouds batch once, materials are shared, and wildlife static details batch under their existing transform joints. These bounds reduce potential allocation/draw overhead; actual CPU/GPU/FPS improvement has not been measured. Babylon’s scene-owned default material is shared; repeated sky layer creation/disposal leaves only that shared material until the scene itself is disposed. Owned sky materials and line shaders are released.

Wildlife detail is procedural retro art rather than skinned production animal assets. Root proportions/habitats and noncombat invariants remain unchanged. Pausing resets blink/tail/head motion and freezes weather; NPC accessories are cosmetic role props. GPU visual fidelity, actual device usability and occlusion/transparency quality remain open review items.

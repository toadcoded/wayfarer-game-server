# Characters and organic presentation

v0.7.7 integrates the supplied adventurer, lantern elder, traveler and villager into the two walking previews. Select Appearance in the footer. The other player in a shared realm is drawn as a blue articulated figure; your selected skin is local and is not transmitted. All supplied views remain front-facing. Full directional sprite coverage is not available, so facing is not falsely synthesized.

## Motion model

CharacterMotion consumes observed positions and a monotonic presentation clock. It never modifies world position, collision, speed, server time or input. Distance traveled drives gait phase. A filtered speed estimate controls stride. Body lean and vector-cape deflection use damped springs with substeps no longer than 1/120 second. Body and cloth deflections are bounded. Gaps over 250 ms and jumps over four metres reset motion history, avoiding a burst after a tab stall or teleport. Idle motion settles. Departed players and reconnects clear their presentation state.

Sprite characters use subtle body lean and bob plus distance-driven selection among the supplied frames. The articulated vector character additionally has swinging limbs and a spring-driven cape. The ground shadow remains anchored to the reported feet. These are secondary animation effects, not full soft-body mesh deformation or collision-aware cloth. No ragdoll, jumping, gravity, momentum-based authoritative walking, or physics-engine integration is claimed.

Operating-system reduced motion disables added bob, lean, cloth deflection and animated gait. Offline pause disables these effects too. Missing or unreadable images use the vector character. Magenta matte pixels are made transparent once at image load; original GIF files remain unchanged.

## Assets and map appearance

preview/assets contains original GIFs, losslessly packed frame PNGs, crop bounds and per-frame durations. ASSET-PROVENANCE.json ties each original to the uploaded source. The character studio shows all seven animations with their matte removed at display time and respects reduced motion. Lantern, boar and stump are references only; they are not interactive pickups, wildlife or destructible scenery.

Foliage and stones that used octahedral sphere blockouts now use rounded 12-segment meshes. All vertices remain inside the existing primitive extents. Terrain, reserved crossing sites, world seed, bridges and collision shapes remain unchanged. This reduces faceting for round objects; it does not fully smooth coastlines or every block-based structure.

## Verification boundaries

122 automated tests pass, including seven new checks for spring settling and bounds, stall/teleport behavior, reduced motion, matte keying, animation durations, rounded-mesh winding/extents and asset dimensions. The existing stub-DOM client test exercises the vector fallback against real WebSockets. HTTP checks verify asset types. A real browser has not yet verified appearance, GIF decoding, sprite loading, mobile footer layout or animation quality. Full visual verification remains a v0.8 integration gate.

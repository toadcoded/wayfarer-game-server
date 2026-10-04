# ABC wind fields

Experimental package: 0.7.9-abc.1. Earlier ZIPs remain intact. This is not the v0.8 integration release.

## Controls

Run npm run preview, open /preview/mesh.html, and choose Focus cloth. The lab starts with Rising spiral and no additional XYZ wind. Seven presets are available: Calm, A downdraft, B updraft, C vortex, Rising spiral, Descending spiral and Balanced streams. Each preset enables ABC and clears the extra XYZ vector. Radius and pulse frequency are retained when changing presets.

A — Arial: downward contribution from the upper part of the field.
B — Below: upward contribution from the lower part.
C — Central: horizontal circulation around the Y axis. Positive C turns +X toward +Z; negative reverses it. This coordinate definition avoids ambiguity when the camera rotates.

A/B range from 0 to 12. C ranges from −12 to +12. The visible radius control ranges from 1 to 12 metres. Pulse is 0–3 Hz; zero is steady. The API also permits radius 0.25–32 and height 1–64. The current UI uses a fixed local center (0, 8, 0) and height 12, translated with the lab cloth to world X = 40. The field does not follow a playable character.

Orange and blue markers show the upper/lower field limits. The violet ring marks its horizontal radius. The cyan line reports combined local wind at the selected point. The inspector shows settings and sampled acceleration numerically. Pinned points still display the field but are never moved by it. Reset disables ABC, resets pulse time, restores cloth and returns the prior XYZ default (0, 0, 2).

## Model

For local displacement (dx, dy, dz) from the field center, let r = hypot(dx, dz). Outside radius R or vertical half-height H/2, the field is zero. Inside:

- radial weight = (1 − r/R)²
- vertical weight = (1 − |dy|/(H/2))²
- upper weight = 0.5 + dy/H
- lower weight = 0.5 − dy/H
- vertical contribution = B × lower weight − A × upper weight
- swirl direction = (−dz, 0, dx) / max(0.5, r)

Both contributions are multiplied by radial and vertical weights. The softened half-metre core prevents a singularity; swirl vanishes at the exact center. A/B oppose each other exactly at the center plane when equal, but create different effects above and below it. Their cancellation does not cancel gravity.

Steady multiplier is one. Pulse multiplier is 0.5 + 0.5 × sin(2π × frequency × simulation time). A pulse begins at half strength. It uses accepted fixed-step simulation time; pausing, reduced motion and hidden-tab suspension freeze it. Discarded stall time does not advance its phase.

The existing XYZ vector is added to the ABC sample at each free cloth point. Combined wind acceleration is capped at magnitude 12; gravity −9.81 on Y is added separately. Thus gravity is neither weakened by the wind clamp nor incorrectly counted as a wind source. Apply impulse uses this same sampled wind direction at the selected point, with the prior impulse bounds and pinned-point protections.

This is an authored wind-effect model, not computational fluid dynamics. There is no pressure solve, turbulence model, aerodynamic drag, rigid-body lift, collision or character levitation. Upflow opposes downward acceleration; it does not promise hovering.

## Integration boundary

The lab provides a reusable sampleABC function and SoftPatch setABC/getABC/forceAt methods. A future character-follow integration should convert each point into the same coordinate space as its character-owned source center. Gameplay movement still needs server-authoritative checks. No wind state is replicated or persisted in this variant.

Current improvements apply to the cloth workbench: simpler semantic controls, useful presets, explicit field geometry, and an inspector that matches the actual solver input. Real-browser visual quality and mobile controls remain unverified.

## Verification

143 Node tests pass with strict TypeScript compilation and a rebuilt Babylon bundle. Seven new tests cover vertical direction/cancellation, tangential reversal/core behavior, field boundaries/falloff, pulse phases, validation/copy isolation, force caps/time/reset, and strong pulsing fields over 600 updates with pinned-point preservation. Prior movement, socket, navigation, mesh and toolbar tests remain included.

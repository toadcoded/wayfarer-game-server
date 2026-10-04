# rc.16 travel and camera integration

## Input and authority

`MoveIntent.mode` accepts only walk/jog/run. Decode rejects extra fields, invalid modes, invalid vectors and invalid sequences. Mode requests are processed only by fixed host ticks. Staged movement copies velocity, energy and exhaustion scalars so failed ticks cannot partially commit them. Legacy packets retain their previous constant jog behavior for offline tooling; capped custom walker speeds never exceed the 30m/s navigation limit. Diagonal intent is normalized.

Replica mode and energy form an optional validated pair for existing snapshot tooling. Actual rc.16 runtime snapshots always emit the pair, but the browser does not invent energy from local timers. All simulation state enters deterministic replay hashes. Run drain occurs only after actual traversable displacement; stationary/wall-blocked input cannot manufacture motion. Smooth turns and camera follow are cosmetic and do not move collision bounds.

## Camera

Orbit range beta .18–1.48rad; radius 6–75m; pan distance limit12m. Radius-relative wheel/pinch zoom, orbit inertia .72, arrow camera keyboard input removed to prevent movement conflicts. Following translates the target with exponential damping and preserves alpha/beta/radius explicitly using Babylon's clone-angle target option. Teleports >8m/new local identities reset follow. Recenter clears camera inertia and user pan; ordinary follow retains the pan offset. No additive shake or bob on camera. Reduced secondary motion uses immediate camera follow and suppresses avatar cosmetic gait.

Camera-relative controls operate in the horizontal XZ plane: screen forward is toward the target along the camera heading, right is perpendicular. The fixed 2D fallback retains its prior projection. Real camera collision/occlusion avoidance, stick analog magnitude, click-to-move/pathfinding, production mobile device gesture QA and persistent stamina are future work.

## Compatibility

Simulation11/20Hz. Position/quest/XP/inventory/profile formats remain unchanged. Session energy resets to100 on reconnect. This is intentional development stamina, not production anti-reconnect stamina. Newly captured journals must use simulation11; historical simulation10 artifacts in this ZIP are labeled historical and cannot be replayed under11 without migration and new hash capture.

## Sources

Babylon camera input docs: https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs/
Implementation also checked against pinned @babylonjs/core9.28.0 camera declarations and setTarget implementation.

# Multitool and soft-body vectors

v0.7.9 adds an interactive cloth workbench and a reusable local tool registry. It advances the controls needed for v0.8 without promoting cosmetic cloth into authoritative physics.

## Try it

Run npm run preview and open /preview/mesh.html. Focus cloth (F) moves the camera to the patch. Drag to orbit; a short tap on the cloth selects its nearest point. The Point dropdown supplies an alternative selection method. Points 0–6 form the fixed top row. The gold sphere follows the selected point, and the cyan line shows the current wind vector at that point. The inspector reports world coordinates and actual control state.

| Tool | Shortcut | Rule |
|---|---|---|
| Pause / resume | P | Toggles automatic simulation |
| Single step | . | Requires pause and no reduced-motion preference |
| Apply impulse | I | Requires running cloth, a nonzero wind vector and an unpinned selection |
| Reset cloth | R | Restores positions, previous positions, accumulator and default wind; preserves pause choice |
| Focus cloth | F | Centers and zooms the orbit camera |
| Wireframe | W | Toggles the cloth material's wireframe mode |

Shortcuts ignore auto-repeat, modifier chords, editable content and focused form/button controls. Buttons and shortcuts dispatch through the same availability checks. Tooltips and disabled accessible labels come from the action definitions. UI handlers and keyboard listeners are removed on page exit.

## Force model and units

Wind is a three-component acceleration added to gravity. Each slider spans −6 to +6 world units/second²; the API accepts a total vector magnitude up to 12. Gravity remains −9.81 on Y. The cyan line is a display scale of half the wind vector, not a trajectory prediction.

The impulse tool normalizes the selected wind direction and applies a two-unit/second velocity change to the selected free point and nearby free points within a radius of two grid intervals. Influence falls off with grid distance. The lower-level API accepts impulse vectors of magnitude up to six and radii from zero through four. It clamps the accumulated per-point pre-integration speed to six, so repeated button presses do not add unbounded launch velocity. This is not a guarantee of an exact post-constraint speed: gravity and constraint projection also affect motion.

Pinned points cannot be pushed. Wind is defensively copied. Invalid or nonfinite force parameters are rejected before mutation. Reset restores the original cloth and default wind (0, 0, 2). Six constraint passes and the existing 120 Hz integrator remain; frame time admitted to simulation is capped at 100 ms. No self-collision, body collision, tearing, volume preservation or full rigid-body physics is implemented.

## Registry boundary

Multitool owns immutable action metadata and synchronous local handlers. execute(id) and key(key) share the same precondition path and return a typed success/failure result. Unknown tools fail explicitly. A handler exception becomes an action failure; handlers are not transactional and no automatic rollback is promised.

The mesh lab uses SoftTools as a testable controller between the registry and SoftPatch. The offline walking preview routes Cross bridge, Return and Pause through the same registry abstraction. Cross bridge is rejected while paused or faulted; Return can still rebuild a faulted local scene.

The registry does not accept remote commands, assign multiplayer authority or award inventory. Existing socket movement remains owned by the realm runtime. A future network action layer needs identity, range, sequencing and idempotency checks before it can reuse these toolbar definitions for world interactions.

## Verification

Six new tests cover equal button/key gating, failure results, registry immutability, defensive wind copying, resets, pinned/local impulses, repeated-force stability, pause/step/reduced-motion behavior, invalid selections and stub-DOM toolbar lifecycle. The repeated-force case runs 600 updates with opposing impulses and large wind, checking finite bounded geometry and unchanged anchors.

All 136 Node tests pass with a strict TypeScript build and rebuilt Babylon browser bundle. Existing real Babylon NullEngine and socket tests remain included. Actual GPU point picking, visual vector alignment, touch controls and mobile layout still require real-browser verification. Python validation sources are unchanged; their earlier v0.7.8 verification is retained as historical evidence.

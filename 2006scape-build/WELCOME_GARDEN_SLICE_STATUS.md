# Welcome Garden Vertical Slice Status

## Completed milestone

The first connected Copper Lantern vertical slice now exists as a clean-room local demo. It composes the beginner safe area, guide package, appearance system, motion controller, world detail generator, presentation organization, overview/HUD data, and a synthetic local authority behind explicit TypeScript ports.

The slice supports the following local flow:

> Boot → protected spawn → move inside the garden → preview cosmetics → confirm cosmetics → inspect the departure gate → confirm departure → render the current avatar, HUD, anchors, and micro-details.

The local authority is deliberately labeled `local-demo`. It does not claim to be an online server, does not load Drive material, and does not use the Ashfen manifest as runtime authority.

## New files

- `src/cleanroom-client/welcome-garden/welcome-garden-slice.ts`
- `src/cleanroom-client/welcome-garden/welcome-garden-slice.test.ts`

## Authority boundary

The `GardenAuthorityPort` exposes only `load()` and `submit(intent)`. The demo authority accepts three original intent types: movement request, appearance confirmation, and departure confirmation. It owns the canonical tile, revision, confirmed appearance, and departure availability. Invalid destinations are rejected. Cosmetic confirmation is revision-checked. Departure is blocked until cosmetic confirmation succeeds. Request IDs are deduplicated in the local receipt map.

The scene controller owns presentation state such as selected anchors, guide progress display, pocketbook selection, map-open state, notices, pending request indicators, cosmetic preview state, and departure UI state. The renderer-facing model includes the avatar pose, world-space position, HUD overview, anchors, and deterministic decorative details. None of those presentation values are authoritative.

## Verification

The complete clean-room client set passes strict TypeScript checking. The compiled local slice test passes all assertions for boot, protected spawn, accepted movement, invalid movement rejection, cosmetic confirmation, gate enablement, departure inspection, departure confirmation, HUD construction, anchor count, detail generation, and tile-to-world conversion.

```text
tsc --noEmit --strict
welcome-garden-slice: all assertions passed
```

## Next gates before online or public use

The next implementation should add a real original protocol boundary around the same authority port. It should use intent-only commands, scoped revisions, single-use admission tickets, and authoritative snapshots. After that, add minimum persistence for the character snapshot, confirmed appearance, tutorial steps, discoveries, inventory, command receipts, and audit records.

A browser/WebDev renderer can now be attached to the `GardenRenderModel`. It should remain a passive projection and should be tested with screenshots. The launcher should remain deferred until a direct clean-room client build, persistence/restore drill, package artifact, and release-provenance gate pass.

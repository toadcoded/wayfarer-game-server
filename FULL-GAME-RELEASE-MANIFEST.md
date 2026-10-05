# Project Copper Lantern — full-game release package

**Release:** `full-game-2026-10-05`

This package is the complete current repository snapshot, not the smaller `clean-room-runtime` slice. It includes the Wayfarer browser/game runtime, generated 3D/browser bundles, original artwork and assets, world and character systems, verification/replay evidence, legacy/reference source records, and the recovered Copper Lantern/2006scape client/server source.

## Package boundary

Included:

- Complete tracked repository source and documentation
- Wayfarer TypeScript authoritative realm and browser client
- Babylon/WebGL scene, mesh, character, wildlife, terrain, navigation, movement, combat, skills, persistence, transport, and rendering modules
- `preview/` browser bundles, assets, WASM/data files, and generated art
- `verification/`, `audit/`, `research/`, `references/`, and legacy/reference records
- `2006scape-build/` Copper Lantern TypeScript client and Go authoritative gateway
- Release manifests, scripts, inventories, and test evidence

Excluded from the distributable archive:

- `.git/` history and repository internals
- `node_modules/` dependency installations; dependencies are restored with the checked-in lockfile/package manifests
- Temporary sandbox logs and machine-local caches

The earlier `Project-Copper-Lantern-clean-room-runtime-2026-09-25.zip` remains in the repository as a historical release artifact; the new full-game ZIP is the package to use for the complete snapshot.

## Validation completed

- **Wayfarer full suite:** `316/316` tests passed via `npm test`; strict TypeScript build completed.
- **Copper Lantern TypeScript:** `8/8` standalone regression test files passed, plus strict TypeScript compilation.
- **Copper Lantern Go authoritative server:** `17/17` top-level Go tests passed; the vertical-connector table also passed all 10 subtests (`38` Go pass events including subtests).
- **Combined top-level checks represented here:** `341` (`316 + 8 + 17`). The count is intentionally reported exactly rather than rounded to 340.

## Reproduction

```bash
# Wayfarer
npm ci --ignore-scripts
npm test

# Copper Lantern
cd 2006scape-build
./scripts/check-cleanroom.sh
```

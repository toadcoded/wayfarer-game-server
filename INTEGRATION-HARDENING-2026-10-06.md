# Final Integration and Hardening Record

**Release:** `full-game-2026-10-06-hardened`
**Repository:** `toadcoded/wayfarer-game-server`

## Canonical integration boundary

The pushed `main` repository is the canonical build source. It contains the complete tracked Wayfarer realm, browser client, generated runtime bundles, preview assets, documentation, tests, `2006scape-build/` Copper Lantern clean-room source, legacy/reference records, and release evidence.

The linked Google Drive folder is the source/archive governance layer. Its `01_CANONICAL_BUILD` content is represented in the repository release manifest. Large historical and superseded archives remain preserved for provenance, but are not blindly nested into the runtime: importing a duplicate archive would add stale dependencies, duplicate assets, and an untestable second authority. The current package includes the usable source and its provenance records instead.

## Wired runtime systems

- Authoritative Node realm and WebSocket transport
- Persistent SQLite profiles with validated saves and WAL/FULL durability
- One-time ten-character cross-device link codes with ten-minute expiry
- Xam autonomous protected NPC with persisted progression
- Server-authoritative combat, practice, gathering, crafting, inventory, quest, and progression loops
- Expanded deterministic valley, navigation, terrain, props, wildlife, weather, and grounded sky
- Babylon 3D client with 2D isometric fallback and render recovery
- Validated click-to-walk for 3D ground picking and 2D fallback targeting
- Humanized avatars, breathing/sway/head-bob motion, procedural music, and sound effects
- Security headers, same-origin WebSocket checks, request/socket rate limits, payload bounds, profile capacity limits, path traversal rejection, and persistence fault handling
- Copper Lantern/2006scape source retained and independently validated under its clean-room boundary

## Hardening changes in this release

1. Link-code generation now uses rejection sampling rather than modulo-biased random bytes.
2. Link-code expiry is calculated once and stored/returned transactionally with the same timestamp.
3. Link-code redemption is covered by a direct persistence regression: strict format, single-use behavior, invalid input rejection, and server-side expiry.
4. Deployment documentation now accurately describes cross-device save linking and its security boundary.
5. Atlas copy now identifies harvesting as server-authoritative instead of claiming it is unimplemented.
6. The full release manifest now records the hardened validation totals.

## Validation evidence

- Wayfarer: `npm test` — **317 passed, 0 failed**
- Wayfarer strict build: `npm run build` completed
- Copper Lantern: `2006scape-build/scripts/check-cleanroom.sh` completed successfully
- Public realm: health endpoint returned `ready: true`
- Public realm headers: CSP, `nosniff`, same-origin referrer policy, restrictive permissions policy, and no-store behavior confirmed
- Xam endpoint: live state returned with protected/nonblocking identity and persisted progression

## Reproduction

```bash
npm ci --ignore-scripts
npm test
npm run build
cd 2006scape-build
./scripts/check-cleanroom.sh
```

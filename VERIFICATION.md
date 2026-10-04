# rc.11 Skilling verification

- TypeScript and both Babylon bundles build with existing pinned installed dependencies. 231 Node tests pass, zero failures/skips: `verification/rc11-tests.txt`.
- Eight new tests cover independent profession XP, cooldown/range/pack enforcement, exact two-stage crafting recipes, contributor-only essence once per clear, strict legacy-save migration, cooldown rebasing, private banks, overflow rejection and detached rollback. Full gather/bank/PvM/craft route passes in the reducer.
- `verification/rc11-skilling-network.mjs` runs the new route over real local WebSockets with server-authoritative walking in the collision world, no teleport or pre-granted resources. It tests range rejection, three professions, full pack, actual return trip, bank deposit, missing-essence craft rejection, reopen persistence and deterministic replays. Records/results are `rc11-skilling-*.json`.
- Fresh contract-10 restart/combat captures and deterministic replays use `rc11-network-replay.mjs` / `rc11-combat-network.mjs`. Combat XP and local-profile reopening remain verified.
- Two Python tests and eight asset validations pass. No clean dependency installation is claimed.
- No new GPU/browser/mobile visual pass is claimed. Existing WebGL limitation remains; runtime 2D fallback retained. No production auth, transactional cloud database, PvP/trade economy, rare loot table, equippable sack or final-release claim.

## Historical rc.10 evidence

- Strict TypeScript and both Babylon bundles build with already-installed pinned dependencies; no clean installation is claimed.
- 223 Node tests pass, zero failures/skips: `verification/rc10-tests.txt`. New coverage: six rigs, pinned cape vertices, finite wind deformation, paused motion, cleanup, weapon swapping, full realm scene, changing skins and development text-frame forwarding.
- Fresh contract-9 network/profile/replay recordings: `verification/rc10-network-*.json`, `rc10-combat-*.json`. Exclusive Strength XP and profile reopening pass. Contract remains 9.
- Two Python tests pass and eight assets validate.
- Cloud browser loads the page and 2D fallback; initialization diagnostic is `WebGL not supported`. No GPU screenshot, orbit check, 3D playthrough or mobile-layout pass is claimed.
- The supervised development bridge initially forwarded text packets as binary. Fixed and regression-tested in a fresh independent process. The already-running cloud bridge was not restarted a third time; its failed Join is not claimed as a pass.
- Earlier evidence below is historical. Final release, reference-fidelity, production authentication/cloud durability, PvP and economy remain open.

## Historical rc.9 evidence

- Strict TypeScript/Babylon build and all 218 Node tests pass: `verification/rc9-tests.txt`.
- Ten new tests cover exclusive XP, explicit mode timing, rejected-action XP, overkill, staff mode compatibility, legacy save migration, restore, rollback, malformed progression/forged grants/private snapshots, level thresholds/caps and independent requirements.
- Fresh contract-9 restart and combat recordings: `verification/rc9-network-*.json`, `rc9-combat-session.json`, `rc9-combat-results.json`; their matching rc9 harnesses are reproducible. Combat transport checks assert 64 Strength XP and zero Attack/Defence XP from a 16-damage maul hit, cooldown rejection without extra XP, and profile reopening.
- Asset validation still passes for all eight assets. No clean dependency installation or fresh Chromium rendering, mobile layout, PvP, account economy, quiver, sack, cape equipment or production durability test is claimed.

## Historical rc.8 evidence

- TypeScript/Babylon build and all 208 Node tests pass: `verification/rc8-tests.txt`.
- Two Python tests pass and all eight asset files validate.
- Three new tests cover Seraphine appearance replication/restoration, no granted equipment, source dimensions/menu integration and dimension/pixel budget rejection.
- Fresh contract-8 recordings: `verification/rc8-network-before.json`, `rc8-network-after.json`, `rc8-combat-session.json`; results in corresponding rc8 results files. Rerun with `rc8-network-replay.mjs` and `rc8-combat-network.mjs`.
- Original transparent PNG is unchanged. One static pose with movement bob/lean; no directional walk cycle, 3D rig or unique abilities.
- No fresh browser rendering/mobile-layout verification is claimed. Chromium previously failed before page startup. No production auth, cloud storage, load/soak or art-license verification is claimed.

## Historical rc.7 verification (not current-contract evidence)

- Full TypeScript and Babylon bundle build passed with existing installed pinned dependencies.
- 205 tests passed; zero failed, skipped or cancelled: `verification/rc7-tests.txt`.
- Nine new encounter tests supplement the 196-test baseline. The existing socket-client test was updated for the intentional removal of the default appearance send at Join.
- Fresh restart WebSocket recordings each verify six events: `verification/rc7-network-before.json`, `rc7-network-after.json`, and `rc7-network-results.json`.
- Fresh successful-hit WebSocket recording verifies maul damage and cooldown from a server-prepared earned-item fixture at a walkable far landing: `verification/rc7-combat-session.json` and `rc7-combat-results.json`. Six events replay to hash `1d55c5ecb2eb5ff5ee5ae50845f2d056db24c118ee50fbc861fe85b07e46dd4a`. No identity cookie is recorded.
- Chromium 153 crashed with SIGSEGV before page startup. No new visual, mobile-layout or browser-combat assertions ran. The agent-browser CLI is unavailable. Status: `verification/rc7-browser-status.json`; pending harness: `verification/rc7-browser.mjs`.
- Earlier logs/screenshots/journals remain historical and use earlier contracts. They are not fresh rc.7 evidence. Use revision-7 journals with the current replay CLI.
- No clean registry install, load/soak test, physical mobile/browser matrix, power-loss test, multi-process store test or production auth/database test was performed.

Run `npm test`, `node verification/rc7-network-replay.mjs` and `node verification/rc7-combat-network.mjs`. Run the browser harness with its optional verification dependencies and a compatible Chromium runtime. The ZIP excludes installed dependencies, browser binaries and profile databases.

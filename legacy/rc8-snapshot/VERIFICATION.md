# rc.8 Xam verification

Fresh local verification for the Xam kernel:

- `tsc -p tsconfig.verify.json` passed.
- Focused authority/gameplay/Xam suite: **66/66 tests passed**.
- Full local `test/*.test.mjs` discovery: **171 tests passed; 7 modules could not load** because this execution environment does not contain the package dependencies `ws` and `@babylonjs/core`. The seven failures are module-resolution failures, not assertion failures: compatibility, host-lifecycle, mesh-nexus, network-client, rc6-host-persistence, replay and transport.
- Xam's diversity stress test simulated 120,000 authoritative ticks and observed every registered skill while enforcing the 6,000-tick / five-minute per-skill ceiling.
- Client attempts to send an `xam` action are rejected. A malformed server-side skill directive is rejected without faulting the realm.
- Xam has no HP, damage-receiver, player-target or retaliation field/path and is not a combat participant.

Logs: `verification/rc8-core-xam-tests.txt` and `verification/rc8-all-tests.txt`.

# rc.7 verification

- Full TypeScript and Babylon bundle build passed with existing installed pinned dependencies.
- 205 tests passed; zero failed, skipped or cancelled: `verification/rc7-tests.txt`.
- Nine new encounter tests supplement the 196-test baseline. The existing socket-client test was updated for the intentional removal of the default appearance send at Join.
- Fresh restart WebSocket recordings each verify six events: `verification/rc7-network-before.json`, `rc7-network-after.json`, and `rc7-network-results.json`.
- Fresh successful-hit WebSocket recording verifies maul damage and cooldown from a server-prepared earned-item fixture at a walkable far landing: `verification/rc7-combat-session.json` and `rc7-combat-results.json`. Six events replay to hash `1d55c5ecb2eb5ff5ee5ae50845f2d056db24c118ee50fbc861fe85b07e46dd4a`. No identity cookie is recorded.
- Chromium 153 crashed with SIGSEGV before page startup. No new visual, mobile-layout or browser-combat assertions ran. The agent-browser CLI is unavailable. Status: `verification/rc7-browser-status.json`; pending harness: `verification/rc7-browser.mjs`.
- Earlier logs/screenshots/journals remain historical and use earlier contracts. They are not fresh rc.7 evidence. Use revision-7 journals with the current replay CLI.
- No clean registry install, load/soak test, physical mobile/browser matrix, power-loss test, multi-process store test or production auth/database test was performed.

Run `npm test`, `node verification/rc7-network-replay.mjs` and `node verification/rc7-combat-network.mjs`. Run the browser harness with its optional verification dependencies and a compatible Chromium runtime. The ZIP excludes installed dependencies, browser binaries and profile databases.

# rc.19 fresh verification

Current source verification on 2026-10-04: 269 Node tests passed, 0 failed, 0 skipped. `npm test` performs strict TypeScript compilation and builds the browser bundles before running the complete suite. Two Python unit tests and eight asset catalog validations also pass.

Eight new practice tests cover all 23 methods, exact single-skill awards with no item output, bounded queues and skill switching, exact server-tick recovery, reconnect rebasing, invalid packets/fields/distances, XP cap and private state validation, schema-4 migration, real landing fixture placement/resource disposal, dead-player rejection and transaction rollback on a server position fault.

Five fresh actual-WebSocket workflows cover practice/profile restart, existing identity/quest restart, skilling/banking, combat/pure builds, and travel. Captures replay completely and deterministically under simulation contract 13. See verification/rc19-* logs, journals and result files. Practice captures contain 6 and 56 recorded events, with final replay hashes e9064b26f0fb24e9455d13d5f8114f1768450c9219a5144bf5e4ba2731f74623 and 3ea66030242faa1b4af22415ef7bec90068ff1f8bd93efb0cf6df80dfd13fb4c.

Babylon NullEngine verifies geometry, placement checks, nonpickable fixtures and cleanup. Earlier Chromium startup failures remain unresolved; no actual WebGL/GPU frame rate, physical touch-device usability or screenshot fidelity is claimed. Historical verification files remain historical and are not evidence for current unexecuted checks. There is no guarantee of zero bugs or a non-exploitable public MMO; reward-rate controls and the listed tests establish a bounded rehearsal feature.

The deterministic package script verifies ZIP CRC and every manifest hash, then a second packaging pass is compared byte-for-byte by SHA-256. The ZIP excludes dependencies, runtime profiles, credentials and temporary helpers. Use npm ci to install the locked dependencies.

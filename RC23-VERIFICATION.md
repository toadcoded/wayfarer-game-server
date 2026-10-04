# rc.23 fresh verification · 2026-10-04

- Strict TypeScript compilation and all browser asset bundles completed successfully (`verification/rc23-build.log`).
- Final complete Node suite: **286 passed, 0 failed, 0 skipped** (`verification/rc23-final-suite.log`). Includes safe/stable eight-NPC placement, distinctive finite animated rigs, full disposal and live client dialogue checks.
- Local dialogue checked against the real WebSocket-connected client with a stub DOM: Talk shows Halden's line, sends no accepted action and leaves the complete authoritative inspection unchanged. This is not actual browser/GPU evidence.
- Two Python tests passed; all eight asset manifests validated (`verification/rc23-python.log`).
- Fresh real WebSocket persistence/reopen, active training, gathering, combat and walk/jog/run scripts passed; deterministic journals replayed completely (`verification/rc23-network.log` and `verification/rc23-*-results.json`). Existing gameplay hashes remain unchanged by this cosmetic cast.
- ZIP is generated twice after verification; packaging validates every manifest SHA-256 and ZIP CRC. Its final digest is reported by the packaging output rather than embedded recursively in this report.

No production deployment, cloud database migration or full browser/phone visual review was performed. New cast dialogue is local flavour; new NPC services and quests remain unimplemented. Max skill 99, max combat 126, XP curve, server authority, simulation contract revision 14 and save schema revision 5 remain unchanged.

# v0.9 rc.1 fresh verification · 2026-10-04

- Strict TypeScript build and all browser bundles succeeded (`verification/v09-rc1-final-tests.log`).
- Complete current suite: **297 passed, 0 failed, 0 skipped** (`verification/v09-rc1-complete-tests.log`).
- Renderer load coalescing, late-load cleanup, failure fallback/retry, cleanup exceptions, actual NullEngine realm disposal/recreation, corrupt/oversized/blocked HUD preferences and client reset/retry checks passed.
- Both bundled original paintings are served as image/jpeg with byte-for-byte equality; landscape proportions and invalid-art/placement rejection are checked.
- Fresh actual WebSocket persistence/reopen, active practice, gathering, combat and walk/jog/run scripts passed; every generated journal replay completed (`verification/v09-rc1-network.log` and corresponding JSON records).
- Two Python tests and eight source asset manifests passed (`verification/v09-rc1-python.log`). Current contract manifest was regenerated.
- Packaging validates ZIP CRC and every file-manifest SHA-256; two packaging outputs are compared for determinism.

No actual browser/phone visual review or production cloud deployment was performed. See V09-INTEGRATION.md for current implementation and open gates. Previous candidate evidence remains historical. The texture callback/retry path is implemented but real browser networking failure still requires manual verification.

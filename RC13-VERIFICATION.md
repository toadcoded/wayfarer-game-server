# Fresh rc.13 verification — 2026-10-04 UTC

- Clean npm ci completed with pinned Babylon 9.28.0, PGlite 0.5.4, esbuild 0.28.2, TypeScript 6.0.3 and Emscripten types 1.41.6.
- Strict TypeScript compilation and four browser bundles passed; no skipLibCheck workaround is used.
- All 236 Node tests passed, zero failures/skips. New checks cover actual PGlite filesystem persistence/reopen/clear and invalid-value rejection, the restricted visual table, same-origin worker and data routes, WASM MIME/CSP and real WASM compilation, and simulated Babylon context loss/restoration with preset frame limits.
- Fresh rc.13 live transport scripts rerun the skilling trip, banking and profile restoration, quest replay and earned-maul Strength-only combat checks. Their logs/results are under verification/rc13-*; older recordings remain historical.
- Fresh Python checks and asset validation are recorded separately under rc13 filenames.

The database test runs actual PostgreSQL/WASM on Node with filesystem persistence. It does not prove browser IndexedDB persistence or multi-tab worker leadership. Babylon scene tests use NullEngine and simulated context events; HDR/bloom/MSAA appearance, physical WebGL recovery and sustained 60 FPS remain unverified. Maximum is a selected preset, not a measured quality rating or completed reference-art conversion.

Simulation contract revision 10 and gameplay-save schema 3 are unchanged. PGlite stores only visual quality; it cannot restore or submit player gameplay state. Server authentication/transactional cloud persistence remain separate launch gates.

Deterministic packaging verifies ZIP CRC and every per-file SHA-256 manifest entry. The final ZIP hash is emitted outside the archive. GPU and browser-worker limitations are documented in WEBGL-PGLITE.md.

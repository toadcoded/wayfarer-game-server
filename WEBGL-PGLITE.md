# WebGL / Babylon / PGlite integration — rc.13

## Renderer surface

`Realm3D.setQuality()` accepts only `maximum`, `high` or `balanced`. Maximum is the default. Babylon selects a supported WebGL context and retains its automatic context rebuilding. Rendering pauses during context loss; restoration invalidates the viewport and resumes from the latest server state. No client graphics event advances simulation time.

| Preset | Render target | Maximum pixel ratio | Requested MSAA | Bloom | FXAA |
| --- | --- | --- | --- | --- | --- |
| Maximum | 60 FPS | 2 | 4 samples | Yes | Yes |
| High | 45 FPS | 1.5 | 2 samples | Yes | Yes |
| Balanced | 30 FPS | 1 | 1 sample | No | Yes |

Targets are caps, not measured performance promises. Actual MSAA is bounded by engine capabilities. Device pixel ratio is capped by the preset. The browser's display resolution, refresh rate and GPU determine results. HDR/image processing uses modest exposure, contrast and bloom; it does not add reference-quality art, shadows or new character animation assets.

2D fallback remains available when renderer initialization fails. Hidden 2D work is skipped when 3D is active. WebGL context-loss tests simulate engine notifications using NullEngine; they do not prove recovery on physical GPUs.

## Local database plugin surface

Pinned PGlite 0.5.4 supplies real PostgreSQL/WASM. `VisualSurface` exposes only a versioned ID, `getQuality`, `setQuality`, `clear` and `close`. Its table permits exactly three quality values. Queries use parameterized SQL and an atomic upsert for the singleton preference. It has no gameplay state, account, inventory, reward or arbitrary-SQL UI.

The **Save visuals locally**, **Load saved visuals** and **Clear saved visuals** controls lazily import the plugin. No database is downloaded on ordinary realm startup. The plugin uses PGliteWorker and a stable worker-group ID, with an IndexedDB data directory. PGlite's multi-tab leader election owns the single database connection. Initialization has a 20-second readiness deadline; failure leaves the current visual settings and multiplayer client working. Page exit closes the plugin surface.

WASM and data files are served from this build's own origin. The host serves application/wasm and allows same-origin workers and WebAssembly compilation through `wasm-unsafe-eval`, without adding JavaScript `unsafe-eval` or third-party scripts. Development loopback identity/persistence remains unchanged.

The PGlite database stores only a device-local visual preference. It is not production server persistence and does not restore player progress. The separate app-builder authentication stack remains separate.

## Evidence and open gates

Fresh tests exercise real PGlite filesystem persistence/reopen/clear, rejected values, the single visual table, served worker/WASM/data assets and actual WASM compilation. Babylon tests exercise presets and simulated context loss/restoration. Strict compilation includes upstream Emscripten types rather than disabling library checks.

Browser IndexedDB, worker leadership across tabs, physical WebGL recovery, bloom appearance and sustained mobile GPU performance still require real-browser/device QA. Node filesystem testing does not substitute for those checks. No database/vector extension is enabled merely because PGlite supports it; vector search and reactive queries are future optional adapters.

Official implementation references: https://pglite.dev/docs/api and https://pglite.dev/docs/multi-tab-worker .

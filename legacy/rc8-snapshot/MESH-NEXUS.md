# Mesh and asset integration: v0.7.8

## Concrete wiring

Both walking previews use CharacterRenderer → loadSpriteSheet → AssetFetcher. The asset studio uses the same byte loader and runtime catalog validator. The main game remains authoritative on the existing fixed movement clock. Python is an offline validation tool, not a second gameplay server.

AssetFetcher admits only local /preview/assets/ PNG or JSON paths. It permits two active requests and at most sixteen distinct pending keys. Concurrent callers share a transfer and receive their own byte copy. At most sixteen successful byte arrays are retained. Each transfer has a four-second deadline, redirects are rejected, and a 5xx response gets one additional attempt. Other failures, including timeouts, fail immediately so the character renderer can retain its vector fallback. Images are capped at two million decoded transfer bytes and catalogs at 32 KiB, independent of Content-Length. MIME and PNG dimensions are checked before decode. Loaded image bitmaps are closed after copying to canvas.

The catalog validator rejects unknown fields, coercion, duplicate IDs, invalid frame timing, oversized dimensions and out-of-frame crops. Python checks the same catalog and actual PNG dimensions. For changed catalog data, run npm run assets:catalog then npm run build to refresh the compiled cosmetic catalog.

The HTTP hosts negotiate gzip for text/JSON assets of at least 1024 bytes if compression saves space; explicit gzip;q=0 is respected. PNGs/GIFs are already compressed and remain untouched. Vary and Content-Length describe the chosen representation. WebSocket per-message compression remains disabled. Compression applies to static assets, not movement packets.

## Babylon and multipoint cloth

/preview/mesh.html loads a locally bundled Babylon 9.28.0 module. It renders the existing realm geometry with orbit controls and a 7 × 9 point cloth patch. The top row is fixed. Gravity, light constant wind, damped Verlet integration and six distance-constraint passes run at 120 Hz. Each frame contributes at most 100 ms; extra stall time is discarded. Pause and reduced-motion preferences suspend cloth advancement.

The cloth has no self-collision, player collision, tearing or world interaction. It is a visual experiment beside the realm, not a soft-body replacement for the player. The mesh adapter validates finite geometry and index bounds, calculates normals, supports updates, and owns mesh/material disposal. Real Babylon NullEngine tests verify that adapter, but do not verify WebGL pixels.

The engine's declarations require modern WebGPU types. TypeScript is pinned to 6.0.3 instead of disabling declaration checking. esbuild 0.28.2 produces the included browser bundle. The license and NOTICE are retained under licenses/. Existing canvas previews still work without installing Babylon; the prebuilt lab bundle is included too.

## Ports and startup

- npm run preview: offline HTTP at 127.0.0.1:8080.
- npm run realm: shared realm HTTP/WebSocket at 127.0.0.1:8081.
- PORT=8082 npm run realm: a second independent realm on port 8082.

Two hosts were tested concurrently using OS-assigned ports. Each has its own realm, origin and player state. This does not implement cross-port federation, sharding or character transfer. Use the exact address printed by each realm host.

## Python development checks

Use an isolated environment if installing the optional tools:

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r python/requirements.txt
python3 python/validate_assets.py
python3 -m unittest discover -s python
python3 -m mypy --strict python/validate_assets.py python/test_validate_assets.py
```

Requirements pin Pydantic 2.13.5 and mypy 2.3.1. They are not needed to run the game. No package was published to PyPI. The strict models reject coerced input and extra fields.

## Quality and limitations

Upscayl was not installed; no AI upscaling or new pixel detail is claimed. Source GIFs and lossless frame sheets are preserved. Pixel-art nearest-neighbor drawing remains the character style. Higher-resolution replacements should retain frame layout, crop bounds, timing and provenance, then pass the asset validators.

130 Node tests and two Python tests pass. The Node suite includes fetch stubs for failure modes, real HTTP/WebSocket operations and real Babylon NullEngine mesh operations. Strict mypy passes. A real browser still needs to verify the mesh lab, GPU availability, asset decode, animation appearance and mobile controls before v0.8 integration.

## Primary implementation references

- Babylon custom vertex data examples: https://babylonjsguide.github.io/advanced/Custom
- Babylon engine source and declarations, pinned package: https://github.com/BabylonJS/Babylon.js
- Pydantic strict mode: https://github.com/pydantic/pydantic/blob/main/docs/concepts/strict_mode.md

These references inform API use; test results above come from this package's own execution.

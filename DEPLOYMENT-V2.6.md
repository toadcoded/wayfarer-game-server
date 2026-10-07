# Wayfarer v2.6.0 — Full Game Package

This distribution contains the complete Wayfarer browser client and multiplayer server, including source, assets, compiled client bundles, runtime dependencies, tests, and server tooling. Runtime player-save databases and credentials are excluded.

## Requirements

- Node.js **24.19.x through 24.x** (the server preflight rejects unsupported runtimes)
- npm from the selected Node.js installation

## Verify and build from source

```sh
npm ci
npm test
```

`npm test` builds v2.6.0 and runs the complete test suite. For a build without tests, use `npm run build`.

## Temporary HTTPS-proxied multiplayer host

For a public HTTPS proxy that forwards to port 8081, run:

```sh
NODE_ENV=production \
PORT=8081 \
PUBLIC_ORIGIN=https://your-exact-public-origin \
TRUST_PROXY=true \
DATA_DIR=runtime \
npm start
```

`PUBLIC_ORIGIN` must be the exact HTTPS origin, without a trailing slash. Bind only through the proxy-backed listener. The server serves the game at `/`, health at `/health`, and multiplayer WebSocket traffic at `/socket`. The authoritative server persists guest profiles in SQLite under `DATA_DIR`; keep that directory writable. Sandbox storage is temporary and may be reset when the environment is recycled.

For local-only play, run `npm run start:local` (loopback-only by default). Do not expose local-only mode directly to the public internet.

## v2.6 gameplay and presentation

- Server-authoritative skeleton, zombie, thug, bandit, and mugger encounters; the Broken Standard campsite is multi-combat.
- Steel warhammer and battleaxe drops from skeletons and zombies, plus steel dagger, sword, and rapier drops from campsite enemies (each weapon has its specified 5% drop chance).
- Melee slash, crush, strike, and lunge styles; bow attacks and rune magic with authoritative projectile travel and impact ticks.
- Slightly smaller avatars, faster walk/jog/run movement, authored 3D hostile models and projectile/loot visuals, 2D fallback encounter art, layered highlands, and thicker render-only terrain/building foundations.

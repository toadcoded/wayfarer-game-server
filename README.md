# Wayfarer v1.0 — official server package

A runnable, server-authoritative multiplayer realm derived from the supplied v0.9 rc.3 candidate. Version 1.0 names this source/server release; it does not mean a public host has been provisioned or every planned MMO feature is complete.

## Run locally

Use Node 24.19.x. From this folder:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:8081`. Your guest character is saved in `runtime/realm.sqlite`; the browser holds its signed identity cookie. A separate browser profile represents another player. Two tabs in the same browser profile share an identity, and only one can join at a time. Clearing cookies loses access to that guest character; account recovery and cross-device login are not implemented.

## Publish with HTTPS

The package includes a Docker image build, Docker Compose stack, and Caddy HTTPS gateway. On an always-on Linux host with Docker Compose, point your domain at the host, allow inbound TCP 80/443 and optionally UDP 443, then:

```sh
cp .env.example .env
# Set DOMAIN to your real hostname and EMAIL to your certificate contact.
docker compose config
docker compose up -d --build
```

Visit `https://YOUR_DOMAIN`. The game server has no published direct port. Player data and certificates use persistent Docker volumes. Read [DEPLOYMENT.md](DEPLOYMENT.md) for verification, backup, restore, upgrades, configuration, and hosting boundaries. A domain and persistent host are required; neither was created during this release.

## Included gameplay

- A shared Willowglass Causeway, authoritative movement at 20 Hz, navigation, walking/jogging/running and energy.
- Quiet Tithe quest, equipment/inventory, the cooperative Lantern Warden, XP and bank state.
- Gathering systems and explicit practice drills across 23 skills. Practice drills are not complete implementations of every profession.
- Server-controlled protected Xam, persistent progress and continuous simulation even without human players.
- Babylon 3D rendering with a 2D fallback, articulated characters, NPCs, wildlife, weather, framed art, HUD settings and touch controls.
- ABC cape wind controls retained as cosmetic motion.

## Changes for v1.0

SQLite WAL transactions with full synchronization replace the production JSON save path. A separate SQLite OS lock prevents competing realm processes using one data directory and releases automatically after a crash. New guest profiles are created only when loading the game page, with bounded enrollment/request/upgrade rates. Public mode requires an exact HTTPS origin and enforces origin, Host, signed-cookie and duplicate-session checks. Secure/HttpOnly cookies, CSP, health checks, structured lifecycle logs, graceful shutdown, backup and legacy migration tools are included.

Default capacity is 16 human players plus Xam; configuration accepts 1–32 humans. The 16-player automated check verifies basic concurrent operation, not sustained load or a 32-player performance guarantee.

## Verification and limits

Fresh evidence is in [V1-VERIFICATION.md](V1-VERIFICATION.md) and `verification/v1-*`. Strict TypeScript and browser bundles build successfully; the full Node suite, Python tests, asset checks and dependency audit were run. Real sockets and real child processes verify persistence after SIGKILL, shutdown saves after SIGTERM, backup restoration and exclusive realm ownership.

Browser visual verification remains open: cloud browser localhost access was blocked, and local Chromium installation failed. Docker/Caddy execution was not possible because this environment has no Docker daemon. The Docker build is included as a CI check, but that CI has not run here. Physical iPhone/Android/GPU rendering, live DNS/TLS and Internet end-to-end checks remain unverified. This release has not been published online.

The provided academy, moonlit realm and cavern images, and Seraphine video, are design references. They are not playable locations or rigged video assets in this release. Their hashes and intended role are recorded in `references/v1-design/`.

This is one persistent small realm, with guest identities. There is no multi-region/sharded authority, account recovery, PvP economy, signed native mobile app or public uptime guarantee. Shared encounter/world state resets at restart; player exports and Xam progress persist. Abrupt termination can lose the latest unsaved interval (one second by default); stopped servers award no offline XP. SQLite requires a reliable persistent local filesystem, not ephemeral function storage or a network filesystem shared by replicas.

Historical rc.3 source, release notes, prior evidence and the older rc.8 snapshot remain included as reference material. [verification/v09-rc3-README.md](verification/v09-rc3-README.md) contains the previous README. The v1.0 entrypoint is solely `tools/server.mjs`; historical servers are not deployed by Docker.
